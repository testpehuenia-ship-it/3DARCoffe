# ☕ Cafetería Patagonia QR - Guía de Instalación en Otra PC

Esta guía te ayudará a poner en marcha el proyecto en una nueva computadora paso a paso.

---

## 1. Requisitos Previos

Asegúrate de tener instalado en la nueva PC:
- **Node.js** (versión 18 o superior recomendada, preferentemente LTS): [https://nodejs.org](https://nodejs.org)
- **Git** (opcional): [https://git-scm.com](https://git-scm.com)
- Un editor de código como **VS Code** o similar.

Para verificar que Node.js y npm están instalados, abre una terminal (PowerShell, CMD o Terminal) y ejecuta:
```bash
node -v
npm -v
```

---

## 2. Instalación de Dependencias

1. Descomprime el archivo ZIP en la carpeta de tu preferencia.
2. Abre una terminal dentro de la carpeta del proyecto descomprimida.
3. Ejecuta el siguiente comando para descargar e instalar todas las dependencias necesarias (`node_modules`):
```bash
npm install
```

---

## 3. Variables de Entorno (.env)

El archivo `.env` ya viene incluido en el paquete con la configuración actual.
Si por alguna razón necesitas reconfigurarlo, puedes copiar `.env.example` a `.env` y ajustar tus claves de Firebase:
```bash
# Windows PowerShell
copy .env.example .env
```

---

## 4. Ejecutar el Proyecto en Modo Desarrollo

Una vez finalizada la instalación de dependencias, ejecuta:
```bash
npm run dev
```

Esto iniciará el servidor de desarrollo de Vite. Verás enlaces en la consola similares a:
- **Local:** `http://localhost:5173/`
- **Red local (para celulares/QR):** `http://<tu-ip-local>:5173/` (gracias a `--host`, accesible desde cualquier dispositivo conectado al mismo Wi-Fi).

---

## 5. Compilar para Producción (Opcional)

Si deseas generar la versión final lista para producción:
```bash
npm run build
```
Los archivos optimizados se generarán en la carpeta `dist/`.
