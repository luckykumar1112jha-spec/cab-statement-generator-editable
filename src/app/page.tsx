'use client';

import React, { useState } from 'react';
import UploadExcel from '@/components/UploadExcel';
import { InvoiceType } from '@/types';
import { CheckCircle2, Loader2, Download, AlertCircle, FileSpreadsheet, Plus } from 'lucide-react';

export default function Dashboard() {
  const [mainData, setMainData] = useState<any[] | null>(null);
  const [campusData, setCampusData] = useState<any[] | null>(null);
  const [type, setType] = useState<InvoiceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remarksEn, setRemarksEn] = useState<string>('');
  const [remarksHi, setRemarksHi] = useState<string>('');

  const handleMainLoaded = (data: any[], detectedType: InvoiceType) => {
    setMainData(data);
    setType(detectedType);
    setZipUrl(null);
    setError(null);
  };

  const handleCampusLoaded = (data: any[]) => {
    setCampusData(data);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!mainData || !type) return;

    setLoading(true);
    setProgress(10);
    setError(null);

    try {
      setProgress(30);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: mainData, 
          type,
          campusData: campusData,
          remarksEn: remarksEn,
          remarksHi: remarksHi
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate invoices');
      }

      setProgress(90);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setZipUrl(url);
      setProgress(100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMainData(null);
    setCampusData(null);
    setType(null);
    setZipUrl(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Cab Statement Generator
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Generate professional vehicle payment invoices in bulk.
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* MAIN DATA UPLOAD */}
            {!mainData ? (
              <UploadExcel 
                onDataLoaded={handleMainLoaded} 
                label="Step 1: Upload Primary Excel"
                className="h-full"
              />
            ) : (
              <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl flex flex-col justify-center items-center text-center">
                <CheckCircle2 className="w-10 h-10 text-blue-500 mb-2" />
                <p className="font-bold text-blue-900 text-lg">Primary Loaded</p>
                <p className="text-sm text-blue-700">{mainData.length} records detected</p>
                <p className="text-xs font-bold text-blue-500 mt-1 uppercase tracking-wider">
                  {type === 'TYPE_A' ? 'Jaquar Format' : 'Campus/Amex Format'}
                </p>
              </div>
            )}

            {/* CAMPUS DATA UPLOAD (Only for Type B) */}
            {type === 'TYPE_B' && (
              !campusData ? (
                <UploadExcel 
                  onDataLoaded={handleCampusLoaded} 
                  label="Step 2: Upload Campus (74-A) Excel"
                  className="h-full border-purple-300 bg-purple-50 hover:bg-purple-100"
                />
              ) : (
                <div className="p-6 bg-purple-50 border-2 border-purple-200 rounded-xl flex flex-col justify-center items-center text-center">
                  <CheckCircle2 className="w-10 h-10 text-purple-500 mb-2" />
                  <p className="font-bold text-purple-900 text-lg">Campus Data Loaded</p>
                  <p className="text-sm text-purple-700">{campusData.length} Campus records</p>
                </div>
              )
            )}

            {type === 'TYPE_A' && (
               <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col justify-center items-center text-center text-gray-400">
                  <p className="text-sm italic">Additional files not required for Jaquar layout</p>
               </div>
            )}
          </div>

          {mainData && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <label htmlFor="remarksEn" className="block text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">
                  Remarks (English)
                </label>
                <textarea
                  id="remarksEn"
                  rows={2}
                  className="w-full p-3 border border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="e.g. Please verify trips..."
                  value={remarksEn}
                  onChange={(e) => setRemarksEn(e.target.value)}
                />
              </div>
              <div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-xl">
                <label htmlFor="remarksHi" className="block text-sm font-bold text-orange-800 uppercase tracking-wider mb-2">
                  Remarks (हिन्दी)
                </label>
                <textarea
                  id="remarksHi"
                  rows={2}
                  className="w-full p-3 border border-orange-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                  placeholder="जैसे: कृपया लॉगबुक के साथ मिलान करें..."
                  value={remarksHi}
                  onChange={(e) => setRemarksHi(e.target.value)}
                />
              </div>
            </div>
          )}

          {mainData && (
            <div className="space-y-6">
              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Generating PDFs...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="mr-2 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-4">
                {!zipUrl ? (
                  <>
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="flex-1 flex justify-center items-center py-4 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed text-lg font-bold transition-transform active:scale-95"
                    >
                      {loading ? (
                        <><Loader2 className="animate-spin mr-2" /> Generating...</>
                      ) : (
                        'Generate All Invoices'
                      )}
                    </button>
                    <button onClick={reset} className="px-6 py-4 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 font-medium">Reset</button>
                  </>
                ) : (
                  <a
                    href={zipUrl}
                    download="invoices.zip"
                    className="flex-1 flex justify-center items-center py-5 px-4 border border-transparent rounded-md shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-xl font-bold animate-pulse"
                  >
                    <Download className="mr-2" />
                    Download ZIP Now
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-900 text-white p-6 rounded-2xl shadow-lg overflow-hidden relative">
           <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <FileSpreadsheet className="mr-2 w-5 h-5" /> 
                How to use Dual-Excel (Type B)
              </h3>
              <ul className="text-sm text-blue-100 space-y-1 list-disc pl-5">
                <li>Upload the **Primary Excel** (Summary & Expenses) first.</li>
                <li>If Type B is detected, a **Step 2** box will appear.</li>
                <li>Upload the **Campus (74-A) Excel** there.</li>
                <li>The system will automatically match rows by **Cab No.**</li>
              </ul>
           </div>
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Plus className="w-32 h-32" />
           </div>
        </div>
      </div>
    </main>
  );
}
