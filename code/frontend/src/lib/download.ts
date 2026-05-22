/**
 * Trigger a real browser download of a URL via a transient anchor element.
 * Used for report exports (DOCX/PDF) served by GET /api/report/download/:id/:format.
 */
export function downloadFile(url: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** URL of the report download endpoint for a snapshot + format. */
export function reportDownloadUrl(snapshotId: string, format: 'docx' | 'pdf'): string {
  return `/api/report/download/${encodeURIComponent(snapshotId)}/${format}`;
}
