export function DocumentUploadProgress({ progress, fileName }: { progress: number; fileName: string }) {
  return <div role="status" aria-live="polite" className="rounded-lg border border-blue-200 bg-blue-50 p-4">
    <div className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium text-blue-950">Uploading {fileName}</span><span className="shrink-0 text-blue-900">{progress}%</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress}%` }} /></div>
  </div>;
}
