import base64
import io
import os
import tempfile
from pathlib import Path

import requests
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
from pydantic import BaseModel

# TripoSR se instala desde el repositorio oficial dentro de este mismo servicio.
from tsr.system import TSR
from tsr.utils import remove_background, resize_foreground

app = FastAPI(title="Cafetería QR - TripoSR 3D", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.getenv("TRIPOSR_MODEL", "stabilityai/TripoSR")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
model = None


class GenerateRequest(BaseModel):
    image_url: str
    name: str = "producto"
    category: str = "cafeteria"


def load_model():
    global model
    if model is None:
        model = TSR.from_pretrained(MODEL_NAME, config_name="config.yaml", weight_name="model.ckpt")
        model.renderer.set_chunk_size(8192)
        model.to(DEVICE)
    return model


def read_image(value: str) -> Image.Image:
    if value.startswith("data:image/"):
        try:
            _, encoded = value.split(",", 1)
            return Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")
        except Exception as exc:
            raise HTTPException(400, f"No se pudo leer la imagen DataURL: {exc}")

    try:
        r = requests.get(value, timeout=30)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception as exc:
        raise HTTPException(400, f"No se pudo descargar la imagen: {exc}")


@app.get("/health")
def health():
    return {"ok": True, "device": DEVICE, "model": MODEL_NAME}


@app.post("/generate")
def generate(req: GenerateRequest):
    image = read_image(req.image_url)
    workdir = Path(tempfile.mkdtemp(prefix="cafeteria_triposr_"))
    output = workdir / "model.glb"

    try:
        # El preprocesamiento del proyecto oficial elimina fondo y centra el objeto.
        image = remove_background(image)
        image = resize_foreground(image, 0.85)

        tsr = load_model()
        with torch.no_grad():
            scene_codes = tsr(image, device=DEVICE)
            mesh = tsr.extract_mesh(scene_codes, has_vertex_color=True)[0]
            mesh.export(str(output), file_type="glb")

        if not output.exists() or output.stat().st_size < 1024:
            raise RuntimeError("TripoSR no produjo un GLB válido.")

        return FileResponse(
            output,
            media_type="model/gltf-binary",
            filename="producto.glb",
            background=None,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"Error generando el modelo 3D: {exc}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
