# Cab Statement Generator

A production-ready web application to generate bulk PDF vehicle payment statements from Excel files.

## Features
- Dashboard with Drag & Drop Excel Upload
- Progress Bar for PDF generation
- Auto-detection of Invoice Layout (Type A: Jaquar, Type B: Campus/Amex)
- Bulk PDF Generation (1000+ records supported)
- Automatic ZIP bundling
- Automatic copy to Desktop folder "invoice statement"

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Puppeteer (PDF Engine)
- XLSX (SheetJS)
- Handlebars (Templating)
- Archiver (ZIP Engine)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage
1. Prepare your Excel file with the required columns.
2. Drag and drop the file onto the dashboard.
3. Click "Generate Invoices".
4. Once finished, download the ZIP file.
5. The ZIP will also be available on your Desktop in the "invoice statement" folder.
