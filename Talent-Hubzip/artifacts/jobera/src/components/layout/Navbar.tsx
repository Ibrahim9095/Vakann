import { Link, useLocation } from "wouter"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, LogIn, LayoutDashboard, ShieldAlert } from "lucide-react"
import { useInterviewCounter } from "@/hooks/useInterviewCounter"

export function Navbar() {
  const { user, logout } = useAuth()
  const [, setLocation] = useLocation()
  const { value: interviewChances } = useInterviewCounter()

  const dashboardHref =
    user?.role === 'admin' ? '/dashboard/admin' :
    user?.role === 'candidate' ? '/dashboard/candidate' :
    '/dashboard/hr'

  const dashboardLabel =
    user?.role === 'admin' ? 'Admin Paneli' :
    user?.role === 'candidate' ? 'Namizəd Paneli' :
    'HR Paneli'

  const roleBadge =
    user?.role === 'admin' ? 'Admin' :
    user?.role === 'candidate' ? 'Namizəd' : 'HR'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
            <span className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Briefcase className="w-5 h-5" />
            </span>
            Jobera.az
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/jobs" className="text-foreground/80 hover:text-foreground transition-colors">Vakansiyalar</Link>
            <Link href="/candidates" className="text-foreground/80 hover:text-foreground transition-colors">Namizədlər</Link>
            <Link href="/companies" className="text-foreground/80 hover:text-foreground transition-colors">Şirkətlər</Link>
          </nav>
          <div className="hidden lg:flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Jobera ilə müsahibə şansı qazanlar: <span className="font-bold tabular-nums">{interviewChances}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Badge variant="secondary" className="hidden sm:inline-flex">{roleBadge}</Badge>
              <Link href={dashboardHref}>
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                  {user.role === 'admin'
                    ? <ShieldAlert className="w-4 h-4 text-primary" />
                    : <LayoutDashboard className="w-4 h-4" />}
                  {dashboardLabel}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => { logout(); setLocation("/"); }}>
                Çıxış
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Daxil ol
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Qeydiyyat</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
