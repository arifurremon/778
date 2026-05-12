import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ShieldAlert, 
  CheckCircle2, 
  Ban, 
  Flag, 
  MessageSquare,
  AlertTriangle 
} from 'lucide-react';
import { StatusBadge } from '../display/StatusBadge';

interface ModerationPanelProps {
  entityType: string;
  entityId: string;
  currentStatus: string;
  onAction: (action: string, reason: string) => void;
  isLoading?: boolean;
}

export const ModerationPanel = ({
  entityType,
  entityId,
  currentStatus,
  onAction,
  isLoading
}: ModerationPanelProps) => {
  const [reason, setReason] = React.useState('');

  const handleAction = (action: string) => {
    onAction(action, reason);
    setReason('');
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <CardTitle>Moderation Control</CardTitle>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
        <CardDescription>
          Managing {entityType} ID: {entityId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reason">Moderation Note / Reason</Label>
          <Textarea 
            id="reason"
            placeholder="Describe why this action is being taken..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px] bg-background"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button 
            variant="outline" 
            className="border-green-500 text-green-600 hover:bg-green-50"
            onClick={() => handleAction('approve')}
            disabled={isLoading || currentStatus === 'active'}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
          </Button>
          <Button 
            variant="outline" 
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
            onClick={() => handleAction('suspend')}
            disabled={isLoading || currentStatus === 'suspended'}
          >
            <Ban className="mr-2 h-4 w-4" /> Suspend
          </Button>
          <Button 
            variant="outline" 
            className="border-red-500 text-red-600 hover:bg-red-50"
            onClick={() => handleAction('reject')}
            disabled={isLoading || currentStatus === 'rejected'}
          >
            <AlertTriangle className="mr-2 h-4 w-4" /> Reject
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleAction('flag')}
            disabled={isLoading}
          >
            <Flag className="mr-2 h-4 w-4" /> Flag Review
          </Button>
        </div>
        
        <Button 
          variant="secondary" 
          className="w-full mt-2"
          onClick={() => handleAction('message')}
          disabled={isLoading}
        >
          <MessageSquare className="mr-2 h-4 w-4" /> Send Message to Owner
        </Button>
      </CardContent>
    </Card>
  );
};
