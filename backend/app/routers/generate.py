import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.models.schemas import GenerateRequest, TaskResponse, TaskStatus
from app.services.queue import task_queue
from app.models.database import get_db, Generation

router = APIRouter(prefix="/api", tags=["generate"])

@router.post("/generate", response_model=TaskResponse)
async def generate_image(request: GenerateRequest, db: AsyncSession = Depends(get_db)):
    task_id = str(uuid.uuid4())
    task = task_queue.submit(task_id, request)
    
    if task.status == TaskStatus.FAILED:
        raise HTTPException(status_code=503, detail=task.error)
        
    return TaskResponse(
        task_id=task.task_id,
        status=task.status,
        position=task_queue.get_queue_depth()
    )

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task_status(task_id: str, db: AsyncSession = Depends(get_db)):
    task = task_queue.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status == TaskStatus.COMPLETED and task.result:
        # Save to DB if not already saved
        existing = await db.get(Generation, task_id)
        if not existing:
            gen = Generation(
                id=task_id,
                prompt=task.request.prompt,
                model=task.result.get("model"),
                width=task.request.width,
                height=task.request.height,
                steps=task.result.get("steps"),
                guidance_scale=task.result.get("guidance_scale"),
                seed=task.result.get("seed"),
                filename=task.result.get("image_url", "").split("/")[-1],
                thumbnail=task.result.get("thumbnail_url", "").split("/")[-1],
                status="completed",
                generation_time_s=task.result.get("generation_time_s", 0.0),
                lora_name=task.request.lora_path.split("/")[-1] if task.request.lora_path else None,
                lora_scale=task.request.lora_scale if task.request.lora_path else None
            )
            db.add(gen)
            await db.commit()

    return TaskResponse(
        task_id=task.task_id,
        status=task.status,
        result=task.result,
        error=task.error
    )

@router.delete("/tasks/{task_id}")
async def cancel_task(task_id: str):
    success = task_queue.cancel_task(task_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not cancel task")
    return {"status": "cancelled"}
