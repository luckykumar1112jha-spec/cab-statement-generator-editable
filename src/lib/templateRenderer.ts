import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { CONFIG } from './config';

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

const formatExcelMonth = (val: any) => {
  if (typeof val === 'number' && val > 30000) {
    try {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }).replace(' ', '-');
    } catch (e) {
      return String(val);
    }
  }
  return String(val || '0');
};

/**
 * Get value by key, supporting duplicate header suffixes (_1, _2)
 */
const getFuzzyValue = (data: any, targetKey: string, occurrenceIndex = 0) => {
  const keys = Object.keys(data);
  const normalizedTarget = normalize(targetKey);
  
  // Create the exact key we are looking for
  const suffix = occurrenceIndex === 0 ? '' : `_${occurrenceIndex}`;
  const exactKey = targetKey + suffix;
  if (data[exactKey] !== undefined) return data[exactKey];

  // If not found exactly, try normalized match
  // For occurrence 0, look for keys that normalize exactly to the target
  // For occurrence 1, look for keys that normalize to target + "1"
  const normalizedSearch = occurrenceIndex === 0 ? normalizedTarget : normalizedTarget + occurrenceIndex;
  
  const foundKey = keys.find(k => normalize(k) === normalizedSearch);
  return foundKey ? data[foundKey] : undefined;
};

const numeric = (val: any) => {
  if (val === undefined || val === null || val === '' || isNaN(Number(val))) return 0;
  // Handle formatted strings like "66,307"
  if (typeof val === 'string') {
    const scrubbed = val.replace(/,/g, '');
    return Math.round(Number(scrubbed));
  }
  return Math.round(Number(val));
};

export const sanitizeRecord = (data: any, type: 'TYPE_A' | 'TYPE_B') => {
  const sanitized: any = {};

  if (type === 'TYPE_A') {
    const mappings: Record<string, string[]> = {
      'S No': ['S No', 'S.No'],
      'Month': ['Month'],
      'Cab No': ['Cab No'],
      'FIX/Trip': ['FIX/Trip'],
      'Route Name': ['Route Name'],
      'Ertiga/Dzire/Tempo': ['Ertiga/Dzire/Tempo'],
      'Fix Price': ['Fix Price'],
      'Trip Amount': ['Trip Amount'],
      'HR TAX': ['HR TAX'],
      'MCD /othar paid': ['MCD /othar paid'],
      'Total Trip': ['Total Trip'],
      'Amount': ['Amount'],
      'Add Taxi Duty Amt.': ['Add Taxi Duty Amt.'],
      'G. Total': ['G. Total'],
      '1% TDS': ['1% TDS'],
      'Total Amount': ['Total Amount'],
      'EMI AMOUNT': ['EMI AMOUNT'],
      'EMI NUMBER': ['EMI NUMBER'],
      'Insurance': ['Insurance'],
      'Cash': ['Cash'],
      'A/C PAY': ['A/C PAY'],
      'CNG CARD': ['CNG CARD'],
      'PETROL/CNG': ['PETROL/CNG'],
      'Maintenance': ['Maintenance'],
      'Compliance': ['Compliance'],
      'ESI/PF': ['ESI/PF'],
      'Salary': ['Salary'],
      'Driver': ['Driver'],
      'HR Tax/Taxi Others': ['HR Tax/Taxi Others'],
      'GPS Charge': ['GPS Charge'],
      'Down Pymt': ['Down Pymt'],
      'Total Expencess': ['Total Expencess'],
      'G,Total': ['G,Total'],
      'Previous Minus': ['Previous Minus'],
      'Final Amount': ['Final Amount'],
      'Owner Name': ['Owner Name'],
      'Company': ['Company']
    };

    Object.keys(mappings).forEach(targetKey => {
      let val: any = undefined;
      for (const alias of mappings[targetKey]) {
        val = getFuzzyValue(data, alias, 0);
        if (val !== undefined) break;
      }
      if (targetKey === 'Month') sanitized[targetKey] = formatExcelMonth(val);
      else if (!['Month', 'Cab No', 'FIX/Trip', 'Route Name', 'Ertiga/Dzire/Tempo', 'Owner Name', 'Company', 'EMI NUMBER', 'Driver'].includes(targetKey)) sanitized[targetKey] = numeric(val);
      else sanitized[targetKey] = (val === null || val === undefined || val === '') ? '0' : String(val);
    });
    sanitized['Ac/C/Card'] = sanitized['CNG CARD'];
    sanitized['Complance'] = sanitized['Compliance'];

  } else {
    console.log("Available Excel columns:", Object.keys(data));

    // Set 1: TRIPS (First occurrence)
    // Set 2: AMOUNTS (Second occurrence)
    const routes = [
      { label: 'DLI(FRONT)', key: 'DLI_FRONT' },
      { label: 'DLI(B2B)', key: 'DLI_B2B' },
      { label: 'FBD (FRONT)', key: 'FBD_FRONT' },
      { label: 'FBD (B2B)', key: 'FBD_B2B' },
      { label: 'GGN (FRONT)', key: 'GGN_FRONT' },
      { label: 'GGN (B2B)', key: 'GGN_B2B' },
      { label: 'NOIDA (FRONT)', key: 'NOIDA_FRONT' },
      { label: 'NOIDA(B2B)', key: 'NOIDA_B2B' },
      { label: 'GZB (FRONT)', key: 'GZB_FRONT' },
      { label: 'GZB(B2B)', key: 'GZB_B2B' }
    ];

    routes.forEach(r => {
      const trip = getFuzzyValue(data, r.label, 0);
      const amt = getFuzzyValue(data, r.label, 1);

      console.log(`${r.label} -> Trip:`, trip, "Amount:", amt);

      sanitized[`${r.key}_TRIP`] = numeric(trip);
      sanitized[`${r.key}_AMT`] = numeric(amt);
    });

    const mappings: Record<string, string[]> = {
      'Month': ['MONTH'],
      'Cab No': ['Cab No.'],
      'Cab Type': ['Cab Type'],
      'Old Amex Trips': ['OLD TRIP', 'Old Amex Trips'],
      '74-A Amex Trips': ['74-AMEX TRIP', '74-A Amex Trips'],
      'TOTAL TRIPS': ['TOTAL TRIP', 'TOTAL TRIPS'],
      'Old Amex Amount': ['CYBER TRIP AMT', 'Old Amex, AMT.'],
      '74-A Company Amount': ['74-A COMP, AMT.'],
      'SHUTTLE CAB AMT': ['Suttle Cab Amt', 'SHUTTLE CAB AMT'],
      'GUARD TRIP': ['GUARD TRIP'],
      'GUARD AMOUNT': ['GUARD AMOUNT'],
      'Amex Amount': ['Amex Amount'],
      'Fastag Amt': ['Refund (Toll+MCD)', 'Fastag Amt. (May\'26)'],
      'Jaquar Pymt': ['Jaquar Pymt'],
      'Hartron': ['Hartron'],
      'Total Amount': ['Total Amt', 'Total Amount'],
      'TDS 1%': ['TDS 1%'],
      'Total Amount After TDS': ['Total Amt', 'Total Amount'],
      'Installment': ['Installment'],
      'NO OF INSTALLMENT': ['NO OF INSTALLMENT'],
      'PETROL/CNG': ['PETROL/CNG'],
      'Penalty': ['Penalty/Taxi', 'Penalty'],
      'INSURANCE': ['INSURANCE'],
      'CASH': ['CASH'],
      'A/C PAY': ['A/C PAY'],
      'CNG-CARD': ['CNG-CARD', 'CNG CARD'],
      'DOWN PYMT': ['DWN PYMT'],
      'ESI-PF': [' (ESI-PF) '],
      'Driver Salary': ['Driver Salary'],
      'DRIVER NAME': ['DRIVER NAME'],
      'Maitenance': ['Maitenance'],
      'Complance': ['Complance'],
      'GPS Rent': ['GPS RENT'],
      'HR TAX': ['HR TAX'],
      'MCD_Tax_Recovery': ['MCD/Up Tax Recovery'],
      'Total Expencess': ['Total Expencess'],
      'Gross Amount': ['Gross Amount', 'Total'],
      'Previous Minus/plus': ['Previous Minus/plus'],
      'FINAL AMOUNT': [' FINAL ', 'FINAL AMOUNT'],
      'Name': ['NAME'],
      'Account Name': ['A/C Name'],
      'Account Number': ['A/c Number', 'A/C NO'],
      'IFSC Code': ['IFSC Code', 'IFSC'],
      'Pan Name': ['Pan Name'],
      'Pan Number': ['Pan Number', 'PAN NO'],
      'Father Name': ['Father Name', 'FATHER NAME']
    };

    Object.keys(mappings).forEach(targetKey => {
      let val: any = undefined;
      for (const alias of mappings[targetKey]) {
        val = getFuzzyValue(data, alias, 0);
        if (val !== undefined) break;
      }
      if (targetKey === 'Month') {
        sanitized[targetKey] = formatExcelMonth(val);
      }
      else if (targetKey === 'NO OF INSTALLMENT') {
        sanitized[targetKey] =
          val === null || val === undefined || val === ''
            ? '0'
            : String(val);
      }
      else if (
        ['Cab No', 'Cab Type', 'DRIVER NAME', 'Name', 'Account Name', 'Account Number',
        'IFSC Code', 'Pan Name', 'Pan Number', 'Father Name', 'Installment']
          .includes(targetKey)
      ) {
        sanitized[targetKey] = (val === null || val === undefined || val === '')
          ? '0'
          : String(val);
      }
      else {
        sanitized[targetKey] = numeric(val);
      }
    });

    // Extra Campus Columns (will be prefixed with C_ during merge in route.ts)
    sanitized.EXTRA_GGN_TRIP = numeric(getFuzzyValue(data, 'EXTRA TRIP GGN', 0));
    sanitized.EXTRA_GGN_AMT = numeric(getFuzzyValue(data, 'EXTRA TRIP AMT. GGN', 0));
    sanitized.EXTRA_DLI_FBD_GZB_TRIP = numeric(getFuzzyValue(data, 'TOTAL (DLI, NOIDA, FBD, GZB)', 0));
    sanitized.EXTRA_DLI_FBD_GZB_AMT = numeric(getFuzzyValue(data, 'EXTRA AMT (DLI, NOIDA, FBD, GZB)', 0));

    // Campus Guard
    sanitized.GUARD_TRIP = numeric(getFuzzyValue(data, 'Guard Trip', 0));
    sanitized.GUARD_AMT = numeric(getFuzzyValue(data, 'Guard Amt.', 0));

    // CyberCity Guard (Excel column: G. T)
    sanitized.G_T = numeric(getFuzzyValue(data, 'G. T', 0));

    // CyberCity Guard Amount (Excel column: GTM)
    sanitized.GTM = numeric(getFuzzyValue(data, 'GTM', 0));

  }

  
  return sanitized;
};

export const renderTemplate = async (type: 'TYPE_A' | 'TYPE_B', sanitizedData: any) => {
  const templateName = type === 'TYPE_A' ? 'typeA' : 'typeB';
  const templatePath = path.join(CONFIG.TEMPLATE_DIR, `${templateName}.html`);
  const templateSource = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource, {
  noEscape: true,
});
  
  
  sanitizedData.finalAmountClass =
  Number(
    sanitizedData["Final Amount"] ??
    sanitizedData["FINAL AMOUNT"]
  ) < 0 ? "negative" : "";

  const monthMap = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

sanitizedData.FastagLabel = "Fastag Amount";

console.log("Month value:", sanitizedData.Month);

const monthStr = String(sanitizedData.Month || "");
const match = monthStr.match(/^([A-Za-z]{3})['-](\d{2})$/);

if (match) {
  const currentMonth = match[1];
  let year = parseInt(match[2], 10);

  let index = monthMap.indexOf(currentMonth);

  if (index !== -1) {
    index++;

    if (index === 12) {
      index = 0;
      year++;
    }

    sanitizedData.FastagLabel =
      `Fastag Amount (${monthMap[index]}-${String(year).padStart(2, "0")})`;
  }
}

  return template(sanitizedData);
  
};

