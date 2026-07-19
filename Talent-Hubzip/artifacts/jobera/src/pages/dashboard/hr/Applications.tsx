import { useState, useEffect, useMemo } from "react"
import { useListApplications, useUpdateApplication, getListApplicationsQueryKey, useListContactRequests } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { type ApplicationUpdateStatus } from "@workspace/api-client-react"
import { RatingDialog } from "@/components/RatingDialog"
import { Star } from "lucide-react"
import { getRatingEligibility } from "@/lib/api"

const RATING_COOLDOWN_MS = 24 * 60 * 60 * 1000

export default function Applications() {
  const { data, isLoading } = useListApplications()
  const { data: contactRequests } = useListContactRequests()
  const updateMutation = useUpdateApplication()
  const queryClient = useQueryClient()
  const [ratingTarget, setRatingTarget] = useState<{ id: number; name: string } | null>(null)
  const [eligibilityMap, setEligibilityMap] = useState<Record<number, boolean>>({})

  const rateableCandidateIds = useMemo(() => {
    if (!contactRequests) return new Set<number>()
    const now = Date.now()
    return new Set(
      contactRequests
        .filter((cr) =>
          cr.status === "accepted"
          && cr.unblurredAt
          && now - new Date(cr.unblurredAt).getTime() >= RATING_COOLDOWN_MS,
        )
        .map((cr) => cr.candidateId),
    )
  }, [contactRequests])

  useEffect(() => {
    if (!data?.length) return
    const candidateIds = [...new Set(data.map((a) => a.candidateId).filter(Boolean))] as number[]
    candidateIds.forEach((id) => {
      if (!rateableCandidateIds.has(id)) {
        setEligibilityMap((prev) => ({ ...prev, [id]: false }))
        return
      }
      getRatingEligibility(id)
        .then((r) => setEligibilityMap((prev) => ({ ...prev, [id]: r.allowed })))
        .catch(() => setEligibilityMap((prev) => ({ ...prev, [id]: false })))
    })
  }, [data, rateableCandidateIds])

  const handleStatusChange = (id: number, status: ApplicationUpdateStatus) => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() })
      }
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Gələn Müraciətlər</h1>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namizəd</TableHead>
                <TableHead>Vakansiya</TableHead>
                <TableHead>Tarix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">İdarəetmə</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Yüklənir...</TableCell></TableRow>
              ) : data && data.length > 0 ? (
                data.map(app => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <Link href={`~/candidates/${app.candidateId}`} className="hover:underline text-primary">
                        {app.candidate?.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{app.job?.title}</TableCell>
                    <TableCell>{formatDate(app.createdAt)}</TableCell>
                    <TableCell><StatusBadge status={app.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {app.candidateId && eligibilityMap[app.candidateId] && (
                          <Button size="sm" variant="outline" onClick={() => setRatingTarget({ id: app.candidateId, name: app.candidate?.fullName ?? "Namizəd" })}>
                            <Star className="h-3 w-3 mr-1" /> Reytinq
                          </Button>
                        )}
                        <Select value={app.status} onValueChange={(v: ApplicationUpdateStatus) => handleStatusChange(app.id, v)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Gözləyir</SelectItem>
                            <SelectItem value="reviewed">Baxılıb</SelectItem>
                            <SelectItem value="shortlisted">Seçilib</SelectItem>
                            <SelectItem value="rejected">Rədd edilib</SelectItem>
                            <SelectItem value="hired">Qəbul edilib</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Hələ heç bir müraciət daxil olmayıb.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {ratingTarget && (
        <RatingDialog
          candidateId={ratingTarget.id}
          candidateName={ratingTarget.name}
          open={!!ratingTarget}
          onOpenChange={(open) => !open && setRatingTarget(null)}
        />
      )}
    </div>
  )
}
