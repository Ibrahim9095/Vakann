import { useEffect, useState, useCallback } from "react"
import { adminGetUsers, adminUpdateUser, adminDeleteUser, type AdminUser, type PagedResult } from "@/lib/adminApi"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Search, ShieldOff, ShieldCheck, Trash2, UserCog } from "lucide-react"
import { formatDate } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = { candidate: "Namizəd", hr: "HR", admin: "Admin" }

export default function UsersManager() {
  const [result, setResult] = useState<PagedResult<AdminUser> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminGetUsers({ search: search || undefined, role: roleFilter !== "all" ? roleFilter : undefined, page })
      setResult(data)
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, page])

  useEffect(() => { load() }, [load])

  const toggleBan = async (user: AdminUser) => {
    setActionLoading(user.id)
    try {
      await adminUpdateUser(user.id, { isBanned: !user.isBanned })
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (id: number) => {
    setActionLoading(id)
    try {
      await adminDeleteUser(id)
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const changeRole = async (id: number, role: string) => {
    setActionLoading(id)
    try {
      await adminUpdateUser(id, { role })
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = result ? Math.ceil(result.total / result.limit) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">İstifadəçi İdarəetməsi</h1>
        <p className="text-muted-foreground mt-1">Cəmi {result?.total ?? 0} istifadəçi</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Ad və ya e-poçt axtar..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün Rollər</SelectItem>
            <SelectItem value="candidate">Namizəd</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>E-poçt</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Qeydiyyat</TableHead>
                <TableHead className="text-right">Əməliyyatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Yüklənir...</TableCell></TableRow>
              ) : result?.data && result.data.length > 0 ? (
                result.data.map(user => (
                  <TableRow key={user.id} className={user.isBanned ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {user.role !== "admin" ? (
                        <Select value={user.role} onValueChange={(v) => changeRole(user.id, v)} disabled={actionLoading === user.id}>
                          <SelectTrigger className="h-7 w-[110px] text-xs border-none shadow-none bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="candidate">Namizəd</SelectItem>
                            <SelectItem value="hr">HR</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary">Admin</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isBanned ? "destructive" : "outline"} className={!user.isBanned ? "text-green-700 border-green-300 bg-green-50" : ""}>
                        {user.isBanned ? "Qadağalı" : "Aktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {user.role !== "admin" && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleBan(user)} disabled={actionLoading === user.id}
                            title={user.isBanned ? "Qadağanı Qaldır" : "İstifadəçini Qadağa Et"}>
                            {user.isBanned
                              ? <ShieldCheck className="h-4 w-4 text-green-600" />
                              : <ShieldOff className="h-4 w-4 text-orange-500" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={actionLoading === user.id}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>İstifadəçini Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>{user.fullName}</strong> ({user.email}) hesabı silinsin? Bu əməliyyat geri alına bilməz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Ləğv et</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUser(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">İstifadəçi tapılmadı.</TableCell></TableRow>
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
    </div>
  )
}
