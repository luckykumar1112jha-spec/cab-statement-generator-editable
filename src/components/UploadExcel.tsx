'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { detectInvoiceType } from '@/lib/invoiceDetector';
import { InvoiceType } from '@/types';
import { parseExcel } from '@/lib/excelParser';

interface Props {
  onDataLoaded: (data: any[], type: InvoiceType) => void;
  label?: string;
  className?: string;
}

export default function UploadExcel({ onDataLoaded, label, className }: Props) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const bstr = e.target?.result;
      if (!bstr) return;
      
      // Use our custom parser that handles duplicate headers
      const buffer = Buffer.from(bstr as ArrayBuffer);
      const data = parseExcel(buffer);
      
      if (data.length > 0) {
        const type = detectInvoiceType(data[0]);
        onDataLoaded(data, type);
      }
    };

    reader.readAsArrayBuffer(file);
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
      } ${className}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <Upload className={`w-10 h-10 ${isDragActive ? 'text-blue-500 animate-bounce' : 'text-gray-400'}`} />
        <p className="mt-2 text-sm font-medium text-gray-700">
          {label || (isDragActive ? 'Drop Excel here' : 'Drag & Drop Excel file here')}
        </p>
      </div>
    </div>
  );
}
