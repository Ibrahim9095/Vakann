import { useGetCandidateDashboardSummary } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, FileText, MessageSquare, Star } from "lucide-react"
import { OnboardingBanner } from "@/components/layout/OnboardingBanner"

export default function DashboardSummary() {
  const { data: summary, isLoading } = useGetCandidateDashboardSummary()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Göstəricilər</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!summary) return <div>Xəta baş verdi.</div>

  return (
    <div className="space-y-6">
      <OnboardingBanner type="candidate" />
      <h1 className="text-2xl font-bold tracking-tight">Paneldə Xülasə</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profil baxışları</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.profileViews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktiv müraciətlər</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">Cəmi: {summary.totalApplications}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Əlaqə sorğuları</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalContactRequests}</div>
          </CardContent>
        </Card>
        <Card className={summary.subscriptionStatus === 'active' ? 'border-accent bg-accent/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abunəlik</CardTitle>
            <Star className={`h-4 w-4 ${summary.subscriptionStatus === 'active' ? 'text-accent' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {summary.subscriptionStatus === 'active' ? 'VIP Status' : 'Standart Profil'}
            </div>
            {summary.subscriptionExpiresAt && (
              <p className="text-xs text-muted-foreground mt-1">Bitir: {new Date(summary.subscriptionExpiresAt).toLocaleDateString('az-AZ')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed Placeholder */}
      <h2 className="text-xl font-bold mt-12 mb-4">Son fəaliyyətlər</h2>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {summary.recentApplications?.map(app => (
              <div key={`app-${app.id}`} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{app.job?.title} müraciəti</p>
                  <p className="text-xs text-muted-foreground">{app.job?.company?.name}</p>
                </div>
                <div className="text-xs bg-secondary px-2 py-1 rounded-md">{app.status}</div>
              </div>
            ))}
            {summary.recentContactRequests?.map(req => (
               <div key={`req-${req.id}`} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{req.company?.name} əlaqə sorğusu</p>
                </div>
                <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">{req.status}</div>
              </div>
            ))}
            {(!summary.recentApplications?.length && !summary.recentContactRequests?.length) && (
              <div className="p-8 text-center text-muted-foreground text-sm">Hələ fəaliyyət yoxdur</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
