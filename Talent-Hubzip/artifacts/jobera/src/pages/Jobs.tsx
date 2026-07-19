import { useState } from "react"
import { useLocation } from "wouter"
import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, MapPin, Briefcase, Building, Clock } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"

export default function Jobs() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [city, setCity] = useState("all")
  const [employmentType, setEmploymentType] = useState("all")
  
  // Real fetch using Orval hooks
  const params = {
    search: search || undefined,
    category: category !== 'all' ? category : undefined,
    city: city !== 'all' ? city : undefined,
    employmentType: employmentType !== 'all' ? employmentType : undefined,
  }
  const { data, isLoading } = useListJobs(params, {
    query: { queryKey: getListJobsQueryKey(params) }
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vakansiyalar</h1>
          <p className="text-muted-foreground mt-1">Azərbaycandakı ən son iş imkanlarını kəşf edin.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="İş axtarın..." 
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-[200px] bg-muted/50 border-transparent focus:bg-background">
            <SelectValue placeholder="Bütün kateqoriyalar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün kateqoriyalar</SelectItem>
            <SelectItem value="it">İnformasiya Texnologiyaları</SelectItem>
            <SelectItem value="marketing">Marketinq</SelectItem>
            <SelectItem value="finance">Maliyyə</SelectItem>
            <SelectItem value="sales">Satış</SelectItem>
            <SelectItem value="design">Dizayn</SelectItem>
          </SelectContent>
        </Select>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full md:w-[200px] bg-muted/50 border-transparent focus:bg-background">
            <SelectValue placeholder="Bütün şəhərlər" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün şəhərlər</SelectItem>
            <SelectItem value="baku">Bakı</SelectItem>
            <SelectItem value="sumqayit">Sumqayıt</SelectItem>
            <SelectItem value="gence">Gəncə</SelectItem>
          </SelectContent>
        </Select>
        <Select value={employmentType} onValueChange={setEmploymentType}>
          <SelectTrigger className="w-full md:w-[200px] bg-muted/50 border-transparent focus:bg-background">
            <SelectValue placeholder="İş növü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün növlər</SelectItem>
            <SelectItem value="full_time">Tam ştat</SelectItem>
            <SelectItem value="part_time">Yarım ştat</SelectItem>
            <SelectItem value="remote">Uzaqdan</SelectItem>
            <SelectItem value="contract">Müqavilə</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : data?.data && data.data.length > 0 ? (
          data.data.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="overflow-hidden hover:border-primary/50 transition-colors hover:shadow-md cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="h-16 w-16 shrink-0 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                      {job.company?.logoUrl ? (
                        <img src={job.company.logoUrl} alt={job.company.name} className="h-full w-full object-cover" />
                      ) : (
                        <Building className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">{job.title}</h3>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-3">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          {job.company?.name || "Şirkət"}
                        </span>
                        {job.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {job.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {formatDate(job.createdAt)}
                        </span>
                        {(job.salaryMin || job.salaryMax) && (
                          <span className="font-medium text-foreground bg-primary/5 px-2 py-0.5 rounded-sm text-primary">
                            {job.salaryMin ? formatCurrency(job.salaryMin, job.currency) : ''} 
                            {job.salaryMin && job.salaryMax ? ' - ' : ''} 
                            {job.salaryMax ? formatCurrency(job.salaryMax, job.currency) : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.employmentType && <StatusBadge status={job.employmentType} />}
                        <Badge variant="outline">{job.category}</Badge>
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                      <Button variant="secondary">Müraciət et</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-24 bg-card border rounded-xl">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Heç bir vakansiya tapılmadı</h3>
            <p className="text-muted-foreground">Axtarış meyarlarınıza uyğun nəticə yoxdur. Filtrləri dəyişdirməyi yoxlayın.</p>
            <Button variant="outline" className="mt-6" onClick={() => {setSearch(''); setCategory('all'); setCity('all'); setEmploymentType('all')}}>
              Filtrləri sıfırla
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
