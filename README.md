# Flux Web UI

A full-stack web application for generating images using FLUX diffusion models running locally on your GPU.

**Backend**: Python / FastAPI with HuggingFace Diffusers  
**Frontend**: React / TypeScript with Tailwind CSS  
**Inference**: Local GPU via `FluxPipeline` (bfloat16 + CPU offload)

## Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **NVIDIA GPU with 16 GB+ VRAM** (tested with RTX 4090, 3090, A6000)
- **CUDA 12+** and compatible PyTorch
- **32 GB+ system RAM** (for CPU offloading)

## Model Setup

FLUX models must be downloaded manually and placed in the `backend/models_cache/` directory.

### Where to Get Models

| Model | License | Source |
|---|---|---|
| FLUX.1-schnell | Apache 2.0 | [huggingface.co/black-forest-labs/FLUX.1-schnell](https://huggingface.co/black-forest-labs/FLUX.1-schnell) |
| FLUX.1-dev | Non-commercial | [huggingface.co/black-forest-labs/FLUX.1-dev](https://huggingface.co/black-forest-labs/FLUX.1-dev) |

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
    │              ├── POST /api/generate      → Task Queue → GPU Worker
    │              ├── GET  /api/tasks/{id}     → Task Status
    │              ├── GET  /api/gallery        → SQLite DB
    │              ├── GET  /api/system/status   → GPU Info
    │              └── GET  /api/images/{file}   → Static Files
    │
    └── WS ───→ /ws/progress
                   └── Real-time step-by-step progress updates
```

## Model Defaults

| Parameter | FLUX.1-schnell | FLUX.1-dev |
|---|---|---|
| Inference Steps | 4 | 28 |
| Guidance Scale | 0.0 | 3.5 |
| Max Sequence Length | 256 | 512 |

The UI automatically adjusts these defaults when you switch models.

## License

This project is for personal use. FLUX model weights have their own licenses — see the respective HuggingFace model cards.
