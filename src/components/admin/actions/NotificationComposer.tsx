import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Mail, Bell, Smartphone } from 'lucide-react';

interface NotificationComposerProps {
  recipientName?: string;
  recipientId?: string;
  onSend: (data: { title: string; body: string; type: string }) => void;
  isLoading?: boolean;
}

export const NotificationComposer = ({
  recipientName,
  recipientId,
  onSend,
  isLoading
}: NotificationComposerProps) => {
  const [data, setData] = React.useState({
    title: '',
    body: '',
    type: 'system'
  });

  const handleSend = () => {
    onSend(data);
    setData({ title: '', body: '', type: 'system' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compose Notification</CardTitle>
        {recipientName && (
          <div className="text-sm text-muted-foreground">
            Recipient: <span className="font-medium text-foreground">{recipientName}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="type">Notification Channel</Label>
          <Select 
            value={data.type} 
            onValueChange={(v) => setData({ ...data, type: v })}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" /> System Alert
                </div>
              </SelectItem>
              <SelectItem value="email">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </div>
              </SelectItem>
              <SelectItem value="push">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" /> Push Notification
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="title">Subject / Title</Label>
          <Input 
            id="title"
            placeholder="Enter notification title..."
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="body">Message Body</Label>
          <Textarea 
            id="body"
            placeholder="Write your message here..."
            className="min-h-[150px]"
            value={data.body}
            onChange={(e) => setData({ ...data, body: e.target.value })}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !data.title || !data.body}
          className="gap-2"
        >
          <Send className="h-4 w-4" /> Send Notification
        </Button>
      </CardFooter>
    </Card>
  );
};
