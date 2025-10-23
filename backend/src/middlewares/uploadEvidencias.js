import multer from 'multer';
import path from 'path';
import fs from 'fs';

const baseDir = path.join(process.cwd(), 'uploads', 'denuncias');
fs.mkdirSync(baseDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, baseDir);
  },
  filename: (req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

const allowed = [
  // imágenes
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  // documentos
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain',
  // audio
  'audio/mpeg', 'audio/wav',
  // video
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
];

const uploadEvidencias = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    // Permitir por extensión como fallback
    const ext = path.extname(file.originalname).toLowerCase();
    const byExt = ['.pdf','.jpg','.jpeg','.png','.gif','.mp4','.mov','.avi','.mkv','.doc','.docx','.xls','.xlsx','.txt','.mp3','.wav'];
    if (byExt.includes(ext)) return cb(null, true);
    return cb(new Error('Formato de archivo no soportado'));
  },
});

export default uploadEvidencias;

