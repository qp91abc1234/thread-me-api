import * as path from 'path';
import * as multer from 'multer';
import * as fs from 'fs';

export const uploadDest = path.join(__dirname, '../../../../public/upload/');
export const maxFileSize = 1024 * 1024 * 1; // 1 MB

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    if (!fs.existsSync(uploadDest)) {
      fs.mkdirSync(uploadDest);
    }
    cb(null, uploadDest);
  },
  filename: function (_req, file, cb) {
    const name =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      '-' +
      file.originalname;
    cb(null, name);
  },
});

export const multerOptions: Record<string, multer.Options> = {
  uploadFiles: {
    storage: storage,
    limits: {
      fileSize: maxFileSize,
    },
  },
  uploadChunk: {
    storage: storage,
  },
};
