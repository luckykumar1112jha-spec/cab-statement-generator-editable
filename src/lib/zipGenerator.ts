import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from './config';
import { ZipArchive } from 'archiver';

export const createZip = async (filePaths: string[], zipName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const zipPath = path.join(CONFIG.ZIP_DIR, zipName);
      const output = fs.createWriteStream(zipPath);
      
      // Using ZipArchive class from archiver v8
      const archive = new ZipArchive({ zlib: { level: 9 } });

      output.on('close', () => resolve(zipPath));
      archive.on('error', (err: any) => reject(err));

      archive.pipe(output);

      filePaths.forEach((filePath: string) => {
        const fileName = path.basename(filePath);
        archive.file(filePath, { name: fileName });
      });

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

export const copyToDesktop = async (zipPath: string) => {
  const isCloud = !!process.env.VERCEL || !!process.env.RENDER;
  if (isCloud) return zipPath; // Skip on cloud

  const destPath = path.join(CONFIG.DESKTOP_OUTPUT_DIR, path.basename(zipPath));
  await fs.copy(zipPath, destPath);
  return destPath;
};
