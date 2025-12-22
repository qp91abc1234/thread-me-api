import * as path from 'path';
import * as multer from 'multer';
import * as fs from 'fs';
import { BusinessExceptions } from 'src/common/utils/exception';

export const uploadDest = path.join(__dirname, '../../../public/upload/');
export const maxFileSize = 1024 * 1024 * 1; // 1 MB
export const allowFileType = /\/(jpeg|png|gif|webp)$/;

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDest)) {
      fs.mkdirSync(uploadDest);
    }
    cb(null, uploadDest);
  },
  filename: function (req, file, cb) {
    const name =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      '-' +
      file.originalname;
    cb(null, name);
  },
});

export const multerOptions: multer.Options = {
  storage: storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.match(allowFileType)) {
      cb(BusinessExceptions.UNSUPPORT_FILE_TYPE());
    } else {
      cb(null, true);
    }
  },
};
