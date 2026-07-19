import { Link } from "wouter"
import { useState } from "react"
import { useListCompanies, getListCompaniesQueryKey } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Search, MapPin, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function Companies() {
  const [search, setSearch] = useState("")
  const params = { search: search || undefined, limit: 50 }
  const { data, isLoading } = useListCompanies(params, {
    query: { queryKey: getListCompaniesQueryKey(params) },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Şirkətlər</h1>
        <p className="text-muted-foreground mt-1">Platformada qeydiyyatdan keçmiş şirkətlər</p>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Şirkət adı və ya sektor..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        ) : data && data.length > 0 ? (
          data.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex gap-4">
                  <div className="h-14 w-14 rounded-lg border bg-muted flex items-center justify-center shrink-0">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <Building2 className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate">{company.name}</h3>
                      {company.isVerified && (
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    {company.sector && <Badge variant="secondary" className="mb-2">{company.sector}</Badge>}
                    {company.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {company.city}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="md:col-span-2">
            <CardContent className="py-16 text-center text-muted-foreground">
              Heç bir şirkət tapılmadı.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
