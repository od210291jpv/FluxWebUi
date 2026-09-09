import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from app.config import settings
from app.models.database import init_db
from app.services.queue import task_queue
from app.services.pipeline import inference_service
from app.ws.notifications import manager as ws_manager
from app.routers import generate, gallery, system

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    
    settings.models_dir.mkdir(parents=True, exist_ok=True)
    settings.loras_dir.mkdir(parents=True, exist_ok=True)
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    
    worker_task = asyncio.create_task(task_queue.worker())
    
    yield
    
    worker_task.cancel()
    inference_service.unload()

app = FastAPI(title="Flux Web UI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/api/images", StaticFiles(directory=str(settings.output_dir)), name="images")

app.include_router(generate.router)
app.include_router(gallery.router)
app.include_router(system.router)

@app.websocket("/ws/progress")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "Flux Web UI API. Use /docs for API documentation."}
