'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeftRight, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const statusColor: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  connected: 'bg-blue-100 text-blue-700',
  expired:   'bg-red-100 text-red-700',
  completed: 'bg-violet-100 text-violet-700',
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('sp_token') || '' : '';
  const limit = 20;

  useEffect(() => { load(); }, [page]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.admin.matches(token, page) as any;
      setMatches(data.data || []);
      setTotal(data.count || 0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function runMatching() {
    setRunning(true);
    try {
      const res = await api.admin.runMatching(token) as any;
      toast.success(`Matching complete – ${res.affected} pairs processed`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Matches</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} total match pairs</p>
        </div>
        <Button onClick={runMatching} disabled={running} className="gradient-saffron text-white border-0 gap-2">
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          Run Matching
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {matches.map(match => (
                <div key={match.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0 grid sm:grid-cols-3 gap-2 items-center">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{match.employee_a?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{match.employee_a?.designation?.name}</p>
                    </div>
                    <div className="flex justify-center">
                      <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{match.employee_b?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{match.employee_b?.designation?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">{match.match_score}pts</Badge>
                    <Badge className={`text-xs ${statusColor[match.status] || ''}`}>{match.status}</Badge>
                  </div>
                </div>
              ))}
              {matches.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">No matches found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
