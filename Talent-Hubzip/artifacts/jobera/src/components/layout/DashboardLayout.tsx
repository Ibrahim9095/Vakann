import { Link, useLocation } from "wouter"
import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  Star, 
  MessageSquare,
  FileText,
  ShieldAlert,
  Building2,
  UserCog,
  Bell,
  Menu
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardBreadcrumb, isNavLinkActive } from "./DashboardBreadcrumb"

export function DashboardLayout({
  children,
  requiredRole,
  basePath,
}: {
  children: React.ReactNode
  requiredRole?: string
  basePath: string
}) {
  const { user, isLoading } = useAuth()
  const [location, setLocation] = useLocation()

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth/login")
    } else if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      const dest = user.role === 'admin' ? '/dashboard/admin' : user.role === 'hr' ? '/dashboard/hr' : '/dashboard/candidate'
      setLocation(dest)
    }
  }, [user, isLoading, requiredRole, setLocation])

  useEffect(() => {
    if (location === `${basePath}/`) {
      setLocation(basePath)
    }
  }, [location, basePath, setLocation])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-muted/30">
        <aside className="hidden w-64 border-r bg-card md:flex flex-col gap-2 p-4">
          <Skeleton className="h-8 w-full mb-2" />
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}
        </aside>
        <main className="flex-1 p-8"><Skeleton className="h-64 w-full rounded-xl" /></main>
      </div>
    )
  }

  const isHr = user.role === 'hr'
  const isAdmin = user.role === 'admin'

  const hrLinks = [
    { href: "/dashboard/hr", label: "Göstəricilər", icon: LayoutDashboard },
    { href: "/dashboard/hr/company", label: "Şirkət Profili", icon: Settings },
    { href: "/dashboard/hr/jobs", label: "Vakansiyalarım", icon: Briefcase },
    { href: "/dashboard/hr/candidates", label: "Namizədlər", icon: Users },
    { href: "/dashboard/hr/applications", label: "Müraciətlər", icon: FileText },
    { href: "/dashboard/hr/contact-requests", label: "Əlaqə Sorğuları", icon: MessageSquare },
    { href: "/dashboard/hr/subscriptions", label: "HR Premium", icon: Star },
  ]

  const candidateLinks = [
    { href: "/dashboard/candidate", label: "Göstəricilər", icon: LayoutDashboard },
    { href: "/dashboard/candidate/profile", label: "Profilim", icon: Settings },
    { href: "/dashboard/candidate/applications", label: "Müraciətlərim", icon: FileText },
    { href: "/dashboard/candidate/contact-requests", label: "Gələn Sorğular", icon: MessageSquare },
    { href: "/dashboard/candidate/subscriptions", label: "Abunəliklər", icon: Star },
    { href: "/dashboard/candidate/recommended", label: "Tövsiyələr", icon: Briefcase },
    { href: "/dashboard/candidate/notifications", label: "Bildirişlər", icon: Bell },
  ]

  const adminLinks = [
    { href: "/dashboard/admin", label: "Ümumi Baxış", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "İstifadəçilər", icon: UserCog },
    { href: "/dashboard/admin/jobs", label: "Vakansiyalar", icon: Briefcase },
    { href: "/dashboard/admin/candidates", label: "Namizədlər", icon: Users },
    { href: "/dashboard/admin/companies", label: "Şirkətlər", icon: Building2 },
  ]

  const links = isAdmin ? adminLinks : isHr ? hrLinks : candidateLinks
  const panelTitle = isAdmin ? 'Admin Paneli' : isHr ? 'HR Paneli' : 'Namizəd Paneli'
  const roleBadge = isAdmin ? 'Admin' : isHr ? 'HR' : 'Namizəd'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {links.map((link) => {
        const isActive = isNavLinkActive(location, link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-muted/30 flex-col md:flex-row">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-4 gap-2 font-semibold text-lg">
          {isAdmin && <ShieldAlert className="w-5 h-5 text-primary" />}
          {panelTitle}
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavLinks />
        </nav>
        <div className="p-4 border-t">
          <Badge variant="secondary" className="w-full justify-center">{roleBadge}</Badge>
        </div>
      </aside>

      <div className="md:hidden border-b bg-card">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{panelTitle}</span>
            <Badge variant="outline" className="text-xs">{roleBadge}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen((v) => !v)} aria-label="Menyu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {mobileNavOpen && (
          <nav className="px-4 pb-4 space-y-1 border-t">
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          </nav>
        )}
      </div>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <DashboardBreadcrumb basePath={basePath} />
        {children}
      </main>
    </div>
  )
}
