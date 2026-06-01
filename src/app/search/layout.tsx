import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search | The Chattala',
  description: 'Search for anything in The Chattala.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
