import torch
from fastapi import APIRouter

from app.models.schemas import SystemStatusResponse, ModelsResponse, LorasResponse
from app.services.pipeline import inference_service
from app.services.queue import task_queue
from app.config import settings

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status():
    gpu_name = "Unknown CPU"
    vram_used = 0.0
    vram_total = 0.0
    
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_total = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        vram_used = torch.cuda.memory_allocated(0) / (1024**3)
        
    return SystemStatusResponse(
        gpu_name=gpu_name,
        vram_used_gb=round(vram_used, 2),
        vram_total_gb=round(vram_total, 2),
        loaded_model=inference_service.get_loaded_model(),
        queue_depth=task_queue.get_queue_depth()
    )

@router.get("/models", response_model=ModelsResponse)
async def list_models():
    models = inference_service.scan_models(settings.models_dir)
    return ModelsResponse(models=models)

@router.get("/loras", response_model=LorasResponse)
async def list_loras():
    loras = inference_service.scan_loras(settings.loras_dir)
    return LorasResponse(loras=loras)
