import { useEffect, useState, useCallback } from "react"
import { adminGetCompanies, adminUpdateCompany, type AdminCompany, type PagedResult } from "@/lib/adminApi"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, BadgeCheck, BadgeX } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function CompaniesManager() {
  const [result, setResult] = useState<PagedResult<AdminCompany> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminGetCompanies({ search: search || undefined, page })
      setResult(data)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => { load() }, [load])

  const toggleVerify = async (company: AdminCompany) => {
    setActionLoading(company.id)
    try {
      await adminUpdateCompany(company.id, { isVerified: !company.isVerified })
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = result ? Math.ceil(result.total / result.limit) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Şirkət İdarəetməsi</h1>
        <p className="text-muted-foreground mt-1">Cəmi {result?.total ?? 0} şirkət</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Şirkət adı axtar..." className="pl-9" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Şirkət Adı</TableHead>
                <TableHead>Sektor</TableHead>
                <TableHead>Şəhər</TableHead>
                <TableHead>HR (Sahib)</TableHead>
                <TableHead>Vakansiyalar</TableHead>
                <TableHead>Doğrulama</TableHead>
                <TableHead>Qeydiyyat</TableHead>
                <TableHead className="text-right">Əməliyyatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Yüklənir...</TableCell></TableRow>
              ) : result?.data && result.data.length > 0 ? (
                result.data.map(company => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.sector ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.city ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      <div>{company.hrUser?.fullName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{company.hrUser?.email}</div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{company.jobCount}</TableCell>
                    <TableCell>
                      <Badge variant={company.isVerified ? "default" : "secondary"}
                        className={company.isVerified ? "bg-green-600 text-white hover:bg-green-700" : ""}>
                        {company.isVerified ? "Doğrulanmış" : "Doğrulanmamış"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(company.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => toggleVerify(company)} disabled={actionLoading === company.id}
                        title={company.isVerified ? "Doğrulamanı Geri Al" : "Doğrula"}>
                        {company.isVerified
                          ? <BadgeX className="h-4 w-4 text-orange-500" />
                          : <BadgeCheck className="h-4 w-4 text-green-600" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Şirkət tapılmadı.</TableCell></TableRow>
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
