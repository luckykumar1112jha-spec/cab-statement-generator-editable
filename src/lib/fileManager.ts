import fs from 'fs-extra';
import { CONFIG } from './config';

const isVercel = !!process.env.VERCEL;
const isRender = !!process.env.RENDER;
const isCloud = isVercel || isRender;

export const ensureDirs = async () => {
  await fs.ensureDir(CONFIG.UPLOAD_DIR);
  await fs.ensureDir(CONFIG.PDF_DIR);
  await fs.ensureDir(CONFIG.ZIP_DIR);
  await fs.ensureDir(CONFIG.TEMP_DIR);

  // Only create Desktop folder when running locally
  if (!isCloud) {
    await fs.ensureDir(CONFIG.DESKTOP_OUTPUT_DIR);
  }
};

export const clearDir = async (dir: string) => {
  await fs.emptyDir(dir);
};