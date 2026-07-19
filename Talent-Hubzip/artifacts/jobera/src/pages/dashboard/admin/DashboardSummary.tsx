import { useEffect, useState } from "react"
import { adminGetStats, type AdminStats } from "@/lib/adminApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Users, Briefcase, Building2, UserCheck, AlertTriangle, FileText, CreditCard, ShieldOff } from "lucide-react"

export default function AdminDashboardSummary() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminGetStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    </div>
  )

  if (error) return <div className="text-destructive p-4">Xəta: {error}</div>
  if (!stats) return null

  const cards = [
    { label: "Cəmi İstifadəçi", value: stats.totalUsers, icon: Users, href: "/users", color: "text-blue-600" },
    { label: "Qadağalı İstifadəçi", value: stats.bannedUsers, icon: ShieldOff, href: "/users", color: "text-red-500" },
    { label: "Cəmi Vakansiya", value: stats.totalJobs, icon: Briefcase, href: "/jobs", color: "text-green-600" },
    { label: "Admin Tərəfindən Dayandırılmış", value: stats.suspendedJobs, icon: AlertTriangle, href: "/jobs?status=suspended", color: "text-orange-500" },
    { label: "Cəmi Namizəd", value: stats.totalCandidates, icon: UserCheck, href: "/candidates", color: "text-purple-600" },
    { label: "Dayandırılmış Namizəd", value: stats.suspendedCandidates, icon: ShieldOff, href: "/candidates?status=suspended", color: "text-orange-500" },
    { label: "Şirkətlər", value: stats.totalCompanies, icon: Building2, href: "/companies", color: "text-teal-600" },
    { label: "Cəmi Müraciət", value: stats.totalApplications, icon: FileText, href: "/jobs", color: "text-indigo-600" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Paneli</h1>
        <p className="text-muted-foreground mt-1">Platformanın ümumi görünüşü və idarəetməsi.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <Link href="/users">
          <Button variant="outline" className="w-full h-12 justify-start gap-3">
            <Users className="h-4 w-4 text-blue-600" /> İstifadəçiləri İdarə Et
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="outline" className="w-full h-12 justify-start gap-3">
            <Briefcase className="h-4 w-4 text-green-600" /> Vakansiyaları İdarə Et
          </Button>
        </Link>
        <Link href="/candidates">
          <Button variant="outline" className="w-full h-12 justify-start gap-3">
            <UserCheck className="h-4 w-4 text-purple-600" /> Namizədləri İdarə Et
          </Button>
        </Link>
        <Link href="/companies">
          <Button variant="outline" className="w-full h-12 justify-start gap-3">
            <Building2 className="h-4 w-4 text-teal-600" /> Şirkətləri İdarə Et
          </Button>
        </Link>
      </div>
    </div>
  )
}
