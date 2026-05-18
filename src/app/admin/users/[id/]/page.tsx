"use client";

import { ConfirmationDialog } from '@/components/admin/actions/ConfirmationDialog';
import { NotificationComposer } from '@/components/admin/actions/NotificationComposer';
import { ActivityTimeline } from '@/components/admin/display/ActivityTimeline';
import { StatusBadge } from '@/components/admin/display/StatusBadge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    AlertTriangle,
    Ban,
    Briefcase,
    CheckCircle,
    ChevronRight,
    Clock,
    FileText,
    Loader2,
    Mail,
    ShieldCheck,
    Store,
    Trash2,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  profileImage: string | null;
  isAdmin: boolean;
  isSeller: boolean;
  isServiceProvider: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  suspendedAt: Date | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  suspensionReason: string | null;
  posts: Array<{ id: string; content: string; createdAt: Date }>;
  shops: Array<{ id: string; name: string; createdAt: Date }>;
  _count: { posts: number; shops: number; services: number };
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  adminName: string;
}

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Dialog States
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminConfirmText, setAdminConfirmText] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [userRes, auditRes] = await Promise.all([
        fetch(`/api/admin/users/${id}`),
        fetch(`/api/admin/users/${id}/audit`)
      ]);

      if (!userRes.ok) throw new Error("User not found");
      const userData = await userRes.json();
      setUser(userData);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load user details." });
      router.push('/admin/users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAction = async (action: string, method: string = 'PATCH', body: Record<string, unknown> = {}) => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();
      
      toast({ title: "Success", description: `User ${action} updated successfully.` });
      
      if (action === 'delete') {
        router.push('/admin/users');
      } else {
        fetchData();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `Failed to ${action} user.` });
    } finally {
      setActionLoading(null);
      setShowDeleteDialog(false);
      setShowSuspendDialog(false);
      setShowAdminDialog(false);
      setAdminConfirmText("");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const roleBadges = [];
  if (user.isAdmin) roleBadges.push({ label: "Admin", color: "bg-red-500/10 text-red-600 border-red-500/20" });
  if (user.isSeller) roleBadges.push({ label: "Seller", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" });
  if (user.isServiceProvider) roleBadges.push({ label: "Provider", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
        <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
        <ChevronRight size={12} />
        <Link href="/admin/users" className="hover:text-primary transition-colors">Users</Link>
        <ChevronRight size={12} />
        <span className="text-foreground">{user.name || user.email}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users"><Users size={20} /></Link>
          </Button>
          <h1 className="text-3xl font-black tracking-tight">{user.name || 'User Detail'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={user.suspendedAt ? 'suspended' : user.emailVerified ? 'active' : 'pending'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Profile */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={user.profileImage || ''} />
                  <AvatarFallback className="text-xl font-bold uppercase">{user.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">{user.name || 'Anonymous'}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium"><Mail size={14} /> {user.email}</span>
                    <span className="font-medium text-primary">@{user.username || 'user'}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {roleBadges.map((r, i) => (
                      <Badge key={i} variant="outline" className={cn("text-[10px] font-bold px-2 py-0", r.color)}>{r.label}</Badge>
                    ))}
                    {roleBadges.length === 0 && (
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 bg-muted text-muted-foreground">Standard User</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/50 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">Location</span>
                  <p className="font-medium">{user.location || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">Phone</span>
                  <p className="font-medium">{user.phone || 'Not set'}</p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <span className="text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">Bio</span>
                  <p className="font-medium text-muted-foreground italic leading-relaxed">{user.bio || 'No bio provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <FileText className="h-5 w-5 text-primary mb-2" />
                <span className="text-2xl font-black">{user._count.posts}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Posts</span>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/10">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Store className="h-5 w-5 text-blue-500 mb-2" />
                <span className="text-2xl font-black">{user._count.shops}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Shops</span>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/5 border-purple-500/10">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Briefcase className="h-5 w-5 text-purple-500 mb-2" />
                <span className="text-2xl font-black">{user._count.services}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Services</span>
              </CardContent>
            </Card>
          </div>

          {/* Card 3: Recent Activity */}
          <Card>
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {user.posts.length > 0 ? (
                <ActivityTimeline items={user.posts.slice(0, 10).map(p => ({
                  title: "Posted content",
                  description: p.content,
                  timestamp: format(new Date(p.createdAt), 'MMM dd, yyyy HH:mm'),
                  type: 'info',
                  icon: <FileText className="h-4 w-4" />
                }))} />
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm italic">No recent activity recorded.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Card 4: Account Actions */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold">Email Verified</span>
                    <span className="text-[10px] text-muted-foreground">{user.emailVerified ? 'Verified on ' + format(new Date(user.emailVerified), 'PP') : 'Pending'}</span>
                  </div>
                  {!user.emailVerified && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8" 
                      onClick={() => handleAction('verifyEmail')}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === 'verifyEmail' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                      Verify
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Seller Status</span>
                  <Switch 
                    checked={user.isSeller} 
                    onCheckedChange={(v) => handleAction('isSeller', 'PATCH', { isSeller: v })}
                    disabled={!!actionLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Service Provider</span>
                  <Switch 
                    checked={user.isServiceProvider} 
                    onCheckedChange={(v) => handleAction('isServiceProvider', 'PATCH', { isServiceProvider: v })}
                    disabled={!!actionLoading}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-3">
                <Button 
                  className="w-full justify-start font-bold h-9" 
                  variant="outline"
                  onClick={() => setShowAdminDialog(true)}
                  disabled={user.isAdmin || !!actionLoading}
                >
                  <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                  {user.isAdmin ? 'Already Admin' : 'Grant Admin Privileges'}
                </Button>
                
                <Button 
                  className="w-full justify-start font-bold h-9 text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                  variant="outline"
                  onClick={() => setShowSuspendDialog(true)}
                  disabled={!!actionLoading}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  {user.suspendedAt ? 'Lift Suspension' : 'Suspend Account'}
                </Button>

                <Button 
                  className="w-full justify-start font-bold h-9" 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={!!actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Send Notification */}
          <NotificationComposer 
            recipientName={user.name || user.email}
            recipientId={user.id}
            onSend={(data) => handleAction('notify', 'POST', data)}
            isLoading={actionLoading === 'notify'}
          />

          {/* Card 6: Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Admin Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {auditLogs.length > 0 ? auditLogs.map((log) => (
                  <div key={log.id} className="p-4 space-y-1 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-primary">{log.action}</span>
                      <span className="text-muted-foreground">{format(new Date(log.createdAt), 'PPp')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{log.details}</p>
                    <p className="text-[9px] text-muted-foreground/60 italic mt-1">— By Admin: {log.adminName}</p>
                  </div>
                )) : (
                  <div className="p-8 text-center text-xs text-muted-foreground italic">No administrative actions recorded.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmationDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => handleAction('delete', 'DELETE')}
        title="Delete User Permanently?"
        description="This will permanently delete this user account and all associated data. This action is irreversible."
      />

      <ConfirmationDialog 
        open={showSuspendDialog}
        onOpenChange={setShowSuspendDialog}
        onConfirm={() => handleAction(user.suspendedAt ? 'unsuspend' : 'suspend', 'PATCH', { suspended: !user.suspendedAt })}
        title={user.suspendedAt ? "Lift Suspension?" : "Suspend Account?"}
        description={user.suspendedAt ? "The user will regain access to the platform immediately." : "The user will be immediately logged out and unable to access the platform until the suspension is lifted."}
      />

      <AlertDialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Critical: Grant Admin Role
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>You are about to grant administrative privileges to this user. This allows them to access all data, manage other users, and modify system settings.</p>
              <div className="space-y-2 p-3 bg-muted rounded-lg border border-border">
                <Label className="text-xs font-bold uppercase tracking-wider">Type <span className="text-red-600 font-black">CONFIRM</span> to continue</Label>
                <Input 
                  placeholder="Type CONFIRM here..." 
                  value={adminConfirmText} 
                  onChange={(e) => setAdminConfirmText(e.target.value)}
                  className="h-8 bg-background"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminConfirmText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleAction('makeAdmin', 'PATCH', { isAdmin: true })}
              disabled={adminConfirmText !== 'CONFIRM'}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm Elevation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
