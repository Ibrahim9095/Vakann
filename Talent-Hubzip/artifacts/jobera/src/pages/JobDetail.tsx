import { useRoute } from "wouter"
import { useGetJob, useListApplications } from "@workspace/api-client-react"
import { getGetJobQueryKey } from "@workspace/api-client-react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Building, Clock, Briefcase, ChevronLeft, Link as LinkIcon, CheckCircle2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Link } from "wouter"
import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AudioRecorder } from "@/components/AudioRecorder"
import { applyToJob, uploadFile, apiFetch } from "@/lib/api"
import { toast } from "sonner"

function applyErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "Müraciət uğursuz oldu"
  if (msg.includes("Namizəd profili") || msg.includes("No candidate profile")) return msg
  if (msg.includes("artıq müraciət") || msg.includes("Already applied")) return msg
  if (msg.includes("Voice application") || msg.includes("səs yazısı")) return "Bu vakansiya üçün səs yazısı məcburidir."
  if (msg.includes("Upload failed") || msg.includes("Audio")) return "Səs faylı yüklənə bilmədi. Yenidən cəhd edin."
  return msg
}

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:id")
  const jobId = params?.id ? parseInt(params.id, 10) : 0
  const { user } = useAuth()
  
  const [coverLetter, setCoverLetter] = useState("")
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isApplied, setIsApplied] = useState(false)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [voiceDurationSec, setVoiceDurationSec] = useState(0)
  const [applying, setApplying] = useState(false)

  const { data: job, isLoading } = useGetJob(jobId, {
    query: {
      enabled: !!jobId,
      queryKey: getGetJobQueryKey(jobId),
    }
  })

  const { data: myApplications } = useListApplications(
    { jobId: jobId || undefined },
    { query: { enabled: !!user && user.role === "candidate" && !!jobId } },
  )

  useEffect(() => {
    if (myApplications && myApplications.length > 0) {
      setIsApplied(true)
    }
  }, [myApplications])

  useEffect(() => {
    if (!user || user.role !== "candidate") {
      setHasProfile(null)
      return
    }
    apiFetch("/api/candidates/me")
      .then(() => setHasProfile(true))
      .catch(() => setHasProfile(false))
  }, [user])

  const requiresVoice = Boolean((job as { requiresVoiceIntro?: boolean } | undefined)?.requiresVoiceIntro)
  const voicePrompt = (job as { voicePrompt?: string | null } | undefined)?.voicePrompt

  const handleApply = async () => {
    if (!job) return
    if (hasProfile === false) {
      toast.error("Əvvəlcə namizəd profilinizi yaradın.")
      return
    }
    if (!job.isActive) {
      toast.error("Bu vakansiya hal-hazırda aktiv deyil.")
      return
    }
    if (requiresVoice && !voiceBlob) {
      toast.error("Bu vakansiya üçün səs yazısı məcburidir.")
      return
    }
    setApplying(true)
    try {
      let voiceApplicationUrl: string | undefined
      if (voiceBlob) {
        const file = new File([voiceBlob], "application-voice.webm", { type: "audio/webm" })
        const uploaded = await uploadFile(file, voiceDurationSec)
        voiceApplicationUrl = uploaded.url
      }
      await applyToJob({
        jobId: job.id,
        coverLetter,
        voiceApplicationUrl,
        voiceDurationSec: voiceBlob ? voiceDurationSec : undefined,
      })
      setIsApplied(true)
      setIsApplyModalOpen(false)
      toast.success("Müraciətiniz göndərildi!")
    } catch (e) {
      const message = applyErrorMessage(e)
      if (message.includes("artıq müraciət")) {
        setIsApplied(true)
        setIsApplyModalOpen(false)
      }
      toast.error(message)
    } finally {
      setApplying(false)
    }
  }

  if (isLoading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Yüklənir...</div>
  if (!job) return <div className="container mx-auto px-4 py-16 text-center text-destructive">Vakansiya tapılmadı.</div>

  const isCandidate = user?.role === 'candidate'

  return (
    <div className="bg-muted/20 min-h-[calc(100vh-4rem)]">
      {/* Header Banner */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" /> Vakansiyalara qayıt
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 shrink-0 rounded-xl border bg-background flex items-center justify-center overflow-hidden shadow-sm">
                {job.company?.logoUrl ? (
                  <img src={job.company.logoUrl} alt={job.company.name} className="h-full w-full object-cover" />
                ) : (
                  <Building className="h-10 w-10 text-muted-foreground/50" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                  <Link href={job.company?.id ? `/companies/${job.company.id}` : "#"} className="font-semibold text-primary hover:underline">
                    {job.company?.name}
                  </Link>
                  {job.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.city}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatDate(job.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
              {isCandidate ? (
                isApplied ? (
                  <Button disabled className="w-full md:w-auto bg-green-600 opacity-100"><CheckCircle2 className="mr-2 h-4 w-4" /> Müraciət edilib</Button>
                ) : (
                  <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full md:w-auto font-semibold shadow-sm">Müraciət et</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Müraciət göndər</DialogTitle>
                        <DialogDescription>
                          {job.company?.name} şirkətinin {job.title} vakansiyasına müraciət edirsiniz.
                        </DialogDescription>
                      </DialogHeader>
                      {hasProfile === false && (
                        <Alert variant="destructive">
                          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <span>Müraciət göndərmək üçün əvvəlcə profilinizi yaradın.</span>
                            <Link href="/dashboard/candidate/profile">
                              <Button type="button" size="sm" variant="outline">Profil yarat</Button>
                            </Link>
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="py-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Örtük məktubu (İstəyə bağlı)</label>
                          <Textarea 
                            placeholder="Niyə bu vakansiya üçün uyğun olduğunuzu qısaca qeyd edin..." 
                            className="min-h-[120px]"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                          />
                        </div>
                        {requiresVoice && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Səs yazısı {requiresVoice ? "(məcburi)" : ""}</p>
                            {voicePrompt && <p className="text-xs text-muted-foreground">{voicePrompt}</p>}
                            <AudioRecorder
                              onRecorded={(blob, duration) => {
                                setVoiceBlob(blob)
                                setVoiceDurationSec(duration)
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)}>Ləğv et</Button>
                        <Button
                          type="button"
                          onClick={handleApply}
                          disabled={applying || hasProfile === false}
                        >
                          {applying ? "Göndərilir..." : "Göndər"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )
              ) : !user ? (
                <Link href="/auth/login">
                  <Button size="lg" className="w-full md:w-auto">Müraciət etmək üçün daxil ol</Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <Card className="border-transparent shadow-sm">
              <CardContent className="p-6 prose max-w-none prose-h3:text-xl prose-h3:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground">
                <h3 className="mb-4 text-foreground">İş barədə məlumat</h3>
                <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed mb-8">
                  {job.description || "Məlumat daxil edilməyib."}
                </div>

                <h3 className="mb-4 text-foreground mt-8">Tələblər</h3>
                <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                  {job.requirements || "Tələb daxil edilməyib."}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-transparent shadow-sm bg-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Xülasə</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">İş rejimi</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {job.employmentType && <StatusBadge status={job.employmentType} />}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Ünvan</div>
                    <div className="text-sm text-muted-foreground">{job.address || job.city || "Qeyd edilməyib"}</div>
                  </div>
                </div>

                {(job.salaryMin || job.salaryMax) && (
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">₼</div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Əmək haqqı</div>
                      <div className="text-sm text-primary font-semibold">
                        {job.salaryMin ? formatCurrency(job.salaryMin, job.currency) : ''} 
                        {job.salaryMin && job.salaryMax ? ' - ' : ''} 
                        {job.salaryMax ? formatCurrency(job.salaryMax, job.currency) : ''}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
                  <Badge variant="outline" className="bg-background">{job.category}</Badge>
                </div>
              </CardContent>
            </Card>

            {job.company && (
              <Card className="border-transparent shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Şirkət Haqqında</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 shrink-0 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                        {job.company.logoUrl ? (
                          <img src={job.company.logoUrl} alt={job.company.name} className="h-full w-full object-cover" />
                        ) : (
                          <Building className="h-6 w-6 text-muted-foreground/50" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{job.company.name}</div>
                        {job.company.sector && <div className="text-xs text-muted-foreground">{job.company.sector}</div>}
                      </div>
                  </div>
                  
                  {job.company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.company.description}
                    </p>
                  )}
                  
                  {job.company.website && (
                    <a href={job.company.website} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-primary hover:underline mt-2">
                      <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Veb sayta keçid
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
