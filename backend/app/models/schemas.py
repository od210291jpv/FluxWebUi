from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field, model_validator

class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Prompt for generation")
    model: Optional[str] = Field(None, description="Model path or name")
    width: int = Field(1024, ge=256, le=2048)
    height: int = Field(1024, ge=256, le=2048)
    num_inference_steps: Optional[int] = Field(None, ge=1, le=100)
    guidance_scale: Optional[float] = Field(None, ge=0.0, le=20.0)
    seed: Optional[int] = Field(None, description="Random seed")
    max_sequence_length: int = Field(512, ge=256, le=512)
    lora_path: Optional[str] = Field(None, description="Path to LoRA")
    lora_scale: float = Field(0.8, ge=0.0, le=1.0)

    @model_validator(mode='after')
    def validate_dimensions(self) -> 'GenerateRequest':
        if self.width % 16 != 0:
            raise ValueError("width must be a multiple of 16")
        if self.height % 16 != 0:
            raise ValueError("height must be a multiple of 16")
        return self

class TaskResponse(BaseModel):
    task_id: str
    status: TaskStatus
    position: Optional[int] = None
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None

class GalleryItem(BaseModel):
    id: str
    prompt: str
    model: Optional[str] = None
    width: int
    height: int
    steps: Optional[int] = None
    guidance_scale: Optional[float] = None
    seed: int
    image_url: str
    thumbnail_url: str
    generation_time_s: float
    created_at: datetime
    lora_name: Optional[str] = None
    lora_scale: Optional[float] = None

class GalleryListResponse(BaseModel):
    items: list[GalleryItem]
    total: int
    page: int
    per_page: int

class SystemStatusResponse(BaseModel):
    gpu_name: str
    vram_used_gb: float
    vram_total_gb: float
    loaded_model: Optional[str] = None
    queue_depth: int

class ModelInfo(BaseModel):
    id: str
    path: str
    defaults: dict[str, Any]

class ModelsResponse(BaseModel):
    models: list[ModelInfo]

class LoraInfo(BaseModel):
    name: str
    path: str

class LorasResponse(BaseModel):
    loras: list[LoraInfo]
