// Thin wrappers around dataLayer. All functions are SSR-safe (no-op on server).
type DataLayer = Record<string, unknown>;
declare global {
  interface Window {
    dataLayer?: DataLayer[];
  }
}

function push(event: DataLayer): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export function trackRfqStep(step: number): void {
  push({ event: 'rfq_step', step });
}

export function trackFormSubmit(formName: string): void {
  push({ event: 'form_submit', form: formName });
}

export function trackWhatsAppClick(page: string): void {
  push({ event: 'whatsapp_click', page });
}

export function trackCsvDownload(count: number): void {
  push({ event: 'csv_download', count });
}

export function trackModelView(sku: string): void {
  push({ event: 'product_view', sku });
}

export function track3DInteraction(sku: string): void {
  push({ event: 'product_3d_view', sku });
}
