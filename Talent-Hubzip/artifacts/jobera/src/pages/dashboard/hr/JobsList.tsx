import { useUpdateJob, getListJobsQueryKey, useListJobs } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "wouter"
import { Plus, Edit, Eye, EyeOff, AlertTriangle, Share2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { formatDate } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import JobMatchesDialog from "./JobMatchesDialog"
import { useEffect, useState } from "react"
import { apiFetch, shareJob } from "@/lib/api"
import { toast } from "sonner"

export default function JobsList() {
  const [companyId, setCompanyId] = useState<number | undefined>()
  const { data, isLoading } = useListJobs(companyId ? { companyId } : undefined)
  const updateMutation = useUpdateJob()
  const queryClient = useQueryClient()

  useEffect(() => {
    apiFetch<{ id: number }>("/api/companies/me")
      .then((c) => setCompanyId(c.id))
      .catch(() => setCompanyId(undefined))
  }, [])

  const handleShare = async (jobId: number) => {
    try {
      await shareJob(jobId, ["telegram", "instagram", "linkedin"])
      toast.success("Vakansiya sosial şəbəkələrə göndərildi")
    } catch {
      toast.error("Paylaşım uğursuz oldu")
    }
  }

  const toggleStatus = (id: number, currentStatus: boolean | undefined) => {
    updateMutation.mutate({ id, data: { isActive: !currentStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vakansiyalarım</h1>
          <p className="text-muted-foreground mt-1">Bütün iş elanlarınızı idarə edin.</p>
        </div>
        <Link href="/jobs/new">
          <Button><Plus className="w-4 h-4 mr-2" /> Yeni Vakansiya</Button>
        </Link>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlıq</TableHead>
                <TableHead>Kateqoriya</TableHead>
                <TableHead>Tarix</TableHead>
                <TableHead className="text-center">Baxış / Müraciət</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Əməliyyatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Yüklənir...</TableCell></TableRow>
              ) : data?.data && data.data.length > 0 ? (
                (data.data as any[]).map((job: any) => (
                  <>
                    <TableRow key={job.id} className={job.isSuspendedByAdmin ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {job.isSuspendedByAdmin && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                          {job.title}
                        </div>
                      </TableCell>
                      <TableCell>{job.category}</TableCell>
                      <TableCell>{formatDate(job.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{job.viewCount || 0}</span> / <span className="font-semibold text-primary">{job.applicationCount || 0}</span>
                      </TableCell>
                      <TableCell>
                        {job.isSuspendedByAdmin ? (
                          <Badge variant="destructive">Admin dayandırdı</Badge>
                        ) : (
                          <Badge variant={job.isActive ? 'default' : 'secondary'}
                            className={job.isActive ? 'bg-green-600 text-white hover:bg-green-700' : ''}>
                            {job.isActive ? 'Aktiv' : 'Deaktiv'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {!job.isSuspendedByAdmin && (
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(job.id, job.isActive)}>
                            {job.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        )}
                        <Link href={`/jobs/${job.id}/edit`}>
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleShare(job.id)} title="Paylaş">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <JobMatchesDialog jobId={job.id} jobTitle={job.title} />
                      </TableCell>
                    </TableRow>
                    {job.isSuspendedByAdmin && job.adminNote && (
                      <TableRow key={`note-${job.id}`} className="bg-destructive/5">
                        <TableCell colSpan={6} className="py-2 px-4">
                          <div className="flex items-start gap-2 text-sm text-destructive">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span><strong>Admin qeydi:</strong> {job.adminNote}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Hələ heç bir vakansiya əlavə edilməyib.
                    <div className="mt-4">
                      <Link href="/jobs/new">
                        <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> İlk vakansiyanı yarat</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
