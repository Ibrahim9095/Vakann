import { useRoute } from "wouter"
import { useGetCompany, useListJobs } from "@workspace/api-client-react"
import { getGetCompanyQueryKey, getListJobsQueryKey } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, ChevronLeft, MapPin, Mail, Phone, CheckCircle } from "lucide-react"
import { Link } from "wouter"

export default function CompanyDetail() {
  const [, params] = useRoute("/companies/:id")
  const companyId = params?.id ? parseInt(params.id, 10) : 0

  const { data: company, isLoading } = useGetCompany(companyId, {
    query: { enabled: !!companyId, queryKey: getGetCompanyQueryKey(companyId) },
  })

  const { data: jobsData } = useListJobs(
    { companyId },
    { query: { enabled: !!companyId, queryKey: getListJobsQueryKey({ companyId }) } },
  )

  if (isLoading) return <div className="container mx-auto px-4 py-16 text-center">Yüklənir...</div>
  if (!company) return <div className="container mx-auto px-4 py-16 text-center text-destructive">Şirkət tapılmadı.</div>

  const jobs = jobsData?.data ?? []

  return (
    <div className="bg-muted/20 min-h-[calc(100vh-4rem)]">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" /> Vakansiyalara qayıt
          </Link>
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-xl border bg-background flex items-center justify-center overflow-hidden">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{company.name}</h1>
                {company.isVerified && (
                  <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Təsdiqlənib</Badge>
                )}
              </div>
              {company.sector && <p className="text-primary font-medium">{company.sector}</p>}
              {company.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" /> {company.city}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Haqqında</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {company.description || "Təsvir əlavə edilməyib."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Aktiv Vakansiyalar ({jobs.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {jobs.length > 0 ? jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.city} · {job.category}</p>
                  </div>
                </Link>
              )) : (
                <p className="text-muted-foreground text-sm">Aktiv vakansiya yoxdur.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Əlaqə</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {company.contactEmail && (
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {company.contactEmail}</div>
            )}
            {company.contactPhone && (
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {company.contactPhone}</div>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline block">
                {company.website}
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
