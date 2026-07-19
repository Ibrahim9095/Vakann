import { useListApplications } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/utils"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"

export default function Applications() {
  const { data, isLoading } = useListApplications()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Müraciətlərim</h1>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vakansiya</TableHead>
                <TableHead>Şirkət</TableHead>
                <TableHead>Tarix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Əməliyyat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Yüklənir...</TableCell></TableRow>
              ) : data && data.length > 0 ? (
                data.map(app => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.job?.title}</TableCell>
                    <TableCell>{app.job?.company?.name}</TableCell>
                    <TableCell>{formatDate(app.createdAt)}</TableCell>
                    <TableCell><StatusBadge status={app.status} /></TableCell>
                    <TableCell className="text-right">
                      <Link href={`/jobs/${app.jobId}`}>
                        <Button variant="ghost" size="sm">Bax</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Hələ heç bir müraciətiniz yoxdur.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
