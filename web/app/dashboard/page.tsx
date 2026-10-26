'use client';

import { useEffect, useState } from 'react';
import { api, MatchProfile, Connection } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Search, UserCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [matches, setMatches]     = useState<MatchProfile[]>([]);
  const [sent, setSent]           = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [myId, setMyId]           = useState('');

  useEffect(() => {
    async function init() {
      // Get current user id from Supabase session
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setMyId(session.user.id);
      await loadData(session?.user.id);
    }
    init();
  }, []);

  async function loadData(userId?: string) {
    try {
      const [matchRes, connRes] = await Promise.all([
        api.matches.list(),
        api.connections.list(),
      ]);
      setMatches(matchRes.data);

      // Track IDs we've already sent requests to
      const uid = userId || myId;
      const sentIds = new Set(
        (connRes.data as Connection[])
          .filter(c => c.requester?.id === uid && c.status !== 'withdrawn')
          .map(c => c.target?.id)
      );
      setSent(sentIds);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest(targetId: string) {
    setSendingId(targetId);
    try {
      await api.connections.send(targetId);
      setSent(prev => new Set(prev).add(targetId));
      toast.success('Connection request sent');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSendingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading matches…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground mb-1">Your matches</h1>
        <p className="text-sm text-muted-foreground">
          Teachers who want to transfer to your district and whose district you want — same designation.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-14 px-6 text-center">
          <Search className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">No matches found</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
            Make sure your profile has your current district, desired district, and designation filled in.
          </p>
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm">
              <UserCircle className="w-4 h-4" />
              Complete your profile
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
          {matches.map(match => {
            const alreadySent = sent.has(match.id);
            const isSending   = sendingId === match.id;

            return (
              <div
                key={match.id}
                className="bg-card px-4 py-3.5 sm:px-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-medium text-foreground text-sm truncate">
                      {match.full_name}
                    </p>
                    {match.verification_status === 'verified' && (
                      <ShieldCheck
                        className="w-3.5 h-3.5 text-primary shrink-0"
                        title="Verified teacher"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {match.designation}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {match.current_district_name}
                      <ArrowRight className="w-3 h-3" />
                      {match.desired_district_name}
                    </span>
                  </div>
                </div>

                <Button
                  variant={alreadySent ? 'secondary' : 'default'}
                  size="sm"
                  disabled={alreadySent || isSending}
                  onClick={() => sendRequest(match.id)}
                  className="shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : alreadySent ? (
                    'Requested'
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
