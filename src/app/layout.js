import './globals.css';
import ClientAuthWrapper from '@/components/ClientAuthWrapper';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ContHabeis - Gestão Financeira',
  description: 'Sistema de gestão financeira ContHabeis',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider>
          <ClientAuthWrapper>
            {children}
          </ClientAuthWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
