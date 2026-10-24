import { CONFIG } from './config.js';

export async function uploadImage(file) {
  if (!file) throw new Error('No se seleccionó ningún archivo.');
  
  const maxSize = CONFIG.IMAGE_MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`La imagen supera el límite de ${CONFIG.IMAGE_MAX_SIZE_MB} MB.`);
  }

  if (!CONFIG.IMAGE_ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato no permitido. Usa JPG, PNG o WebP.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);
  
  // ❌ ELIMINADA LA LÍNEA DEL FOLDER: 
  // formData.append('folder', 'menu_hotdog'); 

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error al subir la imagen a Cloudinary.');
    }

    return {
      url: data.secure_url,
      public_id: data.public_id
    };
  } catch (error) {
    console.error('[Cloudinary] Error:', error);
    throw error;
  }
}