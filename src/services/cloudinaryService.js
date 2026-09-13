// Servicio para subida de archivos a Cloudinary y generación de modelos 3D con IA

export const getCloudinaryConfig = () => {
  // Primero intentamos leer de localStorage (para configuración dinámica desde el Admin)
  const saved = localStorage.getItem('patagonia_cloudinary_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed) {
        return {
          cloudName: parsed.cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
          uploadPreset: parsed.uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
          apiKey: parsed.apiKey || import.meta.env.VITE_CLOUDINARY_API_KEY || ''
        };
      }
    } catch (e) {
      console.warn('Error leyendo configuración de Cloudinary desde localStorage:', e);
    }
  }

  // Fallback a variables de entorno de Vite
  return {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || ''
  };
};

export const saveCloudinaryConfig = (config) => {
  localStorage.setItem('patagonia_cloudinary_config', JSON.stringify(config));
};

/**
 * Sube una imagen local a Cloudinary mediante un Unsigned Upload Preset
 * @param {File} file - Archivo de imagen seleccionado por el usuario
 * @param {Function} onProgress - Callback para reportar porcentaje de carga
 * @returns {Promise<string>} URL pública de la imagen subida
 */
export const uploadImageToCloudinary = async (file, onProgress) => {
  const config = getCloudinaryConfig();

  if (!config.cloudName || !config.uploadPreset) {
    // Si no está configurado Cloudinary aún, convertimos a DataURL para no bloquear al usuario en local
    console.warn('⚠️ Cloudinary no está configurado (falta cloudName o uploadPreset). Usando modo local con FileReader...');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error?.message || 'Error al subir imagen a Cloudinary'));
        } catch {
          reject(new Error(`Error ${xhr.status} al subir a Cloudinary`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Error de red al conectar con Cloudinary'));
    xhr.send(formData);
  });
};

/**
 * Sube un archivo de modelo 3D (.glb o .usdz) a Cloudinary
 * @param {File} file - Archivo .glb
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<string>} URL pública del modelo 3D
 */
export const uploadModelToCloudinary = async (file, onProgress) => {
  const config = getCloudinaryConfig();

  if (!config.cloudName || !config.uploadPreset) {
    throw new Error('Configura tu Cloud Name y Upload Preset de Cloudinary en el Admin para subir archivos 3D .glb');
  }

  // Los modelos 3D se suben como raw o auto en Cloudinary
  const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/raw/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error?.message || 'Error al subir modelo 3D a Cloudinary'));
        } catch {
          reject(new Error(`Error ${xhr.status} al subir modelo 3D a Cloudinary`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Error de red al conectar con Cloudinary'));
    xhr.send(formData);
  });
};

/**
 * Obtiene una plantilla limpia 3D (sin mesa artificial) según la categoría o nombre
 */
export const getCleanTemplateModel = ({ name = '', category = 'cafeteria' }) => {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes('café') || 
    lowerName.includes('cafe') || 
    lowerName.includes('espresso') || 
    lowerName.includes('latte') || 
    lowerName.includes('capuchino') || 
    lowerName.includes('cappuccino') || 
    lowerName.includes('submarino') || 
    lowerName.includes('té') || 
    lowerName.includes('te') || 
    lowerName.includes('infusión') || 
    category === 'cafeteria'
  ) {
    return {
      modelUrl: '/models/teacup.glb',
      widthCm: '12',
      heightCm: '8',
      depthCm: '12',
      isAiGenerated: false,
      templateName: 'Taza de Porcelana con Plato (Sin mesa)'
    };
  }

  if (
    lowerName.includes('helado') || 
    lowerName.includes('ice cream') || 
    lowerName.includes('sundae') || 
    lowerName.includes('cono') || 
    category === 'heladeria'
  ) {
    return {
      modelUrl: '/models/icecream.glb',
      widthCm: '10',
      heightCm: '15',
      depthCm: '10',
      isAiGenerated: false,
      templateName: 'Copa de Helado Artesanal (Sin mesa)'
    };
  }

  if (
    lowerName.includes('torta') || 
    lowerName.includes('pastel') || 
    lowerName.includes('postre') || 
    lowerName.includes('parfait') || 
    lowerName.includes('dulce') || 
    category === 'pasteleria'
  ) {
    return {
      modelUrl: '/models/dessert.glb',
      widthCm: '15',
      heightCm: '10',
      depthCm: '15',
      isAiGenerated: false,
      templateName: 'Copa Parfait / Postre (Sin mesa)'
    };
  }

  return {
    modelUrl: '/models/dish.glb',
    widthCm: '20',
    heightCm: '6',
    depthCm: '20',
    isAiGenerated: false,
    templateName: 'Plato Servido (Sin mesa)'
  };
};

/**
 * Genera un modelo 3D localmente con TripoSR.
 * No usa Meshy ni requiere una API de pago.
 * El endpoint se ejecuta en una PC/VPS con GPU y devuelve un GLB.
 */
export const generate3DFromImage = async ({
  imageUrl,
  name = '',
  category = 'cafeteria',
  onProgress
}) => {
  if (!imageUrl) throw new Error('Falta la imagen del producto.');

  const apiUrl = (import.meta.env.VITE_TRIPOSR_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  onProgress?.(5, 'Conectando con el generador 3D gratuito local...');

  let response;
  try {
    response = await fetch(`${apiUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, name, category })
    });
  } catch (error) {
    throw new Error(
      `No se pudo conectar con TripoSR. Inicia el servidor local en el puerto 8000. (${error.message})`
    );
  }

  if (!response.ok) {
    let message = `Error del generador 3D (${response.status})`;
    try {
      const data = await response.json();
      message = data.detail || data.message || message;
    } catch { /* respuesta no JSON */ }
    throw new Error(message);
  }

  onProgress?.(90, 'Modelo generado. Preparando archivo GLB...');
  const blob = await response.blob();
  const file = new File([blob], `${(name || 'producto').replace(/[^a-z0-9_-]/gi, '_')}.glb`, {
    type: 'model/gltf-binary'
  });

  onProgress?.(100, 'GLB listo.');

  // El frontend sube el GLB resultante a Cloudinary, igual que un GLB manual.
  const modelUrl = await uploadModelToCloudinary(file);

  return {
    modelUrl,
    widthCm: '12',
    heightCm: '10',
    depthCm: '12',
    isAiGenerated: true,
    templateName: 'Modelo 3D generado con TripoSR (open source)'
  };
};
