import platform
import torch
import psutil
from fastapi import APIRouter

from app.models.schemas import SystemStatusResponse, ModelsResponse, LorasResponse
from app.services.pipeline import inference_service
from app.services.queue import task_queue
from app.config import settings

router = APIRouter(prefix="/api/system", tags=["system"])

# Try to import pynvml for GPU utilisation; fall back gracefully
try:
    import pynvml
    pynvml.nvmlInit()
    _nvml_available = True
except Exception:
    _nvml_available = False


def _get_gpu_load_percent() -> float:
    if not _nvml_available:
        return 0.0
    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        util = pynvml.nvmlDeviceGetUtilizationRates(handle)
        return float(util.gpu)
    except Exception:
        return 0.0


def _get_cpu_info() -> str:
    try:
        # cpuinfo is an optional nicer source; fall back to platform
        import cpuinfo  # type: ignore
        info = cpuinfo.get_cpu_info()
        return info.get("brand_raw", platform.processor() or "Unknown CPU")
    except Exception:
        return platform.processor() or "Unknown CPU"


@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status():
    gpu_name = "CPU (no CUDA)"
    vram_used = 0.0
    vram_total = 0.0

    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_total = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        vram_used = torch.cuda.memory_allocated(0) / (1024 ** 3)

    mem = psutil.virtual_memory()
    ram_total = mem.total / (1024 ** 3)
    ram_used = (mem.total - mem.available) / (1024 ** 3)

    return SystemStatusResponse(
        gpu_name=gpu_name,
        vram_used_gb=round(vram_used, 2),
        vram_total_gb=round(vram_total, 2),
        loaded_model=inference_service.get_loaded_model(),
        queue_depth=task_queue.get_queue_depth(),
        gpu_load_percent=round(_get_gpu_load_percent(), 1),
        cpu_percent=round(psutil.cpu_percent(interval=None), 1),
        ram_used_gb=round(ram_used, 2),
        ram_total_gb=round(ram_total, 2),
        cpu_info=_get_cpu_info(),
    )


@router.get("/models", response_model=ModelsResponse)
async def list_models():
    models = inference_service.scan_models(settings.models_dir)
    return ModelsResponse(models=models)


@router.get("/loras", response_model=LorasResponse)
async def list_loras():
    loras = inference_service.scan_loras(settings.loras_dir)
    return LorasResponse(loras=loras)
