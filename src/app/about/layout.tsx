import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | The Chattala',
  description: 'Vision and Legacy of The Chattala.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
