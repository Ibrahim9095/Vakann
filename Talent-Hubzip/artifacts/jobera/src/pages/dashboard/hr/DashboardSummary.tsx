import { useGetHrDashboardSummary } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Briefcase, FileText, CheckCircle, Users } from "lucide-react"
import { OnboardingBanner } from "@/components/layout/OnboardingBanner"

export default function DashboardSummary() {
  const { data: summary, isLoading } = useGetHrDashboardSummary()

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
      <OnboardingBanner type="hr" />
      <h1 className="text-2xl font-bold tracking-tight">Paneldə Xülasə</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktiv Vakansiyalar</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Cəmi yaranıb: {summary.totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gözləyən Müraciətlər</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pendingApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">Cəmi müraciət: {summary.totalApplications}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ümumi Sorğular</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalContactRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qəbul Edilmiş Sorğular</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.acceptedContactRequests}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Son Vakansiyalar</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {summary.recentJobs?.slice(0, 5).map(job => (
                  <div key={job.id} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.applicationCount} müraciət</p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-md ${job.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                      {job.isActive ? 'Aktiv' : 'Deaktiv'}
                    </div>
                  </div>
                ))}
                {!summary.recentJobs?.length && (
                  <div className="p-8 text-center text-muted-foreground text-sm">Hələ vakansiya yoxdur</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
           <h2 className="text-xl font-bold mb-4">Son Müraciətlər</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {summary.recentApplications?.slice(0, 5).map(app => (
                  <div key={app.id} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{app.candidate?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{app.job?.title}</p>
                    </div>
                    <div className="text-xs bg-secondary px-2 py-1 rounded-md">{app.status}</div>
                  </div>
                ))}
                {!summary.recentApplications?.length && (
                  <div className="p-8 text-center text-muted-foreground text-sm">Hələ müraciət yoxdur</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
