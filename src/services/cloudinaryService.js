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
 * Genera un modelo 3D con IA o asocia la plantilla limpia
 * @param {Object} params - { imageUrl, name, category, meshyApiKey, onProgress }
 */
export const generate3DFromImage = async ({ 
  imageUrl, 
  name = '', 
  category = 'cafeteria', 
  meshyApiKey = '',
  onProgress 
}) => {
  const apiKey = meshyApiKey || import.meta.env.VITE_MESHY_API_KEY || '';

  // Si el usuario tiene API Key de Meshy y una URL pública de Cloudinary/Web
  if (apiKey && imageUrl && imageUrl.startsWith('http')) {
    try {
      console.log('🤖 Iniciando generación 3D con Meshy AI...');
      if (onProgress) onProgress(10, 'Iniciando generación con Meshy AI...');

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
          negative_prompt: 'table, furniture, background, wooden board, surface, floor, dining table'
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `Error en Meshy (${response.status})`);
      }

      const data = await response.json();
      const taskId = data.result;
      console.log('⏳ Tarea Meshy creada:', taskId);

      // Sondeo del progreso (polling)
      let attempts = 0;
      while (attempts < 60) {
        await new Promise(r => setTimeout(r, 4000));
        attempts++;

        const pollRes = await fetch(`https://api.meshy.ai/v2/image-to-3d/${taskId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (pollRes.ok) {
          const taskData = await pollRes.json();
          const progress = taskData.progress || Math.min(95, attempts * 4);
          if (onProgress) onProgress(progress, `Construyendo modelo 3D con IA (${progress}%)...`);

          if (taskData.status === 'SUCCEEDED' && taskData.model_urls?.glb) {
            return {
              modelUrl: taskData.model_urls.glb,
              widthCm: '12',
              heightCm: '10',
              depthCm: '12',
              isAiGenerated: true,
              templateName: 'Modelo 3D Generado con IA (Meshy)'
            };
          }

          if (taskData.status === 'FAILED') {
            throw new Error(taskData.task_error?.message || 'Meshy no pudo generar el modelo 3D.');
          }
        }
      }
      throw new Error('Tiempo de espera agotado. El modelo tarda más de lo previsto.');
    } catch (error) {
      console.error('Error generando con Meshy AI:', error);
      throw error;
    }
  }

  // Si no hay API Key configurada
  return {
    ...getCleanTemplateModel({ name, category }),
    hasApiKey: false
  };
};
