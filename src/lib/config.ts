import path from "path";

const isVercel = !!process.env.VERCEL;
const isRender = !!process.env.RENDER;
const isCloud = isVercel || isRender;

export const CONFIG = {
  UPLOAD_DIR: isCloud
    ? "/tmp/uploads"
    : path.join(process.cwd(), "storage", "uploads"),

  PDF_DIR: isCloud
    ? "/tmp/pdfs"
    : path.join(process.cwd(), "storage", "pdfs"),

  ZIP_DIR: isCloud
    ? "/tmp/zips"
    : path.join(process.cwd(), "storage", "zips"),

  TEMP_DIR: isCloud
    ? "/tmp/temp"
    : path.join(process.cwd(), "storage", "temp"),

  TEMPLATE_DIR: path.join(process.cwd(), "templates"),

  DESKTOP_OUTPUT_DIR: path.join(
    process.env.USERPROFILE || "",
    "Desktop",
    "invoice statement"
  ),
};