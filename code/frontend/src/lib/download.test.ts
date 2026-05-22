import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadFile, reportDownloadUrl } from './download';

describe('reportDownloadUrl', () => {
  it('builds the endpoint URL with an encoded snapshot id', () => {
    expect(reportDownloadUrl('snap 1', 'pdf')).toBe('/api/report/download/snap%201/pdf');
    expect(reportDownloadUrl('s1', 'docx')).toBe('/api/report/download/s1/docx');
  });
});

describe('downloadFile', () => {
  afterEach(() => vi.restoreAllMocks());

  it('creates a transient anchor, clicks it, and removes it from the DOM', () => {
    const click = vi.fn();
    const realCreate = document.createElement.bind(document);
    const created: HTMLAnchorElement[] = [];
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag) as HTMLElement;
      if (tag === 'a') {
        (el as HTMLAnchorElement).click = click;
        created.push(el as HTMLAnchorElement);
      }
      return el;
    });

    downloadFile('/api/report/download/snap-1/docx');

    expect(created).toHaveLength(1);
    expect(created[0]!.href).toContain('/api/report/download/snap-1/docx');
    expect(click).toHaveBeenCalledOnce();
    expect(created[0]!.isConnected).toBe(false);
  });
});
