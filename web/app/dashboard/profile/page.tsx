'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [meta, setMeta] = useState<any>({ departments: [], locations: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<any[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('sp_token') || '' : '';

  useEffect(() => {
    Promise.all([api.profile.get(token), api.profile.getMeta(token)]).then(([prof, m]: any) => {
      setProfile(prof.data || {});
      setMeta(m);
      setPrefs(
        (prof.data?.transfer_preferences || [])
          .sort((a: any, b: any) => a.priority - b.priority)
          .map((p: any) => ({
            desired_location_id: p.desired_location?.id || '',
            priority: p.priority,
            reason: p.reason || '',
          }))
      );
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const selectedDept = meta.departments.find((d: any) => d.id === profile?.department_id);
  const designations = selectedDept?.designations || [];

  const locationsByState = meta.locations.reduce((acc: any, loc: any) => {
    if (!acc[loc.state_name]) acc[loc.state_name] = [];
    acc[loc.state_name].push(loc);
    return acc;
  }, {});

  async function saveProfile() {
    setSaving(true);
    try {
      await api.profile.update(token, {
        full_name:           profile.full_name,
        gender:              profile.gender,
        mobile:              profile.mobile,
        employee_number:     profile.employee_number,
        department_id:       profile.department_id,
        designation_id:      profile.designation_id,
        current_location_id: profile.current_location_id,
        current_office:      profile.current_office,
        date_of_joining:     profile.date_of_joining,
        bio:                 profile.bio,
        is_publicly_listed:  profile.is_publicly_listed,
      });

      // Save preferences
      const filled = prefs.filter(p => p.desired_location_id);
      if (filled.length > 0) {
        await api.profile.setPreferences(token, { preferences: filled });
      }

      toast.success('Profile saved successfully!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  function addPref() {
    if (prefs.length >= 3) return;
    setPrefs([...prefs, { desired_location_id: '', priority: prefs.length + 1, reason: '' }]);
  }

  function removePref(idx: number) {
    const updated = prefs.filter((_, i) => i !== idx).map((p, i) => ({ ...p, priority: i + 1 }));
    setPrefs(updated);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Keep your profile up to date for accurate matches</p>
        </div>
        <Button onClick={saveProfile} disabled={saving} className="gradient-saffron text-white border-0 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Full Name</Label>
            <Input id="p-name" value={profile?.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-gender">Gender</Label>
            <Select value={profile?.gender || ''} onValueChange={(v: string | null) => setProfile({ ...profile, gender: v ?? '' })}>
              <SelectTrigger id="p-gender"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-mobile">Mobile Number</Label>
            <Input id="p-mobile" placeholder="10-digit mobile" value={profile?.mobile || ''}
              onChange={e => setProfile({ ...profile, mobile: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-empno">Employee/Service Number (optional)</Label>
            <Input id="p-empno" placeholder="Optional" value={profile?.employee_number || ''}
              onChange={e => setProfile({ ...profile, employee_number: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-bio">Bio (optional)</Label>
            <Textarea id="p-bio" placeholder="Brief intro – visible to matches after connection" rows={2}
              value={profile?.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Service Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Service Information</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="p-dept">Department</Label>
            <Select value={profile?.department_id || ''}
              onValueChange={(v: string | null) => setProfile({ ...profile, department_id: v ?? '', designation_id: '' })}>
              <SelectTrigger id="p-dept"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {meta.departments.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desig">Designation</Label>
            <Select value={profile?.designation_id || ''}
              onValueChange={(v: string | null) => setProfile({ ...profile, designation_id: v ?? '' })}
              disabled={!profile?.department_id}>
              <SelectTrigger id="p-desig"><SelectValue placeholder="Select designation" /></SelectTrigger>
              <SelectContent>
                {designations.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-doj">Date of Joining</Label>
            <Input id="p-doj" type="date" value={profile?.date_of_joining?.split('T')[0] || ''}
              onChange={e => setProfile({ ...profile, date_of_joining: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-listed">Profile Visibility</Label>
            <Select value={profile?.is_publicly_listed ? 'true' : 'false'}
              onValueChange={(v: string | null) => setProfile({ ...profile, is_publicly_listed: v === 'true' })}>
              <SelectTrigger id="p-listed"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Publicly Listed</SelectItem>
                <SelectItem value="false">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Current Posting */}
      <Card>
        <CardHeader><CardTitle className="text-base">Current Posting</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="p-loc">Current District</Label>
            <Select value={profile?.current_location_id || ''}
              onValueChange={(v: string | null) => setProfile({ ...profile, current_location_id: v ?? '' })}>
              <SelectTrigger id="p-loc"><SelectValue placeholder="Select district" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.entries(locationsByState).map(([state, locs]: any) => (
                  <div key={state}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">{state}</div>
                    {locs.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-office">Office Name</Label>
            <Input id="p-office" placeholder="e.g. KV No.1, Jaipur" value={profile?.current_office || ''}
              onChange={e => setProfile({ ...profile, current_office: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Transfer Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Transfer Preferences</CardTitle>
            <Button variant="outline" size="sm" onClick={addPref} disabled={prefs.length >= 3} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> Add District
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add up to 3 districts where you'd like to transfer.
            </p>
          )}
          {prefs.map((pref, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={idx === 0 ? 'default' : 'secondary'}>
                  {idx === 0 ? '1st Choice' : idx === 1 ? '2nd Choice' : '3rd Choice'}
                </Badge>
                <button onClick={() => removePref(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Select value={pref.desired_location_id}
              onValueChange={(v: string | null) => {
                  const updated = [...prefs];
                  updated[idx] = { ...updated[idx], desired_location_id: v ?? '' };
                  setPrefs(updated);
                }}>

                <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {Object.entries(locationsByState).map(([state, locs]: any) => (
                    <div key={state}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">{state}</div>
                      {locs.map((l: any) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Reason (optional)" value={pref.reason}
                onChange={e => {
                  const updated = [...prefs];
                  updated[idx] = { ...updated[idx], reason: e.target.value };
                  setPrefs(updated);
                }} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={saveProfile} disabled={saving} size="lg" className="w-full gradient-saffron text-white border-0 gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save All Changes
      </Button>
    </div>
  );
}

