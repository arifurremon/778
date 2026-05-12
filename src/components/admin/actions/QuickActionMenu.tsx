import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash, Eye, CheckCircle, Ban, Mail } from 'lucide-react';

interface QuickActionMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onBan?: () => void;
  onEmail?: () => void;
  extraActions?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }[];
}

export const QuickActionMenu = ({
  onView,
  onEdit,
  onDelete,
  onApprove,
  onBan,
  onEmail,
  extraActions
}: QuickActionMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
        )}
        {onEmail && (
          <DropdownMenuItem onClick={onEmail}>
            <Mail className="mr-2 h-4 w-4" /> Message
          </DropdownMenuItem>
        )}
        
        {(onApprove || onBan) && <DropdownMenuSeparator />}
        
        {onApprove && (
          <DropdownMenuItem onClick={onApprove} className="text-green-600">
            <CheckCircle className="mr-2 h-4 w-4" /> Approve
          </DropdownMenuItem>
        )}
        {onBan && (
          <DropdownMenuItem onClick={onBan} className="text-orange-600">
            <Ban className="mr-2 h-4 w-4" /> Suspend
          </DropdownMenuItem>
        )}
        
        {extraActions && extraActions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {extraActions.map((action, idx) => (
              <DropdownMenuItem 
                key={idx} 
                onClick={action.onClick}
                className={action.destructive ? "text-destructive" : ""}
              >
                <span className="mr-2">{action.icon}</span>
                {action.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
