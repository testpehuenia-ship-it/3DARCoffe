import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRViewer = () => {
  // IP local obtenida para el servidor Vite (o usar window.location.hostname si se accede ya desde la IP)
  const ip = '192.168.1.54';
  const port = '5173';
  
  // Determinamos la URL base. Si estamos en localhost, forzamos la IP para el QR.
  // Si ya estamos en una IP de red, la usamos.
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = isLocalhost ? `http://${ip}:${port}` : window.location.origin;
  
  const menuUrl = `${baseUrl}/`;

  return (
    <div className="container py-16 flex flex-col items-center justify-center min-h-[80vh] text-center animate-fade-in">
      <h1 className="text-3xl font-serif text-primary mb-4">Prueba en tu Celular</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Asegúrate de que tu celular esté conectado a la misma red WiFi que esta computadora y escanea el código para ver el menú.
      </p>

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6">
        <QRCodeSVG value={menuUrl} size={256} fgColor="#2C3E2D" />
      </div>

      <p className="text-sm font-mono bg-gray-100 p-2 rounded text-gray-500">
        URL Directa: {menuUrl}
      </p>
    </div>
  );
};

export default QRViewer;
