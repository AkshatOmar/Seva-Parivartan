'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ArrowRight, Users, ArrowLeftRight, MessageSquare, CheckCircle, Clock, Star } from 'lucide-react';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [connCount, setConnCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sp_token') || '';
    Promise.all([
      api.profile.get(token),
      api.matches.list(token),
      api.connections.list(token),
    ]).then(([prof, matches, conns]: any) => {
      setProfile(prof.data);
      setMatchCount(matches.count || 0);
      setConnCount((conns.data || []).filter((c: any) => c.status === 'accepted').length);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const profileFields = ['full_name', 'department_id', 'designation_id', 'current_location_id'];
  const completedFields = profileFields.filter(f => profile?.[f]);
  const hasPrefs = (profile?.transfer_preferences?.length || 0) > 0;
  const profileScore = Math.round(
    ((completedFields.length / profileFields.length) * 0.7 + (hasPrefs ? 0.3 : 0)) * 100
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Employee'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your transfer matching overview</p>
      </div>

      {/* Profile completeness */}
      {profileScore < 100 && (
        <Card className="border-primary/30 bg-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm mb-2">Complete your profile to get matches</p>
                <Progress value={profileScore} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">{profileScore}% complete</p>
              </div>
              <Link href="/dashboard/profile">
                <Button size="sm" className="gradient-saffron text-white border-0 whitespace-nowrap">
                  Complete Profile <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ArrowLeftRight, label: 'Total Matches', value: matchCount, color: 'text-primary', link: '/dashboard/matches' },
          { icon: Users,          label: 'Connected',    value: connCount,  color: 'text-green-500', link: '/dashboard/connections' },
          { icon: Star,           label: 'Profile Score', value: `${profileScore}%`, color: 'text-amber-500', link: '/dashboard/profile' },
          { icon: MessageSquare,  label: 'Conversations', value: '—',       color: 'text-blue-500', link: '/dashboard/messages' },
        ].map(({ icon: Icon, label, value, color, link }) => (
          <Link href={link} key={label}>
            <Card className="card-hover cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                  </div>
                  <div className={`p-2 rounded-xl bg-muted`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Current Posting & Preferences */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Current Posting</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{profile?.department?.name || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Designation</span>
              <span className="font-medium">{profile?.designation?.name || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">District</span>
              <span className="font-medium">
                {profile?.current_location
                  ? `${profile.current_location.name}, ${profile.current_location.state_name}`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Office</span>
              <span className="font-medium text-right">{profile?.current_office || '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transfer Preferences</CardTitle>
              <Link href="/dashboard/profile">
                <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(profile?.transfer_preferences || []).length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No preferences set yet</p>
                <Link href="/dashboard/profile">
                  <Button variant="link" size="sm" className="mt-1 text-primary">
                    Add preferences
                  </Button>
                </Link>
              </div>
            ) : (
              profile.transfer_preferences
                .sort((a: any, b: any) => a.priority - b.priority)
                .map((pref: any) => (
                  <div key={pref.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                    <Badge variant={pref.priority === 1 ? 'default' : 'secondary'} className="text-xs w-16 justify-center">
                      #{pref.priority} Choice
                    </Badge>
                    <span className="text-sm font-medium">
                      {pref.desired_location?.name}, {pref.desired_location?.state_name}
                    </span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link href="/dashboard/matches">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeftRight className="w-4 h-4 text-primary" /> View All Matches
              </Button>
            </Link>
            <Link href="/dashboard/connections">
              <Button variant="outline" className="w-full gap-2">
                <Users className="w-4 h-4 text-green-500" /> Manage Connections
              </Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button variant="outline" className="w-full gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500" /> Update Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
