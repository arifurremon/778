import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emergency | The Chattala',
  description: 'Emergency contacts in Chittagong.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
