'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Users, ArrowLeftRight, Link2, Building2, RefreshCw, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('sp_token') || '' : '';

  useEffect(() => {
    api.admin.stats(token).then((d: any) => setStats(d)).catch(console.error);
  }, []);

  async function runMatching() {
    setRunning(true);
    try {
      const res = await api.admin.runMatching(token) as any;
      toast.success(`Matching complete – ${res.affected} pairs processed`);
      const fresh = await api.admin.stats(token) as any;
      setStats(fresh);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  }

  const cards = [
    { label: 'Total Employees', value: stats?.employees?.total,    sub: `${stats?.employees?.active || 0} active`, icon: Users,          color: 'text-blue-500',  bg: 'bg-blue-500/10' },
    { label: 'Active Matches',  value: stats?.matches?.active,     sub: `${stats?.matches?.total || 0} total`,   icon: ArrowLeftRight,  color: 'text-primary',   bg: 'bg-primary/10' },
    { label: 'Connected Pairs', value: stats?.matches?.connected,  sub: 'mutual transfer initiated',             icon: Link2,           color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Departments',     value: stats?.departments,         sub: 'registered departments',                icon: Building2,       color: 'text-violet-500',bg: 'bg-violet-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform-wide overview</p>
        </div>
        <Button onClick={runMatching} disabled={running} className="gradient-saffron text-white border-0 gap-2">
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          Run Matching Engine
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connection stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Requests',  value: stats?.connections?.pending,  color: 'text-amber-600' },
          { label: 'Accepted Requests', value: stats?.connections?.accepted, color: 'text-green-600' },
          { label: 'Complete Profiles', value: stats?.employees?.complete,   color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
