import { jsPDF } from 'jspdf';
import { uploadToStorage } from '@/lib/storage';

type ReceiptInput = {
  tenantId: string;
  businessName: string;
  partitaIva: string | null;
  address: string | null;
  plan: string; // ex: "Starter 6 mesi"
  amountCents: number;
  paidAt: Date;
  servicePeriodStart: Date;
  servicePeriodEnd: Date;
  withdrawalEndAt: Date;
  receiptNumber: string; // gerar curto pra impressão (ex: F-202605-A1B2)
};

export type ReceiptResult = {
  url: string;
  storage_key: string;
};

/**
 * Gera recibo PDF não-fiscal (factory operava sob CNPJ Brasil até MEI/SRL
 * ativos). Sobe pra Supabase Storage path tenants/{id}/receipts/{number}.pdf.
 *
 * Uso:
 *   const r = await generateAndUploadReceipt({...});
 *   r.url → public URL pra colocar em welcome email + tenants.cash_receipt_pdf_url
 */
export async function generateAndUploadReceipt(input: ReceiptInput): Promise<ReceiptResult> {
  const pdf = buildReceiptPdf(input);
  const arr = pdf.output('arraybuffer');
  const buf = Buffer.from(arr);

  const path = `tenants/${input.tenantId}/receipts/${input.receiptNumber}.pdf`;
  return uploadToStorage({
    path,
    body: buf,
    contentType: 'application/pdf',
    upsert: true,
  });
}

function buildReceiptPdf(input: ReceiptInput): jsPDF {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const left = 20;
  let y = 22;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Factory', left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Ricevuta non fiscale', left + 28, y - 1);

  y += 12;
  doc.setDrawColor(180);
  doc.line(left, y, 190, y);
  y += 8;

  // Receipt number + date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ricevuta n°:', left, y);
  doc.setFont('helvetica', 'normal');
  doc.text(input.receiptNumber, left + 32, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', left, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(input.paidAt), left + 32, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Pagamento:', left, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Contanti', left + 32, y);

  y += 12;

  // Cliente
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', left, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(input.businessName, left, y);
  y += 5;
  if (input.partitaIva) {
    doc.text(`P.IVA: ${input.partitaIva}`, left, y);
    y += 5;
  }
  if (input.address) {
    doc.text(input.address, left, y);
    y += 5;
  }

  y += 8;

  // Servizio
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Servizio', left, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pacchetto: ${input.plan}`, left, y);
  y += 5;
  doc.text(
    `Periodo: ${formatDate(input.servicePeriodStart)} → ${formatDate(input.servicePeriodEnd)}`,
    left,
    y,
  );
  y += 5;
  doc.text(
    `Diritto di recesso fino a: ${formatDate(input.withdrawalEndAt)}`,
    left,
    y,
  );

  y += 12;

  // Total
  doc.setDrawColor(180);
  doc.line(left, y, 190, y);
  y += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Totale incassato', left, y);
  doc.text(formatEuro(input.amountCents), 190, y, { align: 'right' });

  y += 18;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  const footerLines = [
    'Documento non fiscale generato automaticamente.',
    'Factory — piattaforma SaaS per esercizi food & beverage.',
    'I Termini di Servizio, l’informativa Privacy e il DPA sono disponibili',
    'su https://factory.app/legal e accettati al momento del pagamento.',
  ];
  for (const line of footerLines) {
    doc.text(line, left, y);
    y += 4;
  }

  return doc;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatEuro(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function generateReceiptNumber(tenantId: string, paidAt: Date): string {
  const ym = paidAt.toISOString().slice(0, 7).replace('-', '');
  const slug = tenantId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `F-${ym}-${slug}`;
}
