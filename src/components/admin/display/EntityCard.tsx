import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface EntityCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  status?: React.ReactNode;
  metadata?: { label: string; value: string | number }[];
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  actions?: React.ReactNode;
}

export const EntityCard = ({
  title,
  subtitle,
  image,
  status,
  metadata,
  onView,
  onEdit,
  onDelete,
  className,
  actions
}: EntityCardProps) => {
  return (
    <Card className={cn("overflow-hidden group hover:shadow-md transition-all duration-300", className)}>
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          {image && (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
              <img src={image} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-semibold text-sm truncate">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {metadata && metadata.length > 0 && (
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {metadata.map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
      
      {actions && (
        <CardFooter className="p-4 pt-0 flex justify-end gap-2">
          {actions}
        </CardFooter>
      )}
    </Card>
  );
};
