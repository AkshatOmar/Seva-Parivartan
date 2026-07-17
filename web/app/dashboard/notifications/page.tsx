'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Bell, ArrowLeftRight, Users, MessageSquare, Info, CheckCheck } from 'lucide-react';

const typeIcon: Record<string, any> = {
  new_match:          { icon: ArrowLeftRight, color: 'text-primary',   bg: 'bg-primary/10' },
  connection_request: { icon: Users,          color: 'text-blue-500',  bg: 'bg-blue-500/10' },
  request_accepted:   { icon: Users,          color: 'text-green-500', bg: 'bg-green-500/10' },
  request_rejected:   { icon: Users,          color: 'text-red-500',   bg: 'bg-red-500/10' },
  new_message:        { icon: MessageSquare,  color: 'text-violet-500',bg: 'bg-violet-500/10' },
  match_expired:      { icon: Info,           color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications(data || []);
      setLoading(false);

      // Realtime subscription
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
    load();
  }, []);

  async function markAllRead() {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
          <p className="text-muted-foreground text-sm">
            You&apos;ll be notified about new matches, connection requests, and messages.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = typeIcon[notif.type] || { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted' };
            const Icon = config.icon;
            return (
              <Card
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`cursor-pointer card-hover border-border/50 ${!notif.is_read ? 'border-primary/30 bg-accent/10' : ''}`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notif.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5 animate-pulse-ring" />
                        )}
                      </div>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {new Date(notif.created_at).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
