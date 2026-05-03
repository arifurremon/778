import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/logo';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-8 text-center bg-card/50 p-8 rounded-3xl border border-border/50 backdrop-blur-sm shadow-xl">
        <div className="flex justify-center mb-8">
          <Logo width={160} className="mx-auto" />
        </div>
        
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative flex items-center justify-center w-full h-full bg-card border border-border/50 rounded-full shadow-inner">
            <Search className="w-12 h-12 text-accent" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-destructive text-destructive-foreground font-black text-xs px-3 py-1 rounded-full shadow-lg border border-destructive-foreground/20">
            404
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Page not found</h2>
        
        <p className="text-muted-foreground">
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>

        <div className="pt-6">
          <Button 
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-full transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
