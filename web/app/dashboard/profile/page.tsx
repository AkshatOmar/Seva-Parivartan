'use client';

import { Suspense, useEffect, useState } from 'react';
import { api, Profile, District } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';

const DESIGNATIONS = ['PGT', 'TGT', 'PRT', 'Lecturer'] as const;

type ProfileForm = {
  full_name: string;
  mobile: string;
  designation: Profile['designation'] | '';
  current_district_id: number | '';
  desired_district_id: number | '';
};

/**
 * Inner component -- isolated so the useSearchParams() call is
 * inside a Suspense boundary (required by Next.js App Router).
 */
function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';

  const [form, setForm] = useState<ProfileForm>({
    full_name: '', mobile: '', designation: '',
    current_district_id: '', desired_district_id: '',
  });
  const [districts, setDistricts] = useState<District[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, districtRes] = await Promise.all([
          api.profile.get(),
          api.districts.list(),
        ]);
        const p = profileRes.data as Profile;
        setDistricts(districtRes.data);
        setForm({
          full_name: p.full_name || '',
          mobile: p.mobile || '',
          designation: p.designation || '',
          current_district_id: p.current_district_id ?? '',
          desired_district_id: p.desired_district_id ?? '',
        });
      } catch {
        toast.error('Could not load your profile. Please refresh.');
      } finally {
        setLoadingProfile(false);
      }
    }
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (
      form.current_district_id !== '' &&
      form.desired_district_id !== '' &&
      form.current_district_id === form.desired_district_id
    ) {
      toast.error('Your current and desired districts must be different.');
      return;
    }

    setSaving(true);
    try {
      await api.profile.update({
        full_name: form.full_name,
        mobile: form.mobile,
        designation: (form.designation || null) as Profile['designation'],
        current_district_id: form.current_district_id === '' ? null : Number(form.current_district_id),
        desired_district_id: form.desired_district_id === '' ? null : Number(form.desired_district_id),
      });
      toast.success('Profile saved');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) {
    setForm(f => ({ ...f, [field]: value }));
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome banner for first-time OAuth users */}
      {isWelcome && (
        <div className="mb-6 flex items-start gap-3 bg-accent/60 border border-accent rounded-lg px-4 py-3">
          <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Welcome to Seva Parivartan!</p>
            <p className="text-sm text-muted-foreground">
              Please complete your profile so we can find your transfer matches.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground mb-1">My profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep your details up to date so we can find accurate matches.
        </p>
      </div>

      <form onSubmit={save} className="border border-border rounded-lg bg-card p-5 sm:p-6 space-y-5 max-w-lg">

        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="prof-name">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="prof-name"
            value={form.full_name}
            onChange={e => set('full_name', e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            required
            className="h-9"
          />
        </div>

        {/* Mobile */}
        <div className="space-y-1.5">
          <Label htmlFor="prof-mobile">Mobile number</Label>
          <Input
            id="prof-mobile"
            value={form.mobile}
            onChange={e => set('mobile', e.target.value)}
            placeholder="10-digit mobile number"
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            Only shared with a matched teacher after you both accept the connection.
          </p>
        </div>

        {/* Designation */}
        <div className="space-y-1.5">
          <Label htmlFor="prof-designation">
            Designation <span className="text-destructive">*</span>
          </Label>
          <select
            id="prof-designation"
            value={form.designation ?? ''}
            onChange={e => set('designation', e.target.value as ProfileForm['designation'])}
            required
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Select designation</option>
            {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Districts */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prof-current">
              Current posting district <span className="text-destructive">*</span>
            </Label>
            <select
              id="prof-current"
              value={form.current_district_id}
              onChange={e => set('current_district_id', e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select district</option>
              {districts.filter(d => d.is_active).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-desired">
              Desired transfer district <span className="text-destructive">*</span>
            </Label>
            <select
              id="prof-desired"
              value={form.desired_district_id}
              onChange={e => set('desired_district_id', e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select district</option>
              {districts.filter(d => d.is_active).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving} className="h-9">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}