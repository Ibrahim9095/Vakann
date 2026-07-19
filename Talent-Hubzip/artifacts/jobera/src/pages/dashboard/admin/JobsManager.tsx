import { useEffect, useState, useCallback } from "react"
import { adminGetJobs, adminUpdateJob, adminDeleteJob, adminRetrySocialPost, type AdminJob, type PagedResult } from "@/lib/adminApi"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Search, PauseCircle, PlayCircle, Trash2, Info, RefreshCw } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function JobsManager() {
  const [result, setResult] = useState<PagedResult<AdminJob> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Suspend dialog state
  const [suspendDialog, setSuspendDialog] = useState<AdminJob | null>(null)
  const [suspendNote, setSuspendNote] = useState("")

  // Note view dialog
  const [noteDialog, setNoteDialog] = useState<AdminJob | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminGetJobs({ search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined, page })
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : "Vakansiyalar yüklənə bilmədi")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => { load() }, [load])

  const suspendJob = async () => {
    if (!suspendDialog) return
    setActionLoading(suspendDialog.id)
    try {
      await adminUpdateJob(suspendDialog.id, { isSuspendedByAdmin: true, adminNote: suspendNote })
      setSuspendDialog(null)
      setSuspendNote("")
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const restoreJob = async (job: AdminJob) => {
    setActionLoading(job.id)
    try {
      await adminUpdateJob(job.id, { isSuspendedByAdmin: false, adminNote: "" })
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const deleteJob = async (id: number) => {
    setActionLoading(id)
    try {
      await adminDeleteJob(id)
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const retrySocial = async (postId: number) => {
    setActionLoading(postId)
    try {
      await adminRetrySocialPost(postId)
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (job: AdminJob) => {
    if (job.isSuspendedByAdmin) return <Badge variant="destructive">Dayandırılıb (Admin)</Badge>
    if (!job.isActive) return <Badge variant="secondary">Deaktiv (HR)</Badge>
    return <Badge className="bg-green-600 text-white hover:bg-green-700">Aktiv</Badge>
  }

  const channelLabel: Record<string, string> = { telegram: "TG", instagram: "IG", linkedin: "LI" }

  const getSocialBadges = (job: AdminJob) => {
    if (!job.socialPosts?.length) return <span className="text-xs text-muted-foreground">—</span>
    return (
      <div className="flex flex-wrap gap-1">
        {job.socialPosts.map((post) => (
          <div key={post.id} className="flex items-center gap-0.5">
            <Badge
              variant={post.status === "posted" ? "default" : post.status === "failed" ? "destructive" : "outline"}
              className="text-[10px] h-5"
              title={post.error ?? post.status}
            >
              {channelLabel[post.channel] ?? post.channel}: {post.status === "posted" ? "✓" : post.status === "failed" ? "✗" : "…"}
            </Badge>
            {post.status === "failed" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                title="Yenidən cəhd et"
                disabled={actionLoading === post.id}
                onClick={() => retrySocial(post.id)}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    )
  }

  const totalPages = result ? Math.ceil(result.total / result.limit) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vakansiya İdarəetməsi</h1>
        <p className="text-muted-foreground mt-1">Cəmi {result?.total ?? 0} vakansiya</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Vakansiya başlığı axtar..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün Statuslar</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="inactive">Deaktiv</SelectItem>
            <SelectItem value="suspended">Dayandırılmış</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlıq</TableHead>
                <TableHead>Şirkət</TableHead>
                <TableHead>Kateqoriya</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sosial</TableHead>
                <TableHead>Baxış / Müraciət</TableHead>
                <TableHead>Tarix</TableHead>
                <TableHead className="text-right">Əməliyyatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Yüklənir...</TableCell></TableRow>
              ) : result?.data && result.data.length > 0 ? (
                result.data.map(job => (
                  <TableRow key={job.id} className={job.isSuspendedByAdmin ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium max-w-[200px] truncate">{job.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{job.company?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm">{job.category}</TableCell>
                    <TableCell>{getStatusBadge(job)}</TableCell>
                    <TableCell>{getSocialBadges(job)}</TableCell>
                    <TableCell className="text-sm text-center">{job.viewCount} / {job.applicationCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {job.adminNote && (
                          <Button variant="ghost" size="sm" onClick={() => setNoteDialog(job)} title="Admin qeydinə bax">
                            <Info className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        {job.isSuspendedByAdmin ? (
                          <Button variant="ghost" size="sm" onClick={() => restoreJob(job)} disabled={actionLoading === job.id} title="Bərpa et">
                            <PlayCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => { setSuspendDialog(job); setSuspendNote("") }} disabled={actionLoading === job.id} title="Dayandır">
                            <PauseCircle className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={actionLoading === job.id}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Vakansiyaı Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>"{job.title}"</strong> vakansiyası bütün müraciətləri ilə birlikdə silinsin? Bu əməliyyat geri alına bilməz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteJob(job.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Vakansiya tapılmadı.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Əvvəlki</Button>
          <span className="text-sm text-muted-foreground px-3 py-2">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Növbəti</Button>
        </div>
      )}

      {/* Suspend Dialog */}
      <Dialog open={!!suspendDialog} onOpenChange={(open) => !open && setSuspendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vakansiyaı Dayandır</DialogTitle>
            <DialogDescription>
              <strong>"{suspendDialog?.title}"</strong> vakansiyası dayandırılsın. İzahınızı yazın — bu qeyd HR-a görünəcək.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="suspend-note">Admin Qeydi (HR-a görünür)</Label>
            <Textarea
              id="suspend-note"
              placeholder="Məs: Platformanın qaydalarını pozduğu üçün dayandırıldı..."
              value={suspendNote}
              onChange={(e) => setSuspendNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(null)}>Ləğv et</Button>
            <Button variant="destructive" onClick={suspendJob} disabled={!suspendNote.trim() || actionLoading !== null}>
              Dayandır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note View Dialog */}
      <Dialog open={!!noteDialog} onOpenChange={(open) => !open && setNoteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Qeydi</DialogTitle>
            <DialogDescription>"{noteDialog?.title}" vakansiyası üçün admin tərəfindən əlavə edilmiş qeyd:</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">{noteDialog?.adminNote}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Bağla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
