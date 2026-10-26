'use client';

import { useEffect, useState } from 'react';
import { api, Connection } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function statusVariant(s: string): StatusVariant {
  if (s === 'accepted')  return 'default';
  if (s === 'rejected')  return 'destructive';
  if (s === 'withdrawn') return 'outline';
  return 'secondary';
}

function statusLabel(s: string) {
  if (s === 'withdrawn') return 'Withdrawn';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ConnectionsPage() {
  const [conns, setConns]             = useState<Connection[]>([]);
  const [loading, setLoading]         = useState(true);
  const [myId, setMyId]               = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setMyId(session.user.id);
      await load();
    }
    init();
  }, []);

  async function load() {
    try {
      const res = await api.connections.list();
      setConns(res.data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function respond(id: string, status: 'accepted' | 'rejected') {
    setRespondingId(id);
    try {
      await api.connections.respond(id, status);
      setConns(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      toast.success(status === 'accepted' ? 'Request accepted' : 'Request rejected');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRespondingId(null);
    }
  }

  async function withdraw(id: string) {
    setWithdrawingId(id);
    try {
      await api.connections.respond(id, 'withdrawn');
      setConns(prev => prev.map(c => c.id === id ? { ...c, status: 'withdrawn' } : c));
      toast.success('Connection request withdrawn');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setWithdrawingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading connections…</span>
      </div>
    );
  }

  const received = conns.filter(c => c.target?.id === myId);
  const sent     = conns.filter(c => c.requester?.id === myId);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-foreground">Connections</h1>

      {/* ── Received ─────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Received requests · {received.length}
        </h2>

        {received.length === 0 ? (
          <EmptyState text="No requests received yet" />
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {received.map(c => (
              <div
                key={c.id}
                className="bg-card px-4 py-3.5 sm:px-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {c.requester?.full_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {c.requester?.designation}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {c.requester?.current_dist}
                      <ArrowRight className="w-3 h-3" />
                      {c.requester?.desired_dist}
                    </span>
                  </div>
                  {c.message && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">
                      &ldquo;{c.message}&rdquo;
                    </p>
                  )}
                  {/* Mobile only revealed after acceptance */}
                  {c.requester?.mobile && c.status === 'accepted' && (
                    <p className="text-xs text-foreground mt-1 font-medium">
                      📞 {c.requester.mobile}
                    </p>
                  )}
                </div>

                {c.status === 'pending' ? (
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      disabled={respondingId === c.id}
                      onClick={() => respond(c.id, 'accepted')}
                    >
                      {respondingId === c.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : 'Accept'
                      }
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={respondingId === c.id}
                      onClick={() => respond(c.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge variant={statusVariant(c.status)} className="shrink-0 capitalize">
                    {statusLabel(c.status)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Sent ─────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Sent requests · {sent.length}
        </h2>

        {sent.length === 0 ? (
          <EmptyState text="You haven't sent any requests yet" />
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
            {sent.map(c => (
              <div
                key={c.id}
                className="bg-card px-4 py-3.5 sm:px-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {c.target?.full_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {c.target?.designation}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {c.target?.current_dist}
                      <ArrowRight className="w-3 h-3" />
                      {c.target?.desired_dist}
                    </span>
                  </div>
                  {/* Mobile revealed after acceptance */}
                  {c.target?.mobile && c.status === 'accepted' && (
                    <p className="text-xs text-foreground mt-1 font-medium">
                      📞 {c.target.mobile}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusVariant(c.status)} className="capitalize">
                    {statusLabel(c.status)}
                  </Badge>
                  {/* Allow withdrawal of pending requests */}
                  {c.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={withdrawingId === c.id}
                      onClick={() => withdraw(c.id)}
                      className="text-muted-foreground text-xs h-7 px-2"
                    >
                      {withdrawingId === c.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : 'Withdraw'
                      }
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-10 px-6 text-center">
      <Inbox className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
