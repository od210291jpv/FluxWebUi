from pathlib import Path
from PIL import Image

def save_image(image: Image.Image, task_id: str, output_dir: Path) -> tuple[str, str]:
    """
    Saves an image to disk and generates a thumbnail.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"{task_id}.png"
    filepath = output_dir / filename
    image.save(filepath, format="PNG")
    
    thumb_filename = f"{task_id}_thumb.png"
    thumb_filepath = output_dir / thumb_filename
    
    # Create thumbnail
    thumb_image = image.copy()
    thumb_image.thumbnail((256, 256))
    thumb_image.save(thumb_filepath, format="PNG")
    
    return filename, thumb_filename
