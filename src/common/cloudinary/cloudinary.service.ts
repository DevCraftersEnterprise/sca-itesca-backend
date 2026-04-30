import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
const toStream = require('buffer-to-stream');
@Injectable()
export class CloudinaryService {
  constructor() {
    const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };

  // DEBUG: Esto te dirá en la terminal qué está leyendo realmente
  console.log("Configurando Cloudinary con:", config.cloud_name);

  if (!config.cloud_name) {
    console.error("ERROR: El Cloud Name llegó vacío. Revisa tu archivo .env");
  }

  cloudinary.config(config);
  }
  
  async uploadFile(
    file: Express.Multer.File,
    publicId?: string,
  ): Promise<string> {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'constancias_itesca',
        resource_type: 'auto',

        public_id: publicId,       // 🔥 NOMBRE REAL
        overwrite: true,           // 🔥 evita duplicados
        unique_filename: false,    // 🔥 IMPORTANTE
        use_filename: false,       // 🔥 IMPORTANTE
      },
      (error: UploadApiErrorResponse, result: UploadApiResponse) => {
        if (error) {
          return reject(new Error(error.message || 'Error desconocido en Cloudinary'));
        }
        if (!result) {
          return reject(new Error('No se recibió respuesta de Cloudinary'));
        }

        resolve(result.secure_url);
      },
    );

    toStream(file.buffer).pipe(upload);
  });
}
}