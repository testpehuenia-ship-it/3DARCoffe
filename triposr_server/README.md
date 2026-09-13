# Generador 3D gratuito para Cafetería QR

Este servicio agrega **TripoSR open source** a la aplicación React. No usa Meshy ni una API de generación de pago.

Repositorio oficial: https://github.com/VAST-AI-Research/TripoSR

## Requisito recomendado

GPU NVIDIA con al menos ~6 GB de VRAM para el flujo de una imagen. El README oficial de TripoSR indica que su ejecución por defecto usa alrededor de 6 GB de VRAM. CPU puede funcionar, pero será mucho más lenta. 

## Instalación en Windows + NVIDIA

1. Instalar Python 3.10/3.11.
2. Instalar Git.
3. Clonar TripoSR:

```bash
git clone https://github.com/VAST-AI-Research/TripoSR.git
cd TripoSR
```

4. Crear entorno virtual:

```bash
python -m venv .venv
.venv\Scripts\activate
```

5. Instalar PyTorch compatible con tu GPU desde https://pytorch.org/get-started/locally/ y luego:

```bash
pip install -r requirements.txt
pip install fastapi uvicorn requests Pillow
```

6. Copiar `triposr_server/app.py` de este proyecto a la carpeta raíz de TripoSR o ajustar el `PYTHONPATH`.

7. Ejecutar:

```bash
python app.py
```

Debe quedar disponible en:

`http://127.0.0.1:8000/health`

## Configuración de la app React

En `.env`:

```env
VITE_TRIPOSR_API_URL=http://127.0.0.1:8000
```

Luego:

```bash
npm install
npm run dev
```

## Flujo

1. Administrador sube la foto.
2. Pulsa **Generar 3D / AR gratis desde la Foto**.
3. React envía la imagen a TripoSR.
4. TripoSR devuelve un `.glb`.
5. React sube ese GLB a Cloudinary.
6. Se coloca la URL en `modelUrl`.
7. Al guardar el producto, el menú usa el GLB existente con `model-viewer` y AR.

## Producción

Vercel sigue alojando el frontend. TripoSR debe correr en una PC o servidor con GPU. En producción, configurar:

```env
VITE_TRIPOSR_API_URL=https://tu-servidor-gpu.example.com
```

La IA y el software de TripoSR son open source/MIT; el costo de infraestructura (electricidad o servidor GPU) es independiente del software.
