import { NextRequest, NextResponse } from 'next/server';
import { ensureDirs, clearDir } from '@/lib/fileManager';
import { renderTemplate, sanitizeRecord } from '@/lib/templateRenderer';
import { generatePdf, initBrowser, closeBrowser } from '@/lib/pdfGenerator';
import { createZip, copyToDesktop } from '@/lib/zipGenerator';
import { CONFIG } from '@/lib/config';
import fs from 'fs-extra';

export const maxDuration = 300; 

export async function POST(req: NextRequest) {
  try {
    const { data, type, campusData, remarksEn, remarksHi } = await req.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    await ensureDirs();
    await clearDir(CONFIG.PDF_DIR);
    await clearDir(CONFIG.ZIP_DIR);
    await clearDir(CONFIG.TEMP_DIR);

    const pdfPaths: string[] = [];
    await initBrowser();

    try {
      for (const record of data) {
        // 1. Sanitize the main record
        const cleanData = sanitizeRecord(record, type);
        
        // Add dual-language remarks to the data object for the template
        cleanData.remarksEn = remarksEn;
        cleanData.remarksHi = remarksHi;

        // 2. If it's Type B and we have campus data, merge them
        if (type === 'TYPE_B' && Array.isArray(campusData)) {
          // Normalize cab no for comparison
          const cabNo = String(cleanData['Cab No'] || '').trim();
          
          const campusMatch = campusData.find(c => {
             const cCab = String(c['Cab No.'] || c['Cab No'] || '').trim();
             return cCab === cabNo;
          });
          
          if (campusMatch) {
            // Sanitize campus record
            const cleanCampus = sanitizeRecord(campusMatch, 'TYPE_B');
            
            // Map the specific route trips/amts from campus sheet into cleanData for the table
            // We use the C_ prefix in the template to identify Campus Sheet data
            Object.keys(cleanCampus).forEach(k => {
               if (k.includes('_TRIP') || k.includes('_AMT')) {
                 cleanData[`C_${k}`] = cleanCampus[k];
               }
            });
            
            // Override summary fields if they exist in campus sheet
            // ===============================
            // Route Totals
            // ===============================

            // Campus Total (Top)
            cleanData["74-A Amex Trips"] =
              Number(cleanData.C_DLI_FRONT_TRIP || 0) +
              Number(cleanData.C_DLI_B2B_TRIP || 0) +
              Number(cleanData.C_FBD_FRONT_TRIP || 0) +
              Number(cleanData.C_FBD_B2B_TRIP || 0) +
              Number(cleanData.C_GGN_FRONT_TRIP || 0) +
              Number(cleanData.C_GGN_B2B_TRIP || 0) +
              Number(cleanData.C_NOIDA_FRONT_TRIP || 0) +
              Number(cleanData.C_NOIDA_B2B_TRIP || 0) +
              Number(cleanData.C_GZB_FRONT_TRIP || 0) +
              Number(cleanData.C_GZB_B2B_TRIP || 0);

            cleanData["74-A Company Amount"] =
              Number(cleanData.C_DLI_FRONT_AMT || 0) +
              Number(cleanData.C_DLI_B2B_AMT || 0) +
              Number(cleanData.C_FBD_FRONT_AMT || 0) +
              Number(cleanData.C_FBD_B2B_AMT || 0) +
              Number(cleanData.C_GGN_FRONT_AMT || 0) +
              Number(cleanData.C_GGN_B2B_AMT || 0) +
              Number(cleanData.C_NOIDA_FRONT_AMT || 0) +
              Number(cleanData.C_NOIDA_B2B_AMT || 0) +
              Number(cleanData.C_GZB_FRONT_AMT || 0) +
              Number(cleanData.C_GZB_B2B_AMT || 0);

            // CyberCity Total (Top)
            cleanData.CyberCity_Sum_Trip =
              Number(cleanData.DLI_FRONT_TRIP || 0) +
              Number(cleanData.DLI_B2B_TRIP || 0) +
              Number(cleanData.FBD_FRONT_TRIP || 0) +
              Number(cleanData.FBD_B2B_TRIP || 0) +
              Number(cleanData.GGN_FRONT_TRIP || 0) +
              Number(cleanData.GGN_B2B_TRIP || 0) +
              Number(cleanData.NOIDA_FRONT_TRIP || 0) +
              Number(cleanData.NOIDA_B2B_TRIP || 0) +
              Number(cleanData.GZB_FRONT_TRIP || 0) +
              Number(cleanData.GZB_B2B_TRIP || 0);

            cleanData.CyberCity_Sum_Amt =
              Number(cleanData.DLI_FRONT_AMT || 0) +
              Number(cleanData.DLI_B2B_AMT || 0) +
              Number(cleanData.FBD_FRONT_AMT || 0) +
              Number(cleanData.FBD_B2B_AMT || 0) +
              Number(cleanData.GGN_FRONT_AMT || 0) +
              Number(cleanData.GGN_B2B_AMT || 0) +
              Number(cleanData.NOIDA_FRONT_AMT || 0) +
              Number(cleanData.NOIDA_B2B_AMT || 0) +
              Number(cleanData.GZB_FRONT_AMT || 0) +
              Number(cleanData.GZB_B2B_AMT || 0);

            // ===============================
            // Bottom TOTAL Row
            // ===============================

            cleanData.Campus_Extra_Trip_Total =
              Number(cleanData.C_EXTRA_GGN_TRIP || 0) +
              Number(cleanData.C_EXTRA_DLI_FBD_GZB_TRIP || 0) +
              Number(cleanData.C_GUARD_TRIP || 0);

            cleanData.Campus_Extra_Amt_Total =
              Number(cleanData.C_EXTRA_GGN_AMT || 0) +
              Number(cleanData.C_EXTRA_DLI_FBD_GZB_AMT || 0) +
              Number(cleanData.C_GUARD_AMT || 0);

            cleanData.Cyber_Extra_Trip_Total =
              Number(cleanData.G_T || 0);

            cleanData.Cyber_Extra_Amt_Total =
              Number(cleanData.GTM || 0);
          }
        }

            // ===============================
            // Highlight Important Negative Values
            // ===============================

            cleanData.totalAfterTdsClass =
              Number(cleanData["Total Amount After TDS"] || 0) < 0 ? "negative" : "";

            cleanData.grossAmountClass =
              Number(cleanData["Gross Amount"] || 0) < 0 ? "negative" : "";

            cleanData.previousMinusClass =
              Number(cleanData["Previous Minus/plus"] || 0) < 0 ? "negative" : "";

            cleanData.finalAmountClass =
              Number(cleanData["FINAL AMOUNT"] || 0) < 0 ? "negative" : "";

            cleanData.campusTotalAmtClass =
              Number(cleanData["74-A Company Amount"] || 0) < 0 ? "negative" : "";

            cleanData.cyberTotalAmtClass =
              Number(cleanData.CyberCity_Sum_Amt || 0) < 0 ? "negative" : "";

            cleanData.campusExtraAmtClass =
              Number(cleanData.Campus_Extra_Amt_Total || 0) < 0 ? "negative" : "";

            cleanData.cyberExtraAmtClass =
              Number(cleanData.Cyber_Extra_Amt_Total || 0) < 0 ? "negative" : "";

        const html = await renderTemplate(type, cleanData);
        
        const cabNo = cleanData['Cab No'] || 'unknown';
        const sanitizedCabNo = String(cabNo).replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${sanitizedCabNo}.pdf`;
        
        const pdfPath = await generatePdf(html, fileName);
        pdfPaths.push(pdfPath);
      }
    } finally {
      await closeBrowser();
    }

    if (pdfPaths.length === 0) {
      return NextResponse.json({ error: 'No PDFs generated' }, { status: 400 });
    }

    const zipName = `invoices.zip`;
    const zipPath = await createZip(pdfPaths, zipName);
    await copyToDesktop(zipPath);

    const zipBuffer = await fs.readFile(zipPath);
    await clearDir(CONFIG.PDF_DIR);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
      },
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
