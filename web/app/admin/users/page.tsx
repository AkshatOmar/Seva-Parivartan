'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Search, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('sp_token') || '' : '';
  const limit = 20;

  useEffect(() => {
    load();
  }, [page, search]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.admin.users(token, page, search) as any;
      setUsers(data.data || []);
      setTotal(data.count || 0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string, current: boolean) {
    try {
      await api.admin.updateUser(token, id, { is_active: !current });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !current } : u));
      toast.success(`User ${!current ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} registered employees</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="admin-search"
          placeholder="Search by name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{user.full_name}</p>
                      <Badge
                        variant={user.is_active ? 'default' : 'secondary'}
                        className={`text-xs ${user.is_active ? 'bg-green-100 text-green-700' : ''}`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {!user.is_profile_complete && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">Incomplete</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {user.designation?.name} · {user.department?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      📍 {user.current_location?.name}, {user.current_location?.state_name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle(user.id, user.is_active)}
                    className={user.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                  >
                    {user.is_active
                      ? <><ShieldOff className="w-3.5 h-3.5 mr-1" /> Deactivate</>
                      : <><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Activate</>
                    }
                  </Button>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">No users found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
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
