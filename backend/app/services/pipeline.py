import gc
import json
from pathlib import Path
from typing import Optional, Callable
import torch
from diffusers import DiffusionPipeline
from PIL import Image

from app.config import settings
from app.models.schemas import ModelInfo, LoraInfo

# Known pipeline class → model family mapping for defaults and call kwargs
_PIPELINE_DEFAULTS = {
    "ZImagePipeline": {
        "steps": 8,
        "guidance_scale": 0.0,
        "supports_max_sequence_length": False,
        "supports_lora": False,          # LoRA loader not yet stable for ZImage
    },
    "QwenImage21Pipeline": {
        "steps": 40,
        "guidance_scale": 1.0,       # CFG ~1 recommended for Qwen-Image
        "supports_max_sequence_length": False,
        "supports_lora": False,
    },
    # FluxPipeline / DiffusionPipeline-loaded FLUX models
    "default": {
        "steps": 28,
        "guidance_scale": 3.5,
        "supports_max_sequence_length": True,
        "supports_lora": True,
    },
    "schnell": {                         # FLUX.1-schnell special case
        "steps": 4,
        "guidance_scale": 0.0,
        "supports_max_sequence_length": True,
        "supports_lora": True,
    },
}


def _read_pipeline_class(model_dir: Path) -> str:
    """Return the _class_name from model_index.json, or empty string."""
    index = model_dir / "model_index.json"
    if not index.exists():
        return ""
    try:
        with open(index) as f:
            return json.load(f).get("_class_name", "")
    except Exception:
        return ""


def _get_model_profile(model_dir: Path) -> dict:
    """Return the appropriate defaults profile for a model directory."""
    pipeline_class = _read_pipeline_class(model_dir)
    if pipeline_class in _PIPELINE_DEFAULTS:
        return {**_PIPELINE_DEFAULTS[pipeline_class], "pipeline_class": pipeline_class}

    # Fall back to name-based detection for FLUX variants
    name_lower = model_dir.name.lower()
    if "schnell" in name_lower:
        return {**_PIPELINE_DEFAULTS["schnell"], "pipeline_class": "FluxPipeline"}
    if "qwen-image" in name_lower:
        return {**_PIPELINE_DEFAULTS["QwenImage21Pipeline"], "pipeline_class": "QwenImage21Pipeline"}

    return {**_PIPELINE_DEFAULTS["default"], "pipeline_class": pipeline_class or "FluxPipeline"}


class FluxInferenceService:
    def __init__(self):
        self.pipeline: Optional[DiffusionPipeline] = None
        self.loaded_model_path: Optional[str] = None
        self.loaded_lora_path: Optional[str] = None
        self._pipeline_class: str = ""

    def scan_models(self, models_dir: Path) -> list[ModelInfo]:
        """Scan models directory for any diffusers model folder with model_index.json."""
        models = []
        if not models_dir.exists():
            return models
        for path in models_dir.iterdir():
            if path.is_dir() and (path / "model_index.json").exists():
                profile = _get_model_profile(path)
                models.append(ModelInfo(
                    id=path.name,
                    path=str(path),
                    defaults={
                        "steps": profile["steps"],
                        "guidance_scale": profile["guidance_scale"],
                        "max_sequence_length": 512 if profile.get("supports_max_sequence_length") else None,
                    }
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

        actual_path = model_path
        if not Path(actual_path).exists():
            actual_path = str(settings.models_dir / model_path)

        dtype = torch.bfloat16 if settings.dtype == "bfloat16" else torch.float16

        self.pipeline = DiffusionPipeline.from_pretrained(
            actual_path,
            torch_dtype=dtype,
            local_files_only=True
        )

        # Store the pipeline class name so generate() can branch correctly
        self._pipeline_class = type(self.pipeline).__name__

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
        progress_callback: Callable[[int, int], None],
        input_image: Optional[Image.Image] = None,
    ) -> tuple[Image.Image, int]:
        if not self.pipeline:
            raise RuntimeError("No model loaded")

        if seed is None:
            seed = torch.randint(0, 2**32 - 1, (1,)).item()

        generator = torch.Generator(device="cpu").manual_seed(seed)

        # --- LoRA (only supported for FLUX-family pipelines) ---
        skip_lora = self._pipeline_class in ("ZImagePipeline", "QwenImage21Pipeline")
        if lora_path and not skip_lora:
            self.pipeline.load_lora_weights(lora_path)
            self.pipeline.fuse_lora(lora_scale=lora_scale)
            self.loaded_lora_path = lora_path

        def callback(pipe, step_index, timestep, callback_kwargs):
            progress_callback(step_index + 1, steps)
            return callback_kwargs

        # --- Build call kwargs depending on pipeline family ---
        call_kwargs: dict = dict(
            prompt=prompt,
            height=height,
            width=width,
            num_inference_steps=steps,
            generator=generator,
            callback_on_step_end=callback,
        )

        if self._pipeline_class == "QwenImage21Pipeline":
            call_kwargs["true_cfg_scale"] = guidance_scale
        else:
            call_kwargs["guidance_scale"] = guidance_scale

        if not skip_lora:
            # FLUX pipelines accept max_sequence_length
            call_kwargs["max_sequence_length"] = max_seq_len

        # Qwen-Image 2.1: pass input image for editing mode
        if self._pipeline_class == "QwenImage21Pipeline" and input_image is not None:
            call_kwargs["image"] = input_image

        try:
            image = self.pipeline(**call_kwargs).images[0]
        finally:
            if lora_path and not skip_lora:
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
        self._pipeline_class = ""
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def get_loaded_model(self) -> str | None:
        return self.loaded_model_path


inference_service = FluxInferenceService()
