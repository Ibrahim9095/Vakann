import { useState } from "react"
import { Link } from "wouter"
import { useListCandidates, getListCandidatesQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, Briefcase, Star, HeartPulse, GraduationCap, PhoneOff } from "lucide-react"

export default function Candidates() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [city, setCity] = useState("all")
  
  const params = {
    search: search || undefined,
    category: category !== 'all' ? category : undefined,
    city: city !== 'all' ? city : undefined,
  }
  const { data, isLoading } = useListCandidates(params, {
    query: { queryKey: getListCandidatesQueryKey(params) }
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Namizəd Bazası</h1>
          <p className="text-muted-foreground mt-1">Süni intellekt dəstəkli reytinqlərlə ən yaxşı istedadları tapın.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Açar sözlər, bacarıqlar..." 
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-[200px] bg-muted/50 border-transparent focus:bg-background">
            <SelectValue placeholder="Kateqoriya" />
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
            <SelectValue placeholder="Şəhər" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün şəhərlər</SelectItem>
            <SelectItem value="baku">Bakı</SelectItem>
            <SelectItem value="sumqayit">Sumqayıt</SelectItem>
            <SelectItem value="gence">Gəncə</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : data?.data && data.data.length > 0 ? (
          data.data.map((candidate) => (
            <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
              <Card className={`overflow-hidden hover:border-primary/50 transition-all hover:shadow-md cursor-pointer h-full flex flex-col ${candidate.subscriptionTier === 'vip' ? 'border-accent ring-1 ring-accent/20' : ''}`}>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                        <AvatarImage src={candidate.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {candidate.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className={`font-semibold line-clamp-1 ${candidate.isContactBlurred ? 'blur-[4px] select-none text-muted-foreground' : 'text-foreground'}`}>
                          {candidate.fullName}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{candidate.title || candidate.category}</p>
                        {candidate.subscriptionTier === 'vip' && (
                          <Badge className="mt-1 bg-accent text-accent-foreground hover:bg-accent border-transparent h-5 text-[10px] px-1.5 shadow-sm">
                            <Star className="w-3 h-3 mr-1 fill-current" /> VIP
                          </Badge>
                        )}
                        {(candidate.averageRating ?? 0) > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Star className="w-3 h-3 fill-accent text-accent" />
                            {candidate.averageRating?.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1 mt-2">
                    {candidate.city && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2 text-primary/70 shrink-0" />
                        <span className="line-clamp-1">{candidate.city}{candidate.district ? `, ${candidate.district}` : ''}</span>
                      </div>
                    )}
                    {candidate.experienceYears !== undefined && candidate.experienceYears !== null && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4 mr-2 text-primary/70 shrink-0" />
                        <span>{candidate.experienceYears} il təcrübə</span>
                      </div>
                    )}
                    {candidate.education && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4 mr-2 text-primary/70 shrink-0" />
                        <span className="line-clamp-1">{candidate.education}</span>
                      </div>
                    )}
                  </div>

                  {candidate.isContactBlurred && (
                    <div className="mt-4 p-2 bg-destructive/5 rounded-md flex items-center gap-2 text-xs text-destructive border border-destructive/10">
                      <PhoneOff className="h-3.5 w-3.5" /> Əlaqə məlumatları gizlidir
                    </div>
                  )}

                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t">
                      {candidate.skills.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="font-normal text-[10px] h-5">{skill}</Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge variant="secondary" className="font-normal text-[10px] h-5">+{candidate.skills.length - 3}</Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Status indicators */}
                  <div className="flex gap-2 mt-3 justify-end">
                    {candidate.hasDisabilityStatus && <HeartPulse className="h-4 w-4 text-destructive" aria-label="Əlillik kvotası" />}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-24 bg-card border rounded-xl">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Heç bir namizəd tapılmadı</h3>
            <p className="text-muted-foreground">Filtrləri dəyişərək yenidən yoxlayın.</p>
          </div>
        )}
      </div>
    </div>
  )
}
