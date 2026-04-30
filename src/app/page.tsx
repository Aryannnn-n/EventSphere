import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, FileText, Mail, ShieldCheck, UserCheck, Users } from 'lucide-react';
import Link from 'next/link';

// Features Data
const features = [
  {
    title: 'Multi-Tier Approvals',
    description: 'Streamlined workflows with mandatory HOD and Principal review processes.',
    icon: ShieldCheck,
  },
  {
    title: 'Automated Guest Invites',
    description: 'System-generated email invitations and status tracking for esteemed guests.',
    icon: Mail,
  },
  {
    title: 'Attendance Tracking',
    description: 'Effortlessly mark student attendance to ensure accurate record keeping.',
    icon: UserCheck,
  },
  {
    title: 'Student Feedback',
    description: 'Built-in feedback mechanisms for students to rate and review past events.',
    icon: Users,
  },
  {
    title: 'Automated Reporting',
    description: 'One-click generation of comprehensive post-event reports and financials.',
    icon: FileText,
  },
  {
    title: 'Centralized Dashboard',
    description: 'Role-specific views ensuring everyone has exactly the tools they need.',
    icon: CalendarCheck,
  },
];

// Roles Data
const roles = [
  { name: 'Host / Faculty', path: '/host', desc: 'Create events, manage attendance, and generate reports.' },
  { name: 'HOD', path: '/hod', desc: 'Review, reject, or approve departmental events.' },
  { name: 'Principal', path: '/principal', desc: 'Provide final approval for college-wide events.' },
  { name: 'Student', path: '/student', desc: 'View upcoming schedules and submit event feedback.' },
  { name: 'Admin', path: '/admin', desc: 'Manage user access and system configurations.' },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar (Simple) */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">EventSphere</span>
          </div>
          <nav>
            <Link href="/login">
              <Button>Login to Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5 px-3 py-1 text-sm rounded-full">
              MET College Event Management
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto text-balance">
              Streamline College Events with <span className="text-primary">Precision</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
              From proposal to final report, EventSphere handles approvals, guest invitations, attendance, and feedback seamlessly in one unified platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg font-semibold shadow-lg shadow-primary/20">
                  Get Started
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-lg font-semibold">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white dark:bg-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to run successful events</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built specifically for educational institutions, EventSphere enforces strict approval workflows while simplifying the organizational burden.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <Card key={i} className="border-border/50 hover:border-primary/50 transition-colors bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Role-Based Access Section */}
        <section className="py-24 bg-zinc-50 dark:bg-zinc-950 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Tailored for Every Role</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Secure, role-based access ensures that everyone sees exactly what they need—and nothing they don't.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {roles.map((role, i) => (
                <Link href={role.path} key={i} className="block group">
                  <Card className="h-full border-border/50 hover:border-primary transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
                    <CardHeader>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{role.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{role.desc}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-black border-t py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h3 className="text-xl font-bold tracking-tight text-primary mb-2">EventSphere</h3>
            <p className="text-muted-foreground text-sm">Elevating College Event Management</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 mb-12">
            {/* Left Developer */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border-2 border-transparent hover:border-primary transition-colors cursor-pointer">
                {/* Blank circle for now as requested */}
              </div>
              <span className="font-medium">Keshav Potewar</span>
              <span className="text-xs text-muted-foreground">Developer</span>
            </div>

            {/* Center Developer */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border-2 border-transparent hover:border-primary transition-colors cursor-pointer">
                {/* Blank circle for now as requested */}
              </div>
              <span className="font-bold text-lg">Aryan Chavan</span>
              <span className="text-xs text-muted-foreground">Developer</span>
            </div>

            {/* Right Developer */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border-2 border-transparent hover:border-primary transition-colors cursor-pointer">
                {/* Blank circle for now as requested */}
              </div>
              <span className="font-medium">Amol Sonawane</span>
              <span className="text-xs text-muted-foreground">Developer</span>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} EventSphere. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple Badge Component if missing, we will inline it since we aren't importing it from ui/badge in the original
function Badge({ children, className, variant = 'default' }: { children: React.ReactNode, className?: string, variant?: 'default' | 'outline' }) {
  return (
    <span className={`inline-flex items-center border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
