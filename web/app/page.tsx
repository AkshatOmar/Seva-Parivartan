'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Users, Shield, MapPin,
  CheckCircle, ArrowLeftRight
} from 'lucide-react';

const steps = [
  {
    num: '1',
    title: 'Sign In & Build Profile',
    desc: 'Sign in with Google. Add your designation, current posting district, and where you wish to transfer.',
  },
  {
    num: '2',
    title: 'Get Instant Matches',
    desc: 'Our algorithm finds teachers in your desired district who want to come to yours — same designation.',
  },
  {
    num: '3',
    title: 'Connect & Apply Together',
    desc: 'Send a connection request, exchange details, and apply for mutual transfer through official channels.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── NAV ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground">
              Seva Parivartan
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Register</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="pt-16 sm:pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1 rounded-md text-xs font-medium mb-6">
            For Central Government Employees
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] mb-5 text-foreground">
            Find your mutual transfer match
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Connect with government employees who want to swap districts.
            Same department, same designation — apply together for an instant mutual transfer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="px-6 gap-2">
                Get started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="px-6">
                How it works
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────── */}
        <div className="max-w-2xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border">
          {[
            { value: '4', label: 'Post types' },
            { value: '75+', label: 'Districts' },
            { value: '2-Way', label: 'Matching' },
            { value: 'Free', label: 'Always' },
          ].map((s) => (
            <div key={s.label} className="bg-card text-center py-5 px-3">
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>



      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">How it works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Three steps from registration to finding your transfer match.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="border border-border rounded-lg p-5 bg-card">
                <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 bg-muted/40 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">Why Seva Parivartan</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: ArrowLeftRight, title: 'Instant Matching',      desc: 'Algorithm finds your 2-way match the moment you save your profile — no manual searching.' },
              { icon: Shield,        title: 'Privacy First',         desc: 'Mobile numbers are revealed only after both parties accept the connection.' },
              { icon: Users,         title: 'Same Designation Only', desc: 'Matches PGT with PGT, TGT with TGT — so your mutual transfer application is valid.' },
              { icon: MapPin,        title: 'All UP Districts',      desc: 'All 75 Uttar Pradesh districts are covered, with more states coming soon.' },
              { icon: CheckCircle,   title: 'Free Forever',          desc: 'No subscription, no premium tier. A service for teachers, not a business.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border border-border rounded-lg p-5 bg-card">
                <Icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">Ready to find your match?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join central government employees already using Seva Parivartan to find their mutual transfer partner.
          </p>
          <Link href="/register">
            <Button size="lg" className="px-8">
              Register now — it&apos;s free
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <ArrowLeftRight className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">Seva Parivartan</span>
            <span className="hidden sm:inline">· Mutual transfer matching for central government employees</span>
          </div>
          <div className="flex gap-4">
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
