import { InvoiceType } from '@/types';

export const detectInvoiceType = (firstRow: any): InvoiceType => {
  const keys = Object.keys(firstRow);
  if (keys.some(key => key === 'Route Name')) {
    return 'TYPE_A';
  }
  if (keys.some(key => key === 'DLI(FRONT)')) {
    return 'TYPE_B';
  }
  
  // Fallback check
  if (keys.includes('Month') && keys.includes('Owner Name')) return 'TYPE_A';
  if (keys.includes('Total Trips') && keys.includes('Guard Trips')) return 'TYPE_B';

  return 'TYPE_A'; 
};
