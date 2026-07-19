import { useRoute } from "wouter"
import { useGetCandidate, useCreateContactRequest } from "@workspace/api-client-react"
import { getGetCandidateQueryKey } from "@workspace/api-client-react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Briefcase, GraduationCap, Mail, Phone, Lock, Unlock, AlertTriangle, Languages, ChevronLeft, Star, FileText, Play } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Link } from "wouter"
import { useState, useEffect } from "react"
import { recordMediaView, listCandidateRatings } from "@/lib/api"
import { toast } from "sonner"

export default function CandidateDetail() {
  const [, params] = useRoute("/candidates/:id")
  const candidateId = params?.id ? parseInt(params.id, 10) : 0
  const { user } = useAuth()
  
  const [message, setMessage] = useState("")
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isContactRequested, setIsContactRequested] = useState(false)
  const [mediaBlocked, setMediaBlocked] = useState(false)
  const [mediaUnlocked, setMediaUnlocked] = useState(false)
  const [ratings, setRatings] = useState<Array<{ id: number; stars: number; comment: string | null; company?: { name: string } | null }>>([])

  const tryMediaView = async (mediaType: "voice" | "video") => {
    if (!isHr || mediaUnlocked) return true
    try {
      await recordMediaView(candidateId, mediaType)
      setMediaUnlocked(true)
      return true
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e.status === 402) {
        setMediaBlocked(true)
        toast.error("Media baxış limitiniz dolub. HR Premium paketinə keçin.")
      }
      return false
    }
  }

  const { data: candidate, isLoading } = useGetCandidate(candidateId, {
    query: {
      enabled: !!candidateId,
      queryKey: getGetCandidateQueryKey(candidateId),
    }
  })

  useEffect(() => {
    if (!candidateId) return
    listCandidateRatings(candidateId).then(setRatings).catch(() => setRatings([]))
  }, [candidateId])

  const requestMutation = useCreateContactRequest()

  const handleContactRequest = () => {
    if (!candidate) return
    requestMutation.mutate({ data: { candidateId: candidate.id, message } }, {
      onSuccess: () => {
        setIsContactRequested(true)
        setIsContactModalOpen(false)
      }
    })
  }

  if (isLoading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Yüklənir...</div>
  if (!candidate) return <div className="container mx-auto px-4 py-16 text-center text-destructive">Namizəd tapılmadı.</div>

  const isHr = user?.role === 'hr'
  const canView = (candidate as { canViewContact?: boolean }).canViewContact ?? !candidate.isContactBlurred
  const contactEmail = (candidate as { contactEmail?: string | null }).contactEmail
  const contactPhone = (candidate as { contactPhone?: string | null }).contactPhone
  const isBlurred = !canView

  return (
    <div className="bg-muted/20 min-h-[calc(100vh-4rem)]">
      {/* Header Profile Card */}
      <div className="bg-card border-b relative">
        {candidate.subscriptionTier === 'vip' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-yellow-300 to-accent" />
        )}
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <Link href="/candidates" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" /> Namizədlərə qayıt
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={candidate.avatarUrl || undefined} className={isBlurred ? 'blur-md' : ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
                  {candidate.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className={`text-3xl font-bold tracking-tight mb-2 ${isBlurred ? 'blur-md select-none text-muted-foreground' : 'text-foreground'}`}>
                  {candidate.fullName}
                </h1>
                <div className="text-xl text-primary font-medium">{candidate.title || candidate.category}</div>
                {candidate.subscriptionTier === 'vip' && (
                  <Badge className="mt-2 bg-accent text-accent-foreground hover:bg-accent font-bold">VIP Namizəd</Badge>
                )}
                {(candidate.averageRating ?? 0) > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    {candidate.averageRating?.toFixed(1)} ({candidate.totalRatings} reytinq)
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-6 md:mt-0">
              {isHr ? (
                isContactRequested ? (
                  <Button disabled className="w-full md:w-auto" variant="outline"><Unlock className="mr-2 h-4 w-4" /> Müsahibə dəvəti göndərilib</Button>
                ) : (
                  <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full md:w-auto shadow-sm">
                        {isBlurred ? <><Lock className="mr-2 h-4 w-4" /> Müsahibəyə dəvət et</> : <><Mail className="mr-2 h-4 w-4" /> Müsahibəyə dəvət et</>}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Müsahibəyə dəvət et</DialogTitle>
                        <DialogDescription>
                          Namizədi müsahibəyə dəvət edin. Namizədə SMS/Telegram bildirişi göndəriləcək və kontaktlarını aktivləşdirməsi tələb olunacaq.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <label className="block text-sm font-medium mb-2">Mesajınız (İstəyə bağlı)</label>
                        <Textarea 
                          placeholder="Sizi hansı vakansiya ilə bağlı narahat etdiyinizi bildirin..." 
                          className="min-h-[100px]"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsContactModalOpen(false)}>Ləğv et</Button>
                        <Button onClick={handleContactRequest} disabled={requestMutation.isPending}>
                          {requestMutation.isPending ? "Göndərilir..." : "Müsahibəyə dəvət et"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )
              ) : !user ? (
                <Link href="/auth/login">
                  <Button size="lg" className="w-full md:w-auto">Əlaqə üçün HR kimi daxil ol</Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {isBlurred && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8 flex items-start gap-3">
            <Lock className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-destructive">Gizli Profil</h4>
              <p className="text-sm text-destructive/80 mt-1">Bu namizəd əlaqə məlumatlarının ancaq onun qəbul etdiyi şirkətlərə göstərilməsini seçib. "Kontaktı göstər" düyməsi ilə sorğu göndərin.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <Card className="border-transparent shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-foreground">Haqqında</h3>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {candidate.summary || "Məlumat daxil edilməyib."}
                </p>
              </CardContent>
            </Card>

            {(candidate.skills && candidate.skills.length > 0) && (
              <Card className="border-transparent shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Bacarıqlar</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1 text-sm">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

             {(candidate.languages && candidate.languages.length > 0) && (
              <Card className="border-transparent shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                    <Languages className="h-5 w-5" /> Dillər
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline" className="px-3 py-1 text-sm">{lang}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {canView && (candidate.videoIntroUrl || candidate.voiceIntroUrl || candidate.cvUrl) && (
              <Card className="border-transparent shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Play className="h-5 w-5" /> Media və CV
                  </h3>
                  {mediaBlocked && isHr && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
                      Media baxış limitiniz dolub.{" "}
                      <Link href="/dashboard/hr/subscriptions" className="text-primary font-medium underline">
                        HR Premium
                      </Link>{" "}
                      paketinə keçin.
                    </div>
                  )}
                  {candidate.videoIntroUrl && !mediaBlocked && (
                    <video
                      controls
                      className="w-full rounded-lg max-h-80"
                      src={candidate.videoIntroUrl}
                      onPlay={() => { void tryMediaView("video") }}
                    />
                  )}
                  {candidate.voiceIntroUrl && !mediaBlocked && (
                    <audio
                      controls
                      className="w-full"
                      src={candidate.voiceIntroUrl}
                      onPlay={() => { void tryMediaView("voice") }}
                    />
                  )}
                  {candidate.cvUrl && (
                    <a href={candidate.cvUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <FileText className="h-4 w-4" /> CV-yə bax / yüklə
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-transparent shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Şəxsi məlumatlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Ərazi</div>
                    <div className="text-sm text-muted-foreground">
                      {candidate.city || "Qeyd edilməyib"}
                      {candidate.district ? `, ${candidate.district}` : ""}
                      {candidate.metroStation ? ` (${candidate.metroStation} m.)` : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Təcrübə</div>
                    <div className="text-sm text-muted-foreground">
                      {candidate.experienceYears !== undefined && candidate.experienceYears !== null ? `${candidate.experienceYears} il` : "Qeyd edilməyib"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Təhsil</div>
                    <div className="text-sm text-muted-foreground">{candidate.education || "Qeyd edilməyib"}</div>
                  </div>
                </div>

                {candidate.salaryExpectation && (
                  <div className="flex items-start gap-3 pt-4 border-t">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">₼</div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Əmək haqqı gözləntisi</div>
                      <div className="text-lg text-primary font-semibold">
                        {formatCurrency(candidate.salaryExpectation, candidate.currency)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-transparent shadow-sm bg-muted/50">
               <CardHeader className="pb-4">
                <CardTitle className="text-lg">Əlaqə</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isBlurred ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Lock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Əlaqə məlumatları gizlidir. Görmək üçün sorğu göndərin.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>{contactEmail || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{contactPhone || "—"}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {(candidate.hasDisabilityStatus || candidate.hasMedicalRestriction || candidate.hasFinancialIssues) && (
              <Card className="border-transparent shadow-sm border-l-4 border-l-warning bg-warning/5">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Xüsusi Qeydlər</h4>
                  {candidate.hasDisabilityStatus && <div className="text-xs">✅ Əlillik kvotasına uyğundur</div>}
                  {candidate.hasMedicalRestriction && <div className="text-xs">✅ Tibbi məhdudiyyətləri var</div>}
                  {candidate.hasFinancialIssues && <div className="text-xs">✅ Maliyyə arayışı çətinliyi ola bilər</div>}
                </CardContent>
              </Card>
            )}

            {ratings.length > 0 && (
              <Card className="border-transparent shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">HR Rəyləri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ratings.map((r) => (
                    <div key={r.id} className="text-sm border-b pb-2 last:border-0">
                      <div className="font-medium">{r.company?.name ?? "HR"} — {"★".repeat(r.stars)}</div>
                      {r.comment && <p className="text-muted-foreground mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
