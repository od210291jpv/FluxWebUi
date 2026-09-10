# Flux Web UI

A full-stack web application for generating images using FLUX diffusion models running locally on your GPU.

**Backend**: Python / FastAPI with HuggingFace Diffusers  
**Frontend**: React / TypeScript with Tailwind CSS  
**Inference**: Local GPU via `FluxPipeline` (bfloat16 + CPU offload)

## Features

| Page | Description |
|---|---|
| **Generate** | Prompt input, model/LoRA selection, aspect ratio picker, inference settings, live progress |
| **Gallery** | Paginated browse of all generated images with prompt search |
| **Dashboard** | Real-time task queue, per-task progress & metadata, GPU/CPU/RAM resource monitoring, model list |

## Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **NVIDIA GPU with 16 GB+ VRAM** (tested with RTX 4090, 3090, A6000)
- **CUDA 12+** and compatible PyTorch
- **32 GB+ system RAM** (for CPU offloading)

## Model Setup

FLUX models must be downloaded manually and placed in the `backend/models_cache/` directory.

### Where to Get Models

| Model | Pipeline | License | Recommended Steps | Source |
|---|---|---|---|---|
| FLUX.1-schnell | `FluxPipeline` | Apache 2.0 | 4 | [huggingface.co/black-forest-labs/FLUX.1-schnell](https://huggingface.co/black-forest-labs/FLUX.1-schnell) |
| FLUX.1-dev | `FluxPipeline` | Non-commercial | 28 | [huggingface.co/black-forest-labs/FLUX.1-dev](https://huggingface.co/black-forest-labs/FLUX.1-dev) |
| Z-Image-Turbo | `ZImagePipeline` | Apache 2.0 | 8 | [huggingface.co/Tongyi-MAI/Z-Image-Turbo](https://huggingface.co/Tongyi-MAI/Z-Image-Turbo) |

The app auto-detects the pipeline class from each model's `model_index.json` and applies the correct defaults automatically.

### Downloading Models

Use the `huggingface-cli` (included with `huggingface_hub`, which is installed as part of the requirements):

```bash
# FLUX.1-schnell — fastest FLUX, Apache 2.0
huggingface-cli download black-forest-labs/FLUX.1-schnell \
  --local-dir backend/models_cache/FLUX.1-schnell

# FLUX.1-dev — higher quality, non-commercial
huggingface-cli download black-forest-labs/FLUX.1-dev \
  --local-dir backend/models_cache/FLUX.1-dev

# Z-Image-Turbo — 8-step, 6B params, Apache 2.0
huggingface-cli download Tongyi-MAI/Z-Image-Turbo \
  --local-dir backend/models_cache/Z-Image-Turbo
```

> **HuggingFace account / token**: FLUX.1-dev requires accepting the model license. Log in first:
> ```bash
> huggingface-cli login
> ```

> **Windows tip**: If you already have a model cached by HuggingFace, symlink it instead of re-downloading:
> ```bash
> mklink /D "backend\models_cache\FLUX.1-schnell" "C:\Users\<you>\.cache\huggingface\hub\models--black-forest-labs--FLUX.1-schnell\snapshots\<hash>"
> ```

### Directory Structure

Place each model in its own folder inside `models_cache/`. The app detects valid models by looking for `model_index.json`:

```
backend/
├── models_cache/
│   ├── FLUX.1-schnell/          # or any name you choose
│   │   ├── model_index.json     # ← required for detection
│   │   ├── scheduler/
│   │   ├── text_encoder/
│   │   ├── text_encoder_2/
│   │   ├── tokenizer/
│   │   ├── tokenizer_2/
│   │   ├── transformer/
│   │   └── vae/
│   └── FLUX.1-dev/
│       └── ...
├── loras/                       # Optional LoRA adapters
│   ├── my-style.safetensors
│   └── another-lora.safetensors
└── outputs/                     # Generated images (auto-created)
```

> **Tip:** If you already have models cached by HuggingFace, you can symlink them:
> ```bash
> mklink /D "backend\models_cache\FLUX.1-schnell" "C:\Users\<you>\.cache\huggingface\hub\models--black-forest-labs--FLUX.1-schnell\snapshots\<hash>"
> ```

### LoRA Adapters

Place `.safetensors` LoRA files in `backend/loras/`. They'll appear in the UI's LoRA dropdown automatically. Subdirectories are also scanned.

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# (Optional) Copy and edit environment config
copy .env.example .env

# Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API docs are available at http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server (proxies API calls to backend)
npm run dev
```

Open http://localhost:5173 in your browser.

### 3. Docker (Alternative)

If you prefer using Docker, you can run the entire stack (Frontend + Backend) using Docker Compose. Note that you still need the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installed for GPU support.

```bash
cd c:\Users\Paul\Documents\Repos\FluxWebUI

# Build and start the containers
docker-compose up --build -d
```

The app will be available at http://localhost:5173. The backend API is at http://localhost:8000.

To stop the containers:
```bash
docker-compose down
```

## Configuration

All settings can be configured via environment variables or a `.env` file in the `backend/` directory:

| Variable | Default | Description |
|---|---|---|
| `MODELS_DIR` | `./models_cache` | Path to local FLUX model directories |
| `LORAS_DIR` | `./loras` | Path to LoRA `.safetensors` files |
| `OUTPUT_DIR` | `./outputs` | Where generated images are saved |
| `DB_URL` | `sqlite+aiosqlite:///./flux_webui.db` | Database connection string |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `DEVICE` | `cuda` | PyTorch device |
| `DTYPE` | `bfloat16` | Model dtype (`bfloat16` or `float16`) |
| `ENABLE_CPU_OFFLOAD` | `true` | Enable model CPU offloading (saves VRAM) |
| `MAX_QUEUE_SIZE` | `10` | Max queued generation tasks |

## Architecture

```
Browser (React SPA)
    │
    ├── HTTP ──→ FastAPI REST API
    │              ├── POST /api/generate        → Task Queue → GPU Worker
    │              ├── GET  /api/tasks           → All tasks (dashboard)
    │              ├── GET  /api/tasks/{id}      → Single task status
    │              ├── DELETE /api/tasks/{id}    → Cancel queued task
    │              ├── GET  /api/gallery         → SQLite DB
    │              ├── GET  /api/system/status   → GPU / CPU / RAM info
    │              ├── GET  /api/system/models   → Available models
    │              ├── GET  /api/system/loras    → Available LoRAs
    │              └── GET  /api/images/{file}   → Static Files
    │
    └── WS ───→ /ws/progress
                   └── Real-time events: task_queued, task_started,
                       task_progress (step/total), task_completed, task_failed
```

## Dashboard

The **Dashboard** tab (accessible from the top navigation) provides a live overview:

### Task Queue Panel
Each generation task is shown as a card with:
- **Status badge** — Queued / Running / Completed / Failed with colour coding
- **Progress bar** — live step counter and % complete for running tasks
- **Metadata chips** — Model, Aspect Ratio, Dimensions, Inference Steps, CFG Scale, LoRA & LoRA Scale
- **Prompt viewer** — click *Prompt ↗* to open a modal with the full prompt text

Progress updates arrive via WebSocket in real time; the task list also polls every 2 seconds.

### Resource Panel
| Metric | Source |
|---|---|
| GPU name | `torch.cuda.get_device_name` |
| GPU load % | `pynvml` (NVIDIA only; shows 0% on non-NVIDIA) |
| VRAM used / total | `torch.cuda.memory_allocated` / `get_device_properties` |
| CPU name | `platform.processor` |
| CPU load % | `psutil.cpu_percent` |
| RAM used / total | `psutil.virtual_memory` |

Gauge bars shift colour: **green → yellow → red** as utilisation increases.

### Model List Panel
All models found in `models_cache/` are listed, with the currently loaded model highlighted by a glowing violet **LOADED** badge.

## Python Dependencies

| Package | Purpose |
|---|---|
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server |
| `sqlalchemy` + `aiosqlite` | Async SQLite ORM |
| `pydantic` + `pydantic-settings` | Schema validation & settings |
| `diffusers` | FLUX / HuggingFace pipeline |
| `transformers` | Text encoders |
| `accelerate` | Model sharding / CPU offload |
| `torch` | PyTorch (CUDA build) |
| `pillow` | Image saving & thumbnails |
| `websockets` | WebSocket support |
| `psutil` | CPU & RAM metrics for Dashboard |
| `pynvml` | NVIDIA GPU utilisation % for Dashboard |

## Model Defaults

The app reads `model_index.json` from each model folder to detect the pipeline class and sets these defaults automatically in the UI:

| Parameter | FLUX.1-schnell | FLUX.1-dev | Z-Image-Turbo |
|---|---|---|---|
| Pipeline | `FluxPipeline` | `FluxPipeline` | `ZImagePipeline` |
| Inference Steps | 4 | 28 | 8 |
| Guidance Scale | 0.0 | 3.5 | 0.0 |
| Max Sequence Length | 256 | 512 | N/A |
| LoRA support | ✅ | ✅ | ❌ (not yet in diffusers) |

## License

This project is for personal use. FLUX model weights have their own licenses — see the respective HuggingFace model cards.
