FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y python3 python3-pip git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN python3 -m pip install --upgrade pip && pip install -r requirements.txt
# PyTorch CUDA. Ajustar versión si la GPU/driver lo requiere.
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
RUN git clone --depth 1 https://github.com/VAST-AI-Research/TripoSR.git /opt/TripoSR
WORKDIR /opt/TripoSR
RUN pip install -r requirements.txt
WORKDIR /app
COPY app.py .
EXPOSE 8000
CMD ["python3", "app.py"]
