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
  
  async uploadFile(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { 
          folder: 'constancias_itesca', 
          resource_type: 'raw',
          format: 'pdf',
          access_mode: 'public',
          use_filename: true,
          unique_filename: true,
          type: 'upload',
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) return reject(error);
          if (!result) {
            return reject(new BadRequestException('Error al subir archivo a Cloudinary'));
          }

          resolve(result.secure_url);
        },
      );
      
      toStream(file.buffer).pipe(upload);
    });
  }
}