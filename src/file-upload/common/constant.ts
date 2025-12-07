import * as path from 'path';

export const uploadDest = path.join(process.cwd(), './public/upload/');
export const maxFileSize = 1024 * 1024 * 1; // 1m
export const allowFileType = /\/(jpeg|png|gif|webp)$/;
