import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Database,
  Check,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { safeArray, safeNumber } from '@/lib/safeData';

export default function DatasetUploadPage() {
  const { appType } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV or XLSX file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('app_type', appType);

    try {
      const res = await api.post('/customers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(res.data);
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.response?.data?.detail || 'Failed to parse and import dataset.');
    } finally {
      setUploading(false);
    }
  };

  const errorsList = safeArray<string>(result?.errors);

  return (
    <AppLayout title="Data Upload" subtitle="Dataset Import & Validation Workflow">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <UploadCloud className="w-5 h-5 text-[#2563EB]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                Dataset Import & Prediction Pipeline
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
              Upload customer telemetry files (.csv or .xlsx) to validate schema columns, compute ML churn probability, and synchronize with your customer roster.
            </p>
          </div>

          <a
            href="/sample_upload.xlsx"
            download
            className="px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-subtle shrink-0"
          >
            <Download className="w-4 h-4 text-[#2563EB]" />
            <span>Download Sample XLSX</span>
          </a>
        </div>

        {/* Workflow Stepper Guide */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
          <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-subtle">
            <span className="font-bold text-[#2563EB] block">1. Upload</span>
            <span className="text-[11px] text-[#64748B]">CSV / XLSX File</span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-subtle">
            <span className="font-bold text-[#2563EB] block">2. Validate</span>
            <span className="text-[11px] text-[#64748B]">Check telemetry schema</span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-subtle">
            <span className="font-bold text-[#2563EB] block">3. Predict</span>
            <span className="text-[11px] text-[#64748B]">Run Logistic ML</span>
          </div>
          <div className="p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-subtle">
            <span className="font-bold text-[#2563EB] block">4. Score</span>
            <span className="text-[11px] text-[#64748B]">Assign risk levels</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-white border border-[#E2E8F0] shadow-subtle">
            <span className="font-bold text-[#16A34A] block">5. Synchronize</span>
            <span className="text-[11px] text-[#64748B]">Live in Roster</span>
          </div>
        </div>

        {/* Upload Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E2E8F0] shadow-card space-y-6">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-xl p-8 text-center transition-colors bg-[#F8FAFC]">
              <UploadCloud className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-[#172033] font-bold text-sm">
                Select or Drag & Drop Customer File
              </p>
              <p className="text-[#64748B] text-xs mt-1">
                Supports CSV or XLSX containing customer telemetry columns (login_days, hours_spent, support_tickets, app_rating, etc.)
              </p>

              <input
                type="file"
                accept=".csv, .xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="mt-4 inline-block px-4 py-2 bg-white hover:bg-slate-50 text-[#2563EB] font-semibold text-xs rounded-lg cursor-pointer border border-[#E2E8F0] shadow-subtle transition-all"
              >
                Choose File from Computer
              </label>

              {file && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold">
                  <FileText className="w-4 h-4" />
                  <span>
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#E2E8F0]">
              <div className="text-xs text-[#64748B]">
                Selected Industry Context:{' '}
                <strong className="text-[#172033]">{appType}</strong>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {uploading ? (
                  <span>Processing & Running ML...</span>
                ) : (
                  <>
                    <span>Validate & Import Dataset</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Import Results Summary */}
        {result && (
          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-card space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                <h3 className="text-base font-bold text-[#172033]">
                  Import Execution Summary
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-green-50 text-[#16A34A] border border-green-200 text-xs font-bold uppercase tracking-wider">
                {result.status || 'SUCCESS'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B] text-xs font-semibold block">Total Rows Analyzed</span>
                <div className="text-2xl font-bold text-[#172033] mt-1 font-sans">
                  {safeNumber(result.total_rows, 0)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-50/60 border border-green-200">
                <span className="text-[#16A34A] text-xs font-semibold block">Valid Rows</span>
                <div className="text-2xl font-bold text-[#16A34A] mt-1 font-sans">
                  {safeNumber(result.valid_rows, 0)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200">
                <span className="text-[#D97706] text-xs font-semibold block">Invalid Rows</span>
                <div className="text-2xl font-bold text-[#D97706] mt-1 font-sans">
                  {safeNumber(result.invalid_rows, 0)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
                <span className="text-[#2563EB] text-xs font-semibold block">Imported & Predicted</span>
                <div className="text-2xl font-bold text-[#2563EB] mt-1 font-sans">
                  {safeNumber(result.imported_rows, 0)}
                </div>
              </div>
            </div>

            {errorsList.length > 0 && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#D97706]" />
                  <span>Validation Warnings / Notes:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[#64748B]">
                  {errorsList.map((errStr: string, idx: number) => (
                    <li key={idx}>{errStr}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Link
                href="/customers"
                className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>View Imported Customers in Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
