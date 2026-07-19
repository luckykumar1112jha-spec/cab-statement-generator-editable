import { TypeAData } from './typeA';
import { TypeBData } from './typeB';

export type InvoiceType = 'TYPE_A' | 'TYPE_B';

export interface ParseResult {
  type: InvoiceType;
  data: any[];
}
