import { useState } from "react"
import { useListCandidates, getListCandidatesQueryKey } from "@workspace/api-client-react"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MapPin, Briefcase, Star, PhoneOff, GraduationCap } from "lucide-react"

// Reusing same layout as Candidates page but adapted for HR panel with fewer hero elements
export default function CandidatesBrowser() {
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
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Namizədlər</h1>
        <p className="text-muted-foreground mt-1">Platformadakı istedadları axtarın və birbaşa əlaqə yaradın.</p>
      </div>

      <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
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
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">Yüklənir...</div>
        ) : data?.data && data.data.length > 0 ? (
          data.data.map((candidate) => (
             <div key={candidate.id} className={`bg-card border rounded-xl p-6 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow ${candidate.subscriptionTier === 'vip' ? 'border-accent' : ''}`}>
               <Avatar className="h-16 w-16 border-2 border-background shadow-sm shrink-0">
                  <AvatarImage src={candidate.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {candidate.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`font-semibold text-lg line-clamp-1 ${candidate.isContactBlurred ? 'blur-[4px] select-none text-muted-foreground' : 'text-foreground'}`}>
                        {candidate.fullName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{candidate.title || candidate.category}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                    {candidate.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{candidate.city}</span>}
                    {candidate.experienceYears !== undefined && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{candidate.experienceYears} il</span>}
                    {candidate.education && <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{candidate.education}</span>}
                  </div>

                  <div className="flex justify-between items-center mt-auto">
                    {candidate.isContactBlurred ? (
                      <span className="text-xs text-destructive flex items-center gap-1"><PhoneOff className="h-3.5 w-3.5" /> Gizli profil</span>
                    ) : (
                      <span />
                    )}
                    <Link href={`~/candidates/${candidate.id}`}>
                      <Button variant="secondary" size="sm">Profilə Bax</Button>
                    </Link>
                  </div>
                </div>
             </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-card border rounded-xl text-muted-foreground">
            Axtarışa uyğun namizəd tapılmadı
          </div>
        )}
      </div>
    </div>
  )
}
