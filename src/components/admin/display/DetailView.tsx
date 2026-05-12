import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailViewProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  isEditing?: boolean;
  onEditToggle?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const DetailView = ({
  title,
  subtitle,
  onBack,
  actions,
  children,
  isEditing,
  onEditToggle,
  onSave,
  onCancel,
  className
}: DetailViewProps) => {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
          {!isEditing ? (
            onEditToggle && (
              <Button onClick={onEditToggle} variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            )
          ) : (
            <>
              <Button onClick={onCancel} variant="ghost" size="sm">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={onSave} variant="default" size="sm">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid gap-6">
        {children}
      </div>
    </div>
  );
};

export const DetailSection = ({ 
  title, 
  children, 
  className 
}: { 
  title?: string; 
  children: React.ReactNode; 
  className?: string 
}) => (
  <div className={cn("space-y-4", className)}>
    {title && <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>}
    {children}
  </div>
);

export const DetailItem = ({ 
  label, 
  value, 
  className 
}: { 
  label: string; 
  value: React.ReactNode; 
  className?: string 
}) => (
  <div className={cn("flex flex-col space-y-1", className)}>
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    <div className="text-sm font-medium">{value || '—'}</div>
  </div>
);
