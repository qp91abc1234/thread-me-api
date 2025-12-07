import * as multer from 'multer';
import * as fs from 'fs';
import { uploadDest } from './constant';

const storage = multer.diskStorage({
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

export { storage };
