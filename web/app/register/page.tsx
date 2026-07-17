'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const STEPS = ['Account', 'Service Info', 'Current Posting', 'Transfer Preferences'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>({ departments: [], locations: [] });
  const [token, setToken] = useState('');

  const [account, setAccount] = useState({ email: '', password: '', confirm_password: '', full_name: '', gender: '' });
  const [service, setService] = useState({ department_id: '', designation_id: '' });
  const [posting, setPosting] = useState({ current_location_id: '', current_office: '', date_of_joining: '' });
  const [prefs, setPrefs] = useState([
    { desired_location_id: '', priority: 1, reason: '' },
    { desired_location_id: '', priority: 2, reason: '' },
    { desired_location_id: '', priority: 3, reason: '' },
  ]);

  const selectedDept = meta.departments.find((d: any) => d.id === service.department_id);
  const designations = selectedDept?.designations || [];

  useEffect(() => {
    api.profile.getMeta('').then((d: any) => setMeta(d)).catch(() => {});
  }, []);

  async function handleAccountNext(e: React.FormEvent) {
    e.preventDefault();
    if (account.password !== account.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Step 1: Register
      await api.auth.register({ email: account.email, password: account.password, full_name: account.full_name });

      // Step 2: Auto-login (only works when email confirmation is OFF in Supabase)
      let loginData: any;
      try {
        loginData = await api.auth.login({ email: account.email, password: account.password });
      } catch {
        // Email confirmation is still ON — redirect user to confirm then login
        toast.success('Account created! Check your email to confirm, then log in.');
        setTimeout(() => { window.location.href = '/login'; }, 3000);
        return;
      }

      setToken(loginData.access_token);
      localStorage.setItem('sp_token', loginData.access_token);
      localStorage.setItem('sp_refresh', loginData.refresh_token);
      localStorage.setItem('sp_user', JSON.stringify(loginData.user));

      // Load meta with token
      const metaData = await api.profile.getMeta(loginData.access_token) as any;
      setMeta(metaData);
      setStep(1);
    } catch (err: any) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        toast.error('Email already registered. Please login instead.');
      } else if (msg.includes('rate') || msg.includes('limit') || msg.includes('wait')) {
        toast.error('Too many attempts — please wait a few minutes and try again.');
      } else {
        toast.error(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleServiceNext(e: React.FormEvent) {
    e.preventDefault();
    if (!service.department_id || !service.designation_id) {
      toast.error('Please select department and designation');
      return;
    }
    setStep(2);
  }

  async function handlePostingNext(e: React.FormEvent) {
    e.preventDefault();
    if (!posting.current_location_id) {
      toast.error('Please select current posting district');
      return;
    }
    setLoading(true);
    try {
      await api.profile.update(token, {
        full_name: account.full_name,
        gender: account.gender,
        department_id: service.department_id,
        designation_id: service.designation_id,
        current_location_id: posting.current_location_id,
        current_office: posting.current_office,
        date_of_joining: posting.date_of_joining || undefined,
      });
      setStep(3);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrefsSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filled = prefs.filter(p => p.desired_location_id);
    if (filled.length === 0) {
      toast.error('Please add at least one preferred district');
      return;
    }
    setLoading(true);
    try {
      await api.profile.setPreferences(token, { preferences: filled });
      toast.success('Profile complete! Finding your matches...');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  // Group locations by state
  const locationsByState = meta.locations.reduce((acc: any, loc: any) => {
    if (!acc[loc.state_name]) acc[loc.state_name] = [];
    acc[loc.state_name].push(loc);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 gradient-hero">
      <div className="w-full max-w-lg animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🇮🇳</span>
            <span className="text-2xl font-bold">Seva <span className="text-gradient">Parivartan</span></span>
          </Link>
        </div>

        <Card className="shadow-2xl border-border/50">
          <CardHeader>
            {/* Step indicators */}
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step ? 'gradient-saffron text-white' :
                    i === step ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-8 sm:w-16 mx-1 transition-colors ${i < step ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-1.5 mb-2" />
            <CardTitle className="text-xl">{STEPS[step]}</CardTitle>
          </CardHeader>

          <CardContent>
            {/* STEP 0 — Account */}
            {step === 0 && (
              <form onSubmit={handleAccountNext} className="space-y-4" id="form-account">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input id="reg-name" placeholder="As per service record" value={account.full_name}
                    onChange={e => setAccount({ ...account, full_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email Address</Label>
                  <Input id="reg-email" type="email" placeholder="your.email@gov.in" value={account.email}
                    onChange={e => setAccount({ ...account, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-gender">Gender</Label>
                  <Select value={account.gender} onValueChange={(v: string | null) => setAccount({ ...account, gender: v ?? '' })}>
                    <SelectTrigger id="reg-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" placeholder="Min 8 characters" value={account.password}
                    onChange={e => setAccount({ ...account, password: e.target.value })} required minLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Confirm Password</Label>
                  <Input id="reg-confirm" type="password" placeholder="Repeat password" value={account.confirm_password}
                    onChange={e => setAccount({ ...account, confirm_password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full gradient-saffron text-white border-0" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </form>
            )}

            {/* STEP 1 — Service Info */}
            {step === 1 && (
              <form onSubmit={handleServiceNext} className="space-y-4" id="form-service">
                <div className="space-y-2">
                  <Label htmlFor="reg-dept">Department</Label>
                  <Select value={service.department_id} onValueChange={(v: string | null) => setService({ ...service, department_id: v ?? '', designation_id: '' })}>
                    <SelectTrigger id="reg-dept"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {meta.departments.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-desig">Designation</Label>
                  <Select value={service.designation_id} onValueChange={(v: string | null) => setService({ ...service, designation_id: v ?? '' })}
                    disabled={!service.department_id}>
                    <SelectTrigger id="reg-desig"><SelectValue placeholder="Select designation" /></SelectTrigger>
                    <SelectContent>
                      {designations.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} {d.pay_level ? `(Level ${d.pay_level})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 gradient-saffron text-white border-0">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 2 — Current Posting */}
            {step === 2 && (
              <form onSubmit={handlePostingNext} className="space-y-4" id="form-posting">
                <div className="space-y-2">
                  <Label htmlFor="reg-location">Current Posting District</Label>
                  <Select value={posting.current_location_id} onValueChange={(v: string | null) => setPosting({ ...posting, current_location_id: v ?? '' })}>
                    <SelectTrigger id="reg-location"><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      {Object.entries(locationsByState).map(([state, locs]: any) => (
                        <div key={state}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">{state}</div>
                          {locs.map((l: any) => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-office">Office Name (Optional)</Label>
                  <Input id="reg-office" placeholder="e.g. KV No.1, Jaipur" value={posting.current_office}
                    onChange={e => setPosting({ ...posting, current_office: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-doj">Date of Joining (Optional)</Label>
                  <Input id="reg-doj" type="date" value={posting.date_of_joining}
                    onChange={e => setPosting({ ...posting, date_of_joining: e.target.value })} />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 gradient-saffron text-white border-0" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3 — Transfer Preferences */}
            {step === 3 && (
              <form onSubmit={handlePrefsSubmit} className="space-y-5" id="form-prefs">
                <p className="text-sm text-muted-foreground">
                  Add up to 3 districts you&apos;d like to transfer to (in order of preference).
                </p>
                {prefs.map((pref, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={idx === 0 ? 'default' : 'secondary'}>
                        {idx === 0 ? '1st Choice' : idx === 1 ? '2nd Choice' : '3rd Choice'}
                      </Badge>
                      {idx > 0 && <span className="text-xs text-muted-foreground">(optional)</span>}
                    </div>
                    <Select
                      value={pref.desired_location_id}
                      onValueChange={(v: string | null) => {
                        const updated = [...prefs];
                        updated[idx] = { ...updated[idx], desired_location_id: v ?? '' };
                        setPrefs(updated);
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select preferred district" /></SelectTrigger>
                      <SelectContent className="max-h-64">
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
                    {pref.desired_location_id && (
                      <Input
                        placeholder="Reason (optional) – e.g. family, spouse"
                        value={pref.reason}
                        onChange={e => {
                          const updated = [...prefs];
                          updated[idx] = { ...updated[idx], reason: e.target.value };
                          setPrefs(updated);
                        }}
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 gradient-saffron text-white border-0" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Complete Registration ✓
                  </Button>
                </div>
              </form>
            )}

            {step === 0 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already registered?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

