import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
import time
from typing import Optional, Any
from app.models.schemas import GenerateRequest, TaskStatus
from app.services.pipeline import inference_service
from app.services.storage import save_image
from app.ws.notifications import manager as ws_manager
from app.config import settings

@dataclass
class Task:
    task_id: str
    request: GenerateRequest
    status: TaskStatus = TaskStatus.QUEUED
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

class TaskQueue:
    def __init__(self, max_size: int = 10):
        self.queue: asyncio.Queue[Task] = asyncio.Queue(maxsize=max_size)
        self.tasks: dict[str, Task] = {}

    def submit(self, task_id: str, request: GenerateRequest) -> Task:
        task = Task(task_id=task_id, request=request)
        self.tasks[task_id] = task
        try:
            self.queue.put_nowait(task)
        except asyncio.QueueFull:
            task.status = TaskStatus.FAILED
            task.error = "Queue is full"
        return task

    def get_task(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id)

    def cancel_task(self, task_id: str) -> bool:
        task = self.tasks.get(task_id)
        if task and task.status == TaskStatus.QUEUED:
            task.status = TaskStatus.FAILED
            task.error = "Cancelled"
            return True
        return False

    def get_queue_depth(self) -> int:
        return self.queue.qsize()

    async def worker(self):
        while True:
            task = await self.queue.get()
            if task.status != TaskStatus.QUEUED:
                self.queue.task_done()
                continue
                
            task.status = TaskStatus.RUNNING
            await ws_manager.broadcast({"type": "task_started", "task_id": task.task_id})
            
            try:
                start_time = time.time()
                
                models = inference_service.scan_models(settings.models_dir)
                if not models:
                    raise ValueError("No models found in cache directory")
                
                model_to_use = task.request.model
                if not model_to_use:
                    model_to_use = models[0].path
                    
                steps = task.request.num_inference_steps if task.request.num_inference_steps is not None else 28
                guidance_scale = task.request.guidance_scale if task.request.guidance_scale is not None else 3.5

                loop = asyncio.get_running_loop()

                def progress_callback(current, total):
                    asyncio.run_coroutine_threadsafe(
                        ws_manager.broadcast({
                            "type": "task_progress",
                            "task_id": task.task_id,
                            "step": current,
                            "total_steps": total
                        }),
                        loop
                    )

                await asyncio.to_thread(inference_service.load_model, model_to_use)
                
                image, final_seed = await asyncio.to_thread(
                    inference_service.generate,
                    task.request.prompt,
                    task.request.width,
                    task.request.height,
                    steps,
                    guidance_scale,
                    task.request.seed,
                    task.request.max_sequence_length,
                    task.request.lora_path,
                    task.request.lora_scale,
                    progress_callback
                )
                
                generation_time = time.time() - start_time
                filename, thumb_filename = save_image(image, task.task_id, settings.output_dir)
                
                task.result = {
                    "image_url": f"/api/images/{filename}",
                    "thumbnail_url": f"/api/images/{thumb_filename}",
                    "seed": final_seed,
                    "generation_time_s": round(generation_time, 2),
                    "steps": steps,
                    "guidance_scale": guidance_scale,
                    "model": model_to_use
                }
                task.status = TaskStatus.COMPLETED
                
            except Exception as e:
                task.status = TaskStatus.FAILED
                task.error = str(e)
                
            finally:
                event_type = "task_completed" if task.status == TaskStatus.COMPLETED else "task_failed"
                await ws_manager.broadcast({
                    "type": event_type,
                    "task_id": task.task_id,
                    "result": task.result,
                    "error": task.error
                })
                self.queue.task_done()

task_queue = TaskQueue(max_size=settings.max_queue_size)
