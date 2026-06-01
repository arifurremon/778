import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Directory | The Chattala',
  description: 'Find local shops and services in Chittagong.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
