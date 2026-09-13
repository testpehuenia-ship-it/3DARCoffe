// Servicio para subida de archivos a Cloudinary y generación de modelos 3D con IA
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

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
 * Comprime y redimensiona una imagen antes de subirla a Cloudinary
 * Evita el límite de 10 MB y acelera la carga en dispositivos móviles
 */
export const compressImage = async (file, maxWidth = 1920, quality = 0.85) => {
  // Si ya es un archivo liviano (< 1 MB) o svg, no requiere procesamiento
  if (!file || file.size < 1024 * 1024 || file.type.includes('svg')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + '.jpg',
            { type: 'image/jpeg' }
          );
          console.log(`🖼️ Foto comprimida: de ${(file.size / 1024 / 1024).toFixed(2)} MB a ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

/**
 * Optimiza un archivo 3D (.glb) si supera el límite de Cloudinary (10 MB).
 * Tripo3D y herramientas de IA suelen exportar texturas 4K pesadas (12 a 15 MB).
 * Esta función reescala las texturas a resolución WebAR (1024px), reduciendo el peso a 1.5 - 3 MB.
 */
export const optimizeGlbModel = async (file, onProgress) => {
  const MAX_ALLOWED_BYTES = 9.5 * 1024 * 1024; // 9.5 MB para no rozar el límite estricto de 10 MB

  if (file.size <= MAX_ALLOWED_BYTES) {
    return file;
  }

  if (onProgress) {
    onProgress(15, `Modelo 3D pesado (${(file.size / 1024 / 1024).toFixed(1)} MB). Optimizando texturas para Cloudinary...`);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loader = new GLTFLoader();
    const gltf = await loader.parseAsync(arrayBuffer, '');

    if (onProgress) {
      onProgress(45, 'Redimensionando texturas 4K a resolución WebAR...');
    }

    const exporter = new GLTFExporter();
    const glbBuffer = await exporter.parseAsync(gltf.scene, {
      binary: true,
      maxTextureSize: 1024,
      animations: gltf.animations || []
    });

    const optimizedBlob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
    console.log(`✨ GLB optimizado con éxito: de ${(file.size / 1024 / 1024).toFixed(2)} MB a ${(optimizedBlob.size / 1024 / 1024).toFixed(2)} MB`);

    if (onProgress) {
      onProgress(85, `Optimizado a ${(optimizedBlob.size / 1024 / 1024).toFixed(1)} MB. Subiendo a Cloudinary...`);
    }

    return new File([optimizedBlob], file.name.replace(/\.glb$/i, '_opt.glb'), {
      type: 'model/gltf-binary'
    });
  } catch (error) {
    console.warn('No se pudo optimizar el GLB client-side:', error);
    return file;
  }
};

/**
 * Sube una imagen local a Cloudinary mediante un Unsigned Upload Preset
 * @param {File} file - Archivo de imagen seleccionado por el usuario
 * @param {Function} onProgress - Callback para reportar porcentaje de carga
 * @returns {Promise<string>} URL pública de la imagen subida
 */
export const uploadImageToCloudinary = async (file, onProgress) => {
  const config = getCloudinaryConfig();

  // Optimizar/comprimir imagen automáticamente antes de enviar
  const processedFile = await compressImage(file);

  if (!config.cloudName || !config.uploadPreset) {
    // Si no está configurado Cloudinary aún, convertimos a DataURL para no bloquear al usuario en local
    console.warn('⚠️ Cloudinary no está configurado (falta cloudName o uploadPreset). Usando modo local con FileReader...');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(processedFile);
    });
  }

  const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', processedFile);
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
          const rawMsg = errData.error?.message || '';
          if (rawMsg.includes('File size too large') || rawMsg.includes('Maximum is 10485760')) {
            reject(new Error(`La imagen supera el límite de 10 MB de Cloudinary gratuito (${(processedFile.size / 1024 / 1024).toFixed(1)} MB). Intenta con una imagen de menor peso.`));
          } else {
            reject(new Error(rawMsg || 'Error al subir imagen a Cloudinary'));
          }
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

  // Optimizar el archivo GLB si pesa más de 9.5 MB para no rebasar el límite de Cloudinary
  const readyFile = await optimizeGlbModel(file, onProgress);

  // Los modelos 3D se suben como raw en Cloudinary
  const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/raw/upload`;
  const formData = new FormData();
  formData.append('file', readyFile);
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
          const rawMsg = errData.error?.message || '';
          if (rawMsg.includes('File size too large') || rawMsg.includes('Maximum is 10485760')) {
            reject(new Error(`El modelo 3D supera el límite de 10 MB de Cloudinary gratuito (${(readyFile.size / 1024 / 1024).toFixed(1)} MB). Te recomendamos descargarlo en resolución 1k o 2k en vez de 4k para que sea ultra liviano.`));
          } else {
            reject(new Error(rawMsg || 'Error al subir modelo 3D a Cloudinary'));
          }
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
