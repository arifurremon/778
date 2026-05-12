"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp,
  FileJson,
  Loader2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AuditLogEntry {
  id: string;
  adminId: string;
  admin: { name: string | null; email: string; profileImage: string | null };
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AuditLogViewerPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [adminSearch, setAdminSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (entityFilter !== 'all') params.append('entityType', entityFilter);
      // We can add adminSearch here, but for now we'll do client-side filtering for search

      const res = await fetch(`/api/admin/settings/audit-log?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setLogs(json.data || []);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load audit logs." });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('VERIFY')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    if (action.includes('SUSPEND')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    if (action.includes('UPDATE') || action.includes('PROMOTE')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (action.includes('TOGGLE')) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    return 'bg-muted text-muted-foreground border-border/50';
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ['Timestamp', 'Admin', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Details'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => {
        const detailsStr = JSON.stringify(log.details).replace(/"/g, '""'); // Escape quotes for CSV
        return [
          log.createdAt,
          log.admin.name || log.admin.email,
          log.action,
          log.entityType,
          log.entityId,
          log.ipAddress || 'Unknown',
          `"${detailsStr}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side filtering for the search bar
  const filteredLogs = logs.filter(log => {
    if (!adminSearch) return true;
    const searchLower = adminSearch.toLowerCase();
    return (
      (log.admin.name && log.admin.name.toLowerCase().includes(searchLower)) ||
      log.admin.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
            <History size={12} />
            Security & Compliance
          </div>
          <h1 className="text-3xl font-black tracking-tight">System Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Immutable record of all administrative actions and system events.</p>
        </div>

        <Button onClick={exportCSV} variant="outline" className="font-bold gap-2 rounded-xl border-border/50">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <Card className="border-border/50 shadow-xl shadow-black/5 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 bg-muted/10 border-b border-border/30 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search by admin name..." 
              className="pl-9 bg-background"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
          </div>
          
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="VERIFY_SHOP">Verify Shop</SelectItem>
              <SelectItem value="REJECT_SHOP">Reject Shop</SelectItem>
              <SelectItem value="DELETE_SHOP">Delete Shop</SelectItem>
              <SelectItem value="VERIFY_SERVICE">Verify Service</SelectItem>
              <SelectItem value="REJECT_SERVICE">Reject Service</SelectItem>
              <SelectItem value="UPDATE_SETTINGS">Update Settings</SelectItem>
              <SelectItem value="TOGGLE_MAINTENANCE">Toggle Maintenance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="User">User</SelectItem>
              <SelectItem value="Shop">Shop</SelectItem>
              <SelectItem value="Service">Service</SelectItem>
              <SelectItem value="Post">Post</SelectItem>
              <SelectItem value="Settings">Settings</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="ghost" className="font-bold gap-2 text-muted-foreground w-full justify-start">
            <Filter size={16} /> Advanced Filters
          </Button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-black tracking-tight">No logs found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Administrator</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className={cn("hover:bg-muted/10 transition-colors", expandedRows[log.id] && "bg-muted/5")}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold">{format(new Date(log.createdAt), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(log.createdAt), 'h:mm a')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border">
                            <AvatarImage src={log.admin.profileImage || ""} />
                            <AvatarFallback className="text-xs font-black">{log.admin.name?.[0] || 'A'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold">{log.admin.name || 'System Admin'}</p>
                            <p className="text-[10px] text-muted-foreground">{log.admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn("font-bold text-[10px] tracking-wider", getActionColor(log.action))}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-muted-foreground">{log.entityType}</span>
                          {log.entityId !== 'global' && (
                            <Link 
                              href={`/admin/${log.entityType.toLowerCase()}s/${log.entityId}`} 
                              className="text-primary hover:text-primary/80 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                          {log.entityId}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleRow(log.id)}
                          className="h-8 w-8 p-0 rounded-lg"
                        >
                          {expandedRows[log.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                      </td>
                    </tr>
                    {expandedRows[log.id] && (
                      <tr className="bg-muted/10 border-b border-border/30">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="flex gap-2">
                            <div className="mt-1 text-muted-foreground"><FileJson size={16} /></div>
                            <div className="flex-1 bg-background border border-border/50 rounded-lg p-4 overflow-x-auto">
                              <pre className="text-xs font-mono text-muted-foreground">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
