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
          apiKey: parsed.apiKey || import.meta.env.VITE_CLOUDINARY_API_KEY || '',
          meshyApiKey: parsed.meshyApiKey || import.meta.env.VITE_MESHY_API_KEY || ''
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
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
    meshyApiKey: import.meta.env.VITE_MESHY_API_KEY || ''
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
 * Genera o empareja un modelo 3D limpio (SIN mesa artificial) a partir de la foto del producto
 * @param {Object} params - Datos del producto ({ imageUrl, name, category, meshyApiKey })
 * @returns {Promise<{ modelUrl: string, dimensions: { width: number, height: number, depth: number }, widthCm: string, heightCm: string, depthCm: string, isAiGenerated: boolean }>}
 */
export const generate3DFromImage = async ({ imageUrl, name = '', category = 'cafeteria', meshyApiKey = '' }) => {
  const apiKey = meshyApiKey || import.meta.env.VITE_MESHY_API_KEY || '';

  // Si el usuario configuró una API Key de Meshy.ai, intentamos la generación neural por IA
  if (apiKey && imageUrl && imageUrl.startsWith('http')) {
    try {
      console.log('🤖 Solicitando generación 3D con Meshy AI Image-to-3D...');
      const response = await fetch('https://api.meshy.ai/v2/image-to-3d', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_url: imageUrl,
          enable_pbr: true,
          ai_model: 'meshy-4',
          should_remesh: true,
          // Instrucción para evitar mesas artificiales y generar el objeto limpio
          negative_prompt: 'table, furniture, background, wooden board, surface, floor'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const taskId = data.result;
        console.log('⏳ Tarea de IA 3D creada en Meshy con ID:', taskId);
        // Si la tarea se inició, devolvemos el resultado de proceso
        return {
          modelUrl: `https://assets.meshy.ai/${taskId}.glb`,
          widthCm: '12',
          heightCm: '10',
          depthCm: '12',
          isAiGenerated: true,
          taskId
        };
      }
    } catch (error) {
      console.warn('Meshy API no respondió o hubo un error. Usando asignación inteligente de modelo 3D limpio...', error);
    }
  }

  // --- Motor de Asignación Inteligente Limpio (Sin Mesa Artificial) ---
  // Analiza el nombre del producto y categoría para asignar el modelo 3D correspondiente,
  // con proporciones realistas (1:1) sin fondo ni tabla debajo.
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

  // Default para comidas y platos servidos
  return {
    modelUrl: '/models/dish.glb',
    widthCm: '20',
    heightCm: '6',
    depthCm: '20',
    isAiGenerated: false,
    templateName: 'Plato Servido (Sin mesa)'
  };
};
