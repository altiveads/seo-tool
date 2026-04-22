import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ALTIVE TOOLS — Auditoría SEO & Google Ads automatizadas',
  description:
    'Generador interno de auditorías SEO y estrategias de Google Ads en PDF para agencias y clientes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CO">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-altive-700 text-white grid place-items-center font-bold">
                A
              </div>
              <div>
                <div className="text-lg font-bold tracking-wide text-altive-700">
                  ALTIVE TOOLS
                </div>
                <div className="text-xs text-slate-500 -mt-0.5">
                  Auditoría SEO & Estrategia Google Ads
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400">Uso interno · v0.1</div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="border-t border-slate-200 bg-white mt-16">
          <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-slate-500 flex justify-between">
            <span>© {new Date().getFullYear()} Altive</span>
            <span>Generado con Claude + @react-pdf/renderer</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
