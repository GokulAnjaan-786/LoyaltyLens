import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, Download } from 'lucide-react';
import Link from 'next/link';

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
      setError(err.response?.data?.detail || 'Failed to parse and import dataset.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <UploadCloud className="w-7 h-7 text-emerald-400" />
              Dataset Import & Column Mapping Workflow
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Upload customer datasets (.csv or .xlsx) to validate schema, run ML churn prediction, and import into database.
            </p>
          </div>
          <a
            href="/sample_upload.xlsx"
            download
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Sample XLSX</span>
          </a>
        </div>

        {/* Upload Form Card */}
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-colors bg-slate-800/30">
              <UploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-white font-semibold text-sm">Select or Drag & Drop CSV / XLSX File</p>
              <p className="text-slate-400 text-xs mt-1">Supports standard customer telemetry columns (login_days, support_tickets, app_rating, etc.)</p>

              <input
                type="file"
                accept=".csv, .xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="mt-4 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl cursor-pointer border border-slate-700 transition-all"
              >
                Choose File
              </label>

              {file && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-semibold">
                  <FileText className="w-4 h-4" />
                  <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Current Target Industry: <span className="text-white font-semibold">{appType}</span>
              </div>
              <button
                type="submit"
                disabled={uploading || !file}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {uploading ? (
                  <span>Processing & Importing...</span>
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
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Validation & Import Summary Output */}
        {result && (
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Import Execution Summary</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                {result.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-slate-400 text-xs uppercase font-semibold">Total Rows</span>
                <div className="text-2xl font-bold text-white mt-1">{result.total_rows}</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-emerald-400 text-xs uppercase font-semibold">Valid Rows</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{result.valid_rows}</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-amber-400 text-xs uppercase font-semibold">Invalid Rows</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{result.invalid_rows}</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-teal-300 text-xs uppercase font-semibold">Imported Records</span>
                <div className="text-2xl font-bold text-teal-300 mt-1">{result.imported_rows}</div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <p className="font-bold">Validation Warnings / Errors:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {result.errors.map((errStr: string, idx: number) => (
                    <li key={idx}>{errStr}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Link
                href="/customers"
                className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg hover:bg-emerald-500 transition-all"
              >
                View Imported Customers Table &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
