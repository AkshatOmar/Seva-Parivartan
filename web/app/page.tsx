'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight, Users, Zap, Shield, MapPin,
  CheckCircle, Building2, BookOpen, Stethoscope,
  IndianRupee, Mail
} from 'lucide-react';

const departments = [
  { icon: BookOpen,     label: 'Education (KVS/NVS)',         color: 'text-amber-500' },
  { icon: Mail,         label: 'India Post',                   color: 'text-blue-500' },
  { icon: Shield,       label: 'Central Police (CRPF/BSF)',    color: 'text-green-500' },
  { icon: IndianRupee,  label: 'Income Tax / Revenue',         color: 'text-purple-500' },
  { icon: Stethoscope,  label: 'Health (CGHS)',                color: 'text-red-500' },
];

const steps = [
  {
    step: '01',
    title: 'Register & Build Profile',
    desc: 'Sign up with your email. Add your department, designation, current posting district, and where you wish to transfer.',
  },
  {
    step: '02',
    title: 'Get Instant Matches',
    desc: 'Our algorithm instantly finds employees in your desired district who want to come to your district — same post, same department.',
  },
  {
    step: '03',
    title: 'Connect & Apply Together',
    desc: 'Send a connection request, chat in-app, and apply for mutual transfer simultaneously through your department — no years of waiting.',
  },
];

const stats = [
  { value: '5',    label: 'Departments' },
  { value: '750+', label: 'Districts Covered' },
  { value: '2-Way', label: 'Smart Matching' },
  { value: 'Free', label: 'Always Free' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── NAV ───────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🇮🇳</span>
            <span className="font-bold text-xl tracking-tight">
              Seva <span className="text-gradient">Parivartan</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gradient-saffron text-white border-0 shadow-md">
                Register Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 gradient-hero -z-10" />
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-brand-green/10 blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <Badge className="mb-6 bg-accent text-accent-foreground px-4 py-1.5 text-sm font-medium">
            🚀 For Central Government Employees
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6 dark:text-white">
            Find Your Perfect{' '}
            <span className="text-gradient">Mutual Transfer</span>{' '}
            Match
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Seva Parivartan connects central govt employees who want to swap districts.
            No more years of waiting — find your match in minutes and apply together.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gradient-saffron text-white border-0 shadow-xl px-8 gap-2 text-base">
                Find My Match <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="px-8 text-base">
                How It Works
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────────── */}
        <div className="max-w-3xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="text-center border-border/50 card-hover">
              <CardContent className="pt-6 pb-4">
                <div className="text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── DEPARTMENTS ───────────────────────────────────── */}
      <section className="py-16 px-4 bg-muted/40">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Supported Departments</h2>
          <p className="text-muted-foreground mb-10">More departments being added regularly</p>
          <div className="flex flex-wrap justify-center gap-3">
            {departments.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-background border border-border rounded-full px-4 py-2 shadow-sm card-hover"
              >
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How Seva Parivartan Works</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Three simple steps from registration to finding your match
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div
                key={s.step}
                className="relative p-6 rounded-2xl bg-card border border-border shadow-sm card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-5xl font-black text-primary/10 mb-4 select-none">{s.step}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Seva Parivartan?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap,      title: 'Instant Matching',      desc: 'Algorithm runs the moment you save your profile. No delay, no waiting for manual search.' },
              { icon: Shield,   title: 'Privacy First',         desc: 'Contact details only revealed after mutual connection. Your mobile number stays private.' },
              { icon: Users,    title: 'Same Designation Only', desc: 'We only match employees of the exact same designation and department for a valid mutual transfer.' },
              { icon: MapPin,   title: 'All 750+ Districts',    desc: 'Complete coverage across all Indian states and union territories.' },
              { icon: CheckCircle, title: 'Free Forever',       desc: 'No subscription, no premium tier. This is a service for government employees, not a business.' },
              { icon: Building2,  title: 'Admin Verified',      desc: 'Department admins can manage and oversee employees within their department.' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6 border-border/50 card-hover">
                <CardContent className="p-0">
                  <div className="w-10 h-10 rounded-xl gradient-saffron flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-10 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 gradient-brand opacity-90" />
            <div className="relative z-10 text-white">
              <h2 className="text-4xl font-bold mb-4">Ready to find your match?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of central government employees who are already using Seva Parivartan to find their mutual transfer match.
              </p>
              <Link href="/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-10 py-6 text-base shadow-xl">
                  Register Now — It&apos;s Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇮🇳</span>
            <span className="font-semibold text-foreground">Seva Parivartan</span>
            <span>· Made with ❤️ for Central Govt Employees</span>
          </div>
          <div className="flex gap-6">
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="/login"        className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/register"     className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
