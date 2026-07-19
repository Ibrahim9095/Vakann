import { useEffect, useState, useCallback } from "react"
import { adminGetCandidates, adminUpdateCandidate, type AdminCandidate, type PagedResult } from "@/lib/adminApi"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Link } from "wouter"
import { Search, PauseCircle, PlayCircle, Star, ExternalLink, Info } from "lucide-react"
import { formatDate } from "@/lib/utils"

const TIER_LABELS: Record<string, { label: string; class: string }> = {
  vip: { label: "VIP", class: "bg-amber-100 text-amber-800 border-amber-300" },
  time_limited: { label: "Müddətli", class: "bg-blue-100 text-blue-800 border-blue-300" },
  free: { label: "Standart", class: "" },
}

export default function CandidatesManager() {
  const [result, setResult] = useState<PagedResult<AdminCandidate> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const [suspendDialog, setSuspendDialog] = useState<AdminCandidate | null>(null)
  const [suspendNote, setSuspendNote] = useState("")
  const [noteDialog, setNoteDialog] = useState<AdminCandidate | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminGetCandidates({ search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined, page })
      setResult(data)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => { load() }, [load])

  const suspendCandidate = async () => {
    if (!suspendDialog) return
    setActionLoading(suspendDialog.id)
    try {
      await adminUpdateCandidate(suspendDialog.id, { isSuspendedByAdmin: true, adminNote: suspendNote })
      setSuspendDialog(null)
      setSuspendNote("")
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const restoreCandidate = async (c: AdminCandidate) => {
    setActionLoading(c.id)
    try {
      await adminUpdateCandidate(c.id, { isSuspendedByAdmin: false, adminNote: "" })
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = result ? Math.ceil(result.total / result.limit) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Namizəd İdarəetməsi</h1>
        <p className="text-muted-foreground mt-1">Cəmi {result?.total ?? 0} namizəd</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Ad və ya kateqoriya axtar..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün Statuslar</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="suspended">Dayandırılmış</SelectItem>
            <SelectItem value="inactive">Deaktiv</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Kateqoriya</TableHead>
                <TableHead>Şəhər</TableHead>
                <TableHead>Abunəlik</TableHead>
                <TableHead>Reytinq</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Qeydiyyat</TableHead>
                <TableHead className="text-right">Əməliyyatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Yüklənir...</TableCell></TableRow>
              ) : result?.data && result.data.length > 0 ? (
                result.data.map(c => {
                  const tier = TIER_LABELS[c.subscriptionTier] ?? TIER_LABELS.free
                  return (
                    <TableRow key={c.id} className={c.isSuspendedByAdmin ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium">{c.fullName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.category}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.city ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tier.class}>{tier.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {c.averageRating != null ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                            {c.averageRating.toFixed(1)} ({c.totalRatings})
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        {c.isSuspendedByAdmin
                          ? <Badge variant="destructive">Dayandırılıb</Badge>
                          : c.isActive
                            ? <Badge className="bg-green-600 text-white hover:bg-green-700">Aktiv</Badge>
                            : <Badge variant="secondary">Deaktiv</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {c.adminNote && (
                            <Button variant="ghost" size="sm" onClick={() => setNoteDialog(c)} title="Qeydi gör">
                              <Info className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          <Link href={`/candidates/${c.id}`}>
                            <Button variant="ghost" size="sm" title="Profile bax">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </Link>
                          {c.isSuspendedByAdmin ? (
                            <Button variant="ghost" size="sm" onClick={() => restoreCandidate(c)} disabled={actionLoading === c.id} title="Bərpa et">
                              <PlayCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => { setSuspendDialog(c); setSuspendNote("") }} disabled={actionLoading === c.id} title="Dayandır">
                              <PauseCircle className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Namizəd tapılmadı.</TableCell></TableRow>
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

      <Dialog open={!!suspendDialog} onOpenChange={(open) => !open && setSuspendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Namizədi Dayandır</DialogTitle>
            <DialogDescription>
              <strong>{suspendDialog?.fullName}</strong> profilini dayandırmağın səbəbini yazın. Bu qeyd namizədə görünəcək.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="candidate-note">Admin Qeydi</Label>
            <Textarea id="candidate-note" placeholder="Dayandırılma səbəbi..." value={suspendNote}
              onChange={(e) => setSuspendNote(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(null)}>Ləğv et</Button>
            <Button variant="destructive" onClick={suspendCandidate} disabled={!suspendNote.trim() || actionLoading !== null}>
              Dayandır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!noteDialog} onOpenChange={(open) => !open && setNoteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Qeydi</DialogTitle>
            <DialogDescription>{noteDialog?.fullName} üçün admin qeydi:</DialogDescription>
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
