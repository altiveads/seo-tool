import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { AuditAgencyPDF } from './audit-agency';
import { AuditClientPDF } from './audit-client';
import { AdsAgencyPDF } from './ads-agency';
import { AdsClientPDF } from './ads-client';
import type { AuditContent, AdsContent, AuditInput } from '../types';

export interface PdfInputs {
  input: AuditInput;
  audit: AuditContent;
  ads: AdsContent;
}

export type PdfKey =
  | 'auditoria-seo-agencia'
  | 'auditoria-seo-cliente'
  | 'google-ads-agencia'
  | 'google-ads-cliente';

export async function generateAllPdfs(
  ctx: PdfInputs,
): Promise<Record<PdfKey, Buffer>> {
  const render = (el: React.ReactElement) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (renderToBuffer as any)(el) as Promise<Buffer>;

  const [agencyAudit, clientAudit, agencyAds, clientAds] = await Promise.all([
    render(React.createElement(AuditAgencyPDF, { data: ctx.audit })),
    render(React.createElement(AuditClientPDF, { data: ctx.audit })),
    render(React.createElement(AdsAgencyPDF, { data: ctx.ads, input: ctx.input })),
    render(React.createElement(AdsClientPDF, { data: ctx.ads })),
  ]);

  return {
    'auditoria-seo-agencia': agencyAudit,
    'auditoria-seo-cliente': clientAudit,
    'google-ads-agencia': agencyAds,
    'google-ads-cliente': clientAds,
  };
}
