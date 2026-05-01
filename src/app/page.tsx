import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Mail,
  Shield,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

/* ───── Static Data ───── */

const features = [
  {
    title: 'Multi-Tier Approvals',
    description: 'Streamlined workflows with mandatory HOD and Principal review processes ensuring proper governance.',
    icon: ShieldCheck,
    color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  },
  {
    title: 'Automated Guest Invites',
    description: 'System-generated email invitations and real-time status tracking for esteemed guests.',
    icon: Mail,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  {
    title: 'Attendance Tracking',
    description: 'Effortlessly mark and monitor student attendance with detailed presence records.',
    icon: UserCheck,
    color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  },
  {
    title: 'Student Feedback',
    description: 'Built-in star ratings and comments for students to review and rate past events.',
    icon: Star,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
  {
    title: 'Automated Reporting',
    description: 'One-click generation of comprehensive post-event reports with attendance and financials.',
    icon: FileText,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  },
  {
    title: 'Centralized Dashboard',
    description: 'Role-specific views ensuring everyone has exactly the tools and information they need.',
    icon: CalendarCheck,
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  },
];

const workflowSteps = [
  { step: '01', title: 'Create Event', description: 'Host submits event proposal with all details', icon: CalendarCheck },
  { step: '02', title: 'HOD Review', description: 'Department head reviews and forwards', icon: ClipboardCheck },
  { step: '03', title: 'Principal Approval', description: 'Principal gives final approval', icon: Shield },
  { step: '04', title: 'Execute & Report', description: 'Run event, track attendance, generate report', icon: CheckCircle2 },
];

const roles = [
  { name: 'Host / Faculty', path: '/login', desc: 'Create events, manage attendance, and generate reports.', icon: Users, gradient: 'from-red-500 to-rose-600' },
  { name: 'HOD', path: '/login', desc: 'Review, reject, or approve departmental events.', icon: ShieldCheck, gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Principal', path: '/login', desc: 'Provide final approval for college-wide events.', icon: Shield, gradient: 'from-purple-500 to-violet-600' },
  { name: 'Student', path: '/login', desc: 'View upcoming events and submit feedback.', icon: GraduationCap, gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Admin', path: '/login', desc: 'Manage user access and system configurations.', icon: UserCheck, gradient: 'from-amber-500 to-orange-600' },
];

const stats = [
  { label: 'Events Managed', value: '500+' },
  { label: 'Active Students', value: '5,000+' },
  { label: 'Departments', value: '12' },
  { label: 'Faculty Members', value: '200+' },
];

/* ───── Page Component ───── */

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ===== NAVBAR ===== */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Event<span className="text-primary">Sphere</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#workflow" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="#roles" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Roles
            </Link>
          </nav>
          <Link href="/login">
            <Button size="lg" className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              Login to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/college.png"
              alt="MET College Campus"
              fill
              className="object-cover"
              priority
            />
            {/* <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40" /> */}
            <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" />
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-6 py-24 text-center text-white">
            <div className="animate-slide-up">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                MET&apos;s Institute of Technology — Event Management
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 max-w-5xl mx-auto leading-[1.1] animate-slide-up delay-100">
              Empowering Future{' '}
              <span className="relative">
                <span className="relative z-10">Engineers</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-white/20 rounded-full -z-0" />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up delay-200">
              From proposal to final report, EventSphere handles approvals, guest invitations,
              attendance, and feedback seamlessly in one unified platform.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up delay-300">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold rounded-xl bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20 transition-all">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold rounded-xl border-white/30 text-black hover:bg-white/10 transition-all">
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Floating Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto animate-slide-up delay-400">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors"
                >
                  <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/60 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURES SECTION ===== */}
        <section id="features" className="py-24 md:py-32 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                Features
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Everything you need for{' '}
                <span className="text-primary">successful events</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built specifically for educational institutions, EventSphere enforces strict approval
                workflows while simplifying the organizational burden.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <Card
                  key={i}
                  className="card-hover border-border/50 hover:border-primary/30 bg-card"
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-3`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="workflow" className="py-24 md:py-32 bg-muted/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                Workflow
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                How it <span className="text-primary">works</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A streamlined 4-step process from event creation to final report.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {workflowSteps.map((item, i) => (
                <div key={i} className="relative text-center group">
                  {/* Connector line */}
                  {i < workflowSteps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
                  )}
                  <div className="relative z-10 mx-auto w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-xs font-bold text-primary mb-1 block">STEP {item.step}</span>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== ROLES SECTION ===== */}
        <section id="roles" className="py-24 md:py-32 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                Access Control
              </span>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Tailored for <span className="text-primary">every role</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Secure, role-based access ensures everyone sees exactly what they need.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {roles.map((role, i) => (
                <Link href={role.path} key={i} className="block group">
                  <Card className="h-full card-hover border-border/50 hover:border-primary/50 overflow-hidden">
                    <div className={`h-1.5 bg-gradient-to-r ${role.gradient}`} />
                    <CardHeader className="pb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-3 shadow-md`}>
                        <role.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {role.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">{role.desc}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="gradient-dark text-white py-16">
        <div className="container mx-auto px-6">
          {/* Brand */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold">EventSphere</span>
            </div>
            <p className="text-white/50 text-sm">Elevating College Event Management</p>
          </div>

          {/* Developer Team */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20 mb-12">
            {[
              { name: 'Keshav Potewar', role: 'Developer', size: 'w-14 h-14' },
              { name: 'Aryan Chavan', role: 'Developer', size: 'w-18 h-18' },
              { name: 'Amol Sonawane', role: 'Developer', size: 'w-14 h-14' },
            ].map((dev, i) => (
              <div key={i} className="flex flex-col items-center gap-3 group">
                <div className={`${dev.size} rounded-full bg-white/10 border-2 border-white/10 group-hover:border-primary transition-colors flex items-center justify-center`}>
                  <span className="text-sm font-bold text-white/40">
                    {dev.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <span className="font-medium text-sm">{dev.name}</span>
                <span className="text-xs text-white/40">{dev.role}</span>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-white/40">
            <p>&copy; {new Date().getFullYear()} EventSphere. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
