import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Search, Building2, Users, ArrowRight, ShieldCheck, Zap, Star, MapPin } from "lucide-react"
import { useGetTopCandidates, getGetTopCandidatesQueryKey, useGetPlatformStats, getGetPlatformStatsQueryKey, useListPackages, getListPackagesQueryKey } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Home() {
  const { user } = useAuth()
  const [vipOpen, setVipOpen] = useState(false)
  const { data: topCandidates } = useGetTopCandidates({ limit: 6 }, {
    query: { queryKey: getGetTopCandidatesQueryKey({ limit: 6 }) },
  })
  const { data: stats } = useGetPlatformStats({
    query: { queryKey: getGetPlatformStatsQueryKey() },
  })
  const { data: packages } = useListPackages({
    query: { queryKey: getListPackagesQueryKey() },
  })

  const formatStat = (n?: number) => {
    if (n == null) return "—"
    if (n >= 1000) return `${Math.floor(n / 1000)}K+`
    return String(n)
  }

  useEffect(() => {
    if (user?.role === "candidate" && !localStorage.getItem("jobera_vip_popup_seen")) {
      setVipOpen(true)
      localStorage.setItem("jobera_vip_popup_seen", "1")
    }
  }, [user])

  const vipPackage = packages?.find((p) => p.tier === "vip")
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Karyeranızı bizimlə qurun, <span className="text-accent">doğru istedadı</span> saniyələr içində tapın.
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Jobera.az Azərbaycanın ən müasir iş platformasıdır. Süni intellekt və səmərəli filtrlər ilə 
            iş axtarışını və işəqəbul prosesini sadələşdirin.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/jobs">
              <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 h-14 px-8 text-lg">
                <Search className="mr-2 h-5 w-5" /> İş Axtarın
              </Button>
            </Link>
            <Link href="/candidates">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-white/15 text-white border border-white/40 hover:bg-white/25 hover:text-white">
                <Users className="mr-2 h-5 w-5" /> Namizəd Tapın
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x border-border">
            <div className="py-4">
              <div className="text-4xl font-bold text-primary mb-2">{formatStat(stats?.activeJobs)}</div>
              <div className="text-muted-foreground font-medium">Aktiv Vakansiya</div>
            </div>
            <div className="py-4">
              <div className="text-4xl font-bold text-primary mb-2">{formatStat(stats?.totalCandidates)}</div>
              <div className="text-muted-foreground font-medium">Namizəd</div>
            </div>
            <div className="py-4">
              <div className="text-4xl font-bold text-primary mb-2">{formatStat(stats?.totalCompanies)}</div>
              <div className="text-muted-foreground font-medium">Şirkət</div>
            </div>
          </div>
        </div>
      </section>

      {/* VIP TOP candidates */}
      {topCandidates && topCandidates.length > 0 && (
        <section className="py-16 bg-card border-b">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">VIP TOP Namizədlər</h2>
                <p className="text-muted-foreground mt-1">Ən yüksək reytinqli və VIP abunəlikli namizədlər</p>
              </div>
              <Link href="/candidates"><Button variant="outline">Hamısına bax</Button></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCandidates.map((c) => (
                <Link key={c.id} href={`/candidates/${c.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={c.avatarUrl || undefined} />
                        <AvatarFallback>{c.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{c.fullName}</div>
                        <div className="text-sm text-muted-foreground truncate">{c.title || c.category}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="h-5 text-[10px] bg-accent text-accent-foreground">VIP</Badge>
                          {(c.averageRating ?? 0) > 0 && (
                            <span className="text-xs flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" />{c.averageRating?.toFixed(1)}</span>
                          )}
                          {c.city && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.city}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Value Props */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Niyə Jobera.az?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Biz işəgötürən və işaxtaranlar arasında ən sürətli, şəffaf və effektiv əlaqəni qururuq.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-8 rounded-2xl shadow-sm border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sürətli axtarış</h3>
              <p className="text-muted-foreground">Saniyələr içində istədiyiniz vakansiyanı və ya namizədi tapın. Mürəkkəb filtrlərlə vaxtınıza qənaət edin.</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl shadow-sm border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Təhlükəsiz və Şəffaf</h3>
              <p className="text-muted-foreground">VIP namizədlər, dəqiqləşdirilmiş profillər və təsdiqlənmiş şirkətlərlə etibarlı bir mühit.</p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-sm border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Şirkətlər üçün HR Paneli</h3>
              <p className="text-muted-foreground">Bütün vakansiyalarınızı və müraciətləri bir pəncərədən asanlıqla idarə edin. Analitika ilə qərarlar verin.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Necə işləyir?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">3 sadə addımda işinizi tapın və ya ideal namizədinizə çatın.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Qeydiyyatdan Keçin", desc: "Namizəd və ya HR kimi pulsuz qeydiyyatdan keçin." },
              { step: "02", title: "Profil Yaradın", desc: "Namizəd profilinizi doldurun və ya şirkəti qeydə alın, vakansiya əlavə edin." },
              { step: "03", title: "Uyğun Tərəf Tapın", desc: "Filtrlər vasitəsilə axtarın, müraciət göndərin, əlaqə saxlayın." },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages teaser */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Abunəlik Paketləri</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Namizəd kimi profilinizi öne çıxarın. HR-lara kontaktlarınızı açın.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {(packages && packages.length > 0 ? packages.slice(0, 3) : [
              { id: 0, name: "Standart", description: "Pulsuz profil", price: 0, tier: "free" },
              { id: 1, name: "VIP", description: "TOP sırada görünür", price: 29, tier: "vip" },
              { id: 2, name: "Müddətli", description: "Kontakt açılması", price: 9, tier: "time_1day" },
            ]).map((pkg, i) => (
              <div key={pkg.id ?? i} className={`bg-card rounded-2xl border p-6 text-center ${pkg.tier === 'vip' ? 'border-accent shadow-md ring-1 ring-accent' : ''}`}>
                {pkg.tier === 'vip' && <div className="text-xs font-bold text-accent mb-2 uppercase tracking-wider">Ən Populyar</div>}
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{pkg.description ?? ""}</p>
                <div className="text-lg font-semibold text-primary">
                  {pkg.price === 0 ? "Pulsuz" : `${pkg.price} AZN`}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/auth/register">
              <Button size="lg" variant="outline">Qeydiyyat ilə başlayın</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-24 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Karyeranızın növbəti addımını atmağa hazırsınız?</h2>
          <p className="text-primary-foreground/80 mb-10 max-w-xl mx-auto">
            İndi qeydiyyatdan keçin və minlərlə fürsətə çıxış əldə edin. Platformamız həm namizədlər həm də şirkətlər üçün ödənişsiz sınaq imkanı təqdim edir.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-14 px-8 text-lg font-bold">
              İndi Qoşulun <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Dialog open={vipOpen} onOpenChange={setVipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>VIP Reytinq Paketi</DialogTitle>
            <DialogDescription>
              Profilinizi TOP sırada göstərin və bütün HR-lara kontaktlarınızı blursuz təqdim edin.
              {vipPackage ? ` Yalnız ${vipPackage.price} ${vipPackage.currency}/ay.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVipOpen(false)}>Sonra</Button>
            <Link href={vipPackage ? `/dashboard/candidate/checkout?packageId=${vipPackage.id}` : "/dashboard/candidate/subscriptions"}>
              <Button onClick={() => setVipOpen(false)}>VIP-ə keç</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
