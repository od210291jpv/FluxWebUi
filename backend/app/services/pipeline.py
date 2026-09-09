import gc
import json
from pathlib import Path
from typing import Optional, Callable
import torch
from diffusers import FluxPipeline
from PIL import Image

from app.config import settings
from app.models.schemas import ModelInfo, LoraInfo

class FluxInferenceService:
    def __init__(self):
        self.pipeline: Optional[FluxPipeline] = None
        self.loaded_model_path: Optional[str] = None
        self.loaded_lora_path: Optional[str] = None

    def scan_models(self, models_dir: Path) -> list[ModelInfo]:
        """Scan models directory for FLUX model folders.
        
        Detects model type from folder name or model_index.json to set
        appropriate defaults (schnell uses guidance_scale=0.0, steps=4).
        """
        models = []
        if not models_dir.exists():
            return models
        for path in models_dir.iterdir():
            if path.is_dir() and (path / "model_index.json").exists():
                # Detect model variant from name
                name_lower = path.name.lower()
                if "schnell" in name_lower:
                    defaults = {"steps": 4, "guidance_scale": 0.0, "max_sequence_length": 256}
                else:
                    defaults = {"steps": 28, "guidance_scale": 3.5, "max_sequence_length": 512}
                
                models.append(ModelInfo(
                    id=path.name,
                    path=str(path),
                    defaults=defaults
                ))
        return models

    def scan_loras(self, loras_dir: Path) -> list[LoraInfo]:
        loras = []
        if not loras_dir.exists():
            return loras
        for path in loras_dir.rglob("*.safetensors"):
            loras.append(LoraInfo(
                name=path.stem,
                path=str(path)
            ))
        return loras

    def load_model(self, model_path: str):
        if self.loaded_model_path == model_path and self.pipeline is not None:
            return

        self.unload()

        dtype = torch.bfloat16 if settings.dtype == "bfloat16" else torch.float16
        self.pipeline = FluxPipeline.from_pretrained(
            model_path,
            torch_dtype=dtype,
            local_files_only=True
        )

        if settings.enable_cpu_offload:
            self.pipeline.enable_model_cpu_offload()
        else:
            self.pipeline.to(settings.device)
            
        self.loaded_model_path = model_path

    def generate(
        self,
        prompt: str,
        width: int,
        height: int,
        steps: int,
        guidance_scale: float,
        seed: Optional[int],
        max_seq_len: int,
        lora_path: Optional[str],
        lora_scale: float,
        progress_callback: Callable[[int, int], None]
    ) -> tuple[Image.Image, int]:
        if not self.pipeline:
            raise RuntimeError("No model loaded")

        if seed is None:
            seed = torch.randint(0, 2**32 - 1, (1,)).item()
            
        generator = torch.Generator(device="cpu").manual_seed(seed)

        if lora_path:
            self.pipeline.load_lora_weights(lora_path)
            self.pipeline.fuse_lora(lora_scale=lora_scale)
            self.loaded_lora_path = lora_path

        def callback(pipe, step_index, timestep, callback_kwargs):
            progress_callback(step_index + 1, steps)
            return callback_kwargs

        try:
            image = self.pipeline(
                prompt=prompt,
                height=height,
                width=width,
                num_inference_steps=steps,
                guidance_scale=guidance_scale,
                max_sequence_length=max_seq_len,
                generator=generator,
                callback_on_step_end=callback
            ).images[0]
        finally:
            if lora_path:
                self.pipeline.unfuse_lora()
                self.pipeline.unload_lora_weights()
                self.loaded_lora_path = None

        return image, seed

    def unload(self):
        if self.pipeline:
            del self.pipeline
            self.pipeline = None
        self.loaded_model_path = None
        self.loaded_lora_path = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def get_loaded_model(self) -> str | None:
        return self.loaded_model_path

inference_service = FluxInferenceService()
