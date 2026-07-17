'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MapPin, Briefcase, Star, ArrowLeftRight, Search, RefreshCw, Send } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('sp_token') || '' : '';

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    setLoading(true);
    try {
      const data = await api.matches.list(token) as any;
      setMatches(data.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await api.matches.refresh(token);
      await loadMatches();
      toast.success('Matches refreshed!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function sendRequest() {
    if (!selected) return;
    setSending(true);
    try {
      await api.connections.send(token, { match_id: selected.id, message });
      toast.success('Connection request sent!');
      setSelected(null);
      setMessage('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  const filtered = matches.filter(m => {
    const emp = m.matched_employee;
    const term = search.toLowerCase();
    return !term ||
      emp?.full_name?.toLowerCase().includes(term) ||
      emp?.current_location?.name?.toLowerCase().includes(term) ||
      emp?.designation?.name?.toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Matches</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {matches.length} employee{matches.length !== 1 ? 's' : ''} matched for mutual transfer
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2 self-start">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Matches
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, district, designation..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
          id="match-search"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ArrowLeftRight className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {matches.length === 0 ? 'No matches yet' : 'No results found'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {matches.length === 0
              ? 'Matches appear when another employee with the same designation is posting in your desired district and wants your district.'
              : 'Try a different search term.'}
          </p>
          {matches.length === 0 && (
            <Button onClick={handleRefresh} className="mt-4 gradient-saffron text-white border-0">
              Refresh Matching Engine
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((match) => {
            const emp = match.matched_employee;
            const desires = emp?.transfer_preferences?.[0]?.desired_location;
            return (
              <Card key={match.id} className="card-hover cursor-pointer border-border/50"
                onClick={() => setSelected(match)}>
                <CardContent className="pt-5 pb-5">
                  {/* Score badge */}
                  <div className="flex items-start justify-between mb-4">
                    <Badge
                      className={match.match_score >= 150
                        ? 'bg-amber-500 text-white'
                        : 'bg-primary text-primary-foreground'}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {match.match_score >= 150 ? 'Perfect Match' : `Score: ${match.match_score}`}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {match.status}
                    </Badge>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-lg mb-1">{emp?.full_name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{emp?.department?.name}</p>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Designation:</span>
                      <span className="font-medium truncate">{emp?.designation?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">Currently at:</span>
                      <span className="font-medium">
                        {emp?.current_location?.name}, {emp?.current_location?.state_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">Wants:</span>
                      <span className="font-medium">
                        {desires?.name || '—'}, {desires?.state_name || ''}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-5 gradient-saffron text-white border-0"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setSelected(match); }}
                  >
                    <Send className="w-3.5 h-3.5 mr-2" /> Connect
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Connect Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Connection Request</DialogTitle>
            <DialogDescription>
              Send a connection request to {selected?.matched_employee?.full_name}. Your contact details will only be shared after they accept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{selected?.matched_employee?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Designation</span>
                <span className="font-medium">{selected?.matched_employee?.designation?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current District</span>
                <span className="font-medium">{selected?.matched_employee?.current_location?.name}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="connect-message">Introduction Message (Optional)</Label>
              <Textarea
                id="connect-message"
                placeholder="Hi, I saw your profile and we seem to be a good mutual transfer match. Let's connect!"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelected(null)} className="flex-1">Cancel</Button>
              <Button
                className="flex-1 gradient-saffron text-white border-0"
                onClick={sendRequest}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
