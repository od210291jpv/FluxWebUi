import os
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import GalleryListResponse, GalleryItem
from app.models.database import get_db, Generation
from app.config import settings

router = APIRouter(prefix="/api/gallery", tags=["gallery"])

@router.get("", response_model=GalleryListResponse)
async def list_gallery(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    prompt: str = None,
    db: AsyncSession = Depends(get_db)
):
    base_filter = Generation.prompt.ilike(f"%{prompt}%") if prompt else True
    
    count_result = await db.execute(select(func.count(Generation.id)).where(base_filter))
    total = count_result.scalar_one()
    
    offset = (page - 1) * per_page
    query = (
        select(Generation)
        .where(base_filter)
        .order_by(Generation.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    result = await db.execute(query)
    rows = result.scalars().all()
    
    items = [
        GalleryItem(
            id=gen.id,
            prompt=gen.prompt,
            model=gen.model,
            width=gen.width,
            height=gen.height,
            steps=gen.steps,
            guidance_scale=gen.guidance_scale,
            seed=gen.seed,
            image_url=f"/api/images/{gen.filename}",
            thumbnail_url=f"/api/images/{gen.thumbnail}",
            generation_time_s=gen.generation_time_s,
            created_at=gen.created_at,
            lora_name=gen.lora_name,
            lora_scale=gen.lora_scale
        )
        for gen in rows
    ]
        
    return GalleryListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page
    )

@router.get("/{image_id}", response_model=GalleryItem)
async def get_gallery_item(image_id: str, db: AsyncSession = Depends(get_db)):
    gen = await db.get(Generation, image_id)
    if not gen:
        raise HTTPException(status_code=404, detail="Image not found")
        
    return GalleryItem(
        id=gen.id,
        prompt=gen.prompt,
        model=gen.model,
        width=gen.width,
        height=gen.height,
        steps=gen.steps,
        guidance_scale=gen.guidance_scale,
        seed=gen.seed,
        image_url=f"/api/images/{gen.filename}",
        thumbnail_url=f"/api/images/{gen.thumbnail}",
        generation_time_s=gen.generation_time_s,
        created_at=gen.created_at,
        lora_name=gen.lora_name,
        lora_scale=gen.lora_scale
    )

@router.delete("/{image_id}")
async def delete_gallery_item(image_id: str, db: AsyncSession = Depends(get_db)):
    gen = await db.get(Generation, image_id)
    if not gen:
        raise HTTPException(status_code=404, detail="Image not found")
        
    # Delete files
    image_path = settings.output_dir / gen.filename
    thumb_path = settings.output_dir / gen.thumbnail
    if image_path.exists():
        os.remove(image_path)
    if thumb_path.exists():
        os.remove(thumb_path)
        
    await db.delete(gen)
    await db.commit()
    
    return {"status": "deleted"}
