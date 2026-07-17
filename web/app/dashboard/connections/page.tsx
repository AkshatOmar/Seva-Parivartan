'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Check, X, Clock, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const statusColor: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
  accepted: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  withdrawn: 'bg-muted text-muted-foreground',
};

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('sp_token') || '' : '';

  useEffect(() => {
    Promise.all([
      api.connections.list(token),
      api.profile.get(token),
    ]).then(([conns, prof]: any) => {
      setConnections(conns.data || []);
      setMyId(prof.data?.id || '');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function respond(id: string, status: 'accepted' | 'rejected' | 'withdrawn') {
    try {
      await api.connections.respond(token, id, status);
      setConnections(prev => prev.map(c =>
        c.id === id ? { ...c, status } : c
      ));
      toast.success(`Request ${status}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const received = connections.filter(c => c.receiver?.id !== myId ? false : true);
  const sent     = connections.filter(c => c.sender?.id === myId);

  function ConnectionCard({ conn, isSent }: { conn: any; isSent: boolean }) {
    const other = isSent ? conn.receiver : conn.sender;
    return (
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold truncate">{other?.full_name}</h3>
                <Badge className={`text-xs border ${statusColor[conn.status] || ''}`}>
                  {conn.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {other?.designation?.name} · {other?.department?.name}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                📍 {other?.current_location?.name}, {other?.current_location?.state_name}
              </p>
              {conn.message && (
                <p className="text-sm mt-2 italic text-muted-foreground border-l-2 border-border pl-3">
                  &ldquo;{conn.message}&rdquo;
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                <Clock className="inline w-3 h-3 mr-1" />
                {new Date(conn.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {conn.status === 'pending' && !isSent && (
                <>
                  <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => respond(conn.id, 'accepted')}>
                    <Check className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => respond(conn.id, 'rejected')}>
                    <X className="w-3.5 h-3.5" /> Decline
                  </Button>
                </>
              )}
              {conn.status === 'pending' && isSent && (
                <Button size="sm" variant="outline"
                  onClick={() => respond(conn.id, 'withdrawn')}>
                  Withdraw
                </Button>
              )}
              {conn.status === 'accepted' && (
                <Link href="/dashboard/messages">
                  <Button size="sm" className="gradient-saffron text-white border-0 gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connections</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your connection requests</p>
      </div>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received" id="tab-received">
            Received
            {received.filter(c => c.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground text-xs h-5 w-5 p-0 flex items-center justify-center">
                {received.filter(c => c.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" id="tab-sent">Sent ({sent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4 mt-4">
          {received.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No requests received yet</p>
            </div>
          ) : (
            received.map(c => <ConnectionCard key={c.id} conn={c} isSent={false} />)
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-4">
          {sent.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">
                You haven&apos;t sent any requests yet.{' '}
                <Link href="/dashboard/matches" className="text-primary hover:underline">Browse matches</Link>.
              </p>
            </div>
          ) : (
            sent.map(c => <ConnectionCard key={c.id} conn={c} isSent={true} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
