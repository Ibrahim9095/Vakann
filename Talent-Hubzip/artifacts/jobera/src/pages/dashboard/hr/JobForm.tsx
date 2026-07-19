import { useState, useEffect } from "react"
import { useLocation, useRoute } from "wouter"
import {
  useUpdateJob,
  useGetJob,
  getGetJobQueryKey,
  getListJobsQueryKey,
} from "@workspace/api-client-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft } from "lucide-react"
import { Link } from "wouter"
import { type JobInputEmploymentType } from "@workspace/api-client-react"
import { apiFetch, getJobMatchCount } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

export default function JobForm() {
  const [, setLocation] = useLocation()
  const [onNewPage] = useRoute("/jobs/new")
  const [onEditPage, editParams] = useRoute("/jobs/:id/edit")
  const isEdit = Boolean(onEditPage && editParams?.id)
  const jobId = isEdit ? parseInt(editParams!.id, 10) : 0

  const queryClient = useQueryClient()
  const { data: jobData } = useGetJob(jobId, { query: { enabled: isEdit, queryKey: getGetJobQueryKey(jobId) } })
  const updateMutation = useUpdateJob()

  const [hasCompany, setHasCompany] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    category: "it",
    description: "",
    requirements: "",
    city: "",
    address: "",
    employmentType: "full_time" as JobInputEmploymentType,
    salaryMin: "",
    salaryMax: "",
    currency: "AZN",
    requiresVoiceIntro: false,
    voicePrompt: "",
    requiresNearbyLocation: false,
    radiusKm: "5",
    requiresHealthDeclaration: false,
    requiresCreditDeclaration: false,
  })

  useEffect(() => {
    apiFetch<{ id: number }>("/api/companies/me")
      .then(() => setHasCompany(true))
      .catch(() => setHasCompany(false))
  }, [])

  useEffect(() => {
    if (isEdit && jobData) {
      setFormData({
        title: jobData.title,
        category: jobData.category,
        description: jobData.description || "",
        requirements: jobData.requirements || "",
        city: jobData.city || "",
        address: jobData.address || "",
        employmentType: (jobData.employmentType as JobInputEmploymentType) || "full_time",
        salaryMin: jobData.salaryMin ? String(jobData.salaryMin) : "",
        salaryMax: jobData.salaryMax ? String(jobData.salaryMax) : "",
        currency: jobData.currency || "AZN",
        requiresVoiceIntro: Boolean((jobData as { requiresVoiceIntro?: boolean }).requiresVoiceIntro),
        voicePrompt: (jobData as { voicePrompt?: string }).voicePrompt || "",
        requiresNearbyLocation: Boolean((jobData as { requiresNearbyLocation?: boolean }).requiresNearbyLocation),
        radiusKm: String((jobData as { radiusKm?: number }).radiusKm ?? 5),
        requiresHealthDeclaration: Boolean((jobData as { requiresHealthDeclaration?: boolean }).requiresHealthDeclaration),
        requiresCreditDeclaration: Boolean((jobData as { requiresCreditDeclaration?: boolean }).requiresCreditDeclaration),
      })
    }
  }, [jobData, isEdit])

  const buildPayload = () => ({
    ...formData,
    salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
    salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
    radiusKm: formData.requiresNearbyLocation && formData.radiusKm ? Number(formData.radiusKm) : undefined,
    voicePrompt: formData.requiresVoiceIntro ? formData.voicePrompt : undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Vakansiya başlığı mütləqdir")
      return
    }

    if (hasCompany === false) {
      toast.error("Əvvəlcə şirkət profilinizi yaradın")
      return
    }

    const payload = buildPayload()

    if (isEdit) {
      updateMutation.mutate(
        { id: jobId, data: payload as Parameters<typeof updateMutation.mutate>[0]["data"] },
        {
          onSuccess: () => {
            toast.success("Vakansiya yeniləndi")
            queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() })
            setLocation("/jobs")
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Vakansiya yenilənə bilmədi")
          },
        },
      )
      return
    }

    setIsSubmitting(true)
    try {
      const created = await apiFetch<{ id: number }>("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() })
      const match = await getJobMatchCount(created.id)
      toast.success(`Vakansiya yaradıldı! Bazamızda ${match.count} uyğun aktiv namizəd var.`)
      setLocation("/jobs")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vakansiya yaradıla bilmədi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSaving = isSubmitting || (isEdit && updateMutation.isPending)
  const pageTitle = isEdit ? "Vakansiyanı Yenilə" : onNewPage ? "Yeni Vakansiya" : "Vakansiya"

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-32">
      <div>
        <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" /> Geri qayıt
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
      </div>

      {hasCompany === false && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span>Vakansiya yerləşdirmək üçün əvvəlcə şirkət profilinizi tamamlayın.</span>
            <Link href="/company">
              <Button size="sm" variant="outline">Şirkət profili</Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Əsas Məlumatlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Vakansiya Başlığı *</Label>
                <Input 
                  id="title" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Məs: Senior Frontend Developer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kateqoriya</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">İnformasiya Texnologiyaları</SelectItem>
                    <SelectItem value="marketing">Marketinq</SelectItem>
                    <SelectItem value="finance">Maliyyə</SelectItem>
                    <SelectItem value="sales">Satış</SelectItem>
                    <SelectItem value="design">Dizayn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">İş Rejimi</Label>
                <Select value={formData.employmentType} onValueChange={(v: JobInputEmploymentType) => setFormData({...formData, employmentType: v})}>
                  <SelectTrigger id="employmentType">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Tam iş günü</SelectItem>
                    <SelectItem value="part_time">Natamam iş günü</SelectItem>
                    <SelectItem value="remote">Distant (Remote)</SelectItem>
                    <SelectItem value="hybrid">Hibrid</SelectItem>
                    <SelectItem value="internship">Təcrübə</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">İş barədə məlumat</Label>
              <Textarea 
                id="description" 
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Tələblər</Label>
              <Textarea 
                id="requirements" 
                rows={6}
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vakansiya Filtrləri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="requiresVoiceIntro">Səs tələb olunsun</Label>
              <Switch id="requiresVoiceIntro" checked={formData.requiresVoiceIntro}
                onCheckedChange={(v) => setFormData({ ...formData, requiresVoiceIntro: v })} />
            </div>
            {formData.requiresVoiceIntro && (
              <Textarea placeholder="Məs: İngiliscə özünüzü təqdim edin"
                value={formData.voicePrompt}
                onChange={(e) => setFormData({ ...formData, voicePrompt: e.target.value })} />
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="requiresNearbyLocation">Yaxın ərazi filtri</Label>
              <Switch id="requiresNearbyLocation" checked={formData.requiresNearbyLocation}
                onCheckedChange={(v) => setFormData({ ...formData, requiresNearbyLocation: v })} />
            </div>
            {formData.requiresNearbyLocation && (
              <Input type="number" placeholder="Radius (km)" value={formData.radiusKm}
                onChange={(e) => setFormData({ ...formData, radiusKm: e.target.value })} />
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="requiresHealthDeclaration">Sağlamlıq bəyannaməsi</Label>
              <Switch id="requiresHealthDeclaration" checked={formData.requiresHealthDeclaration}
                onCheckedChange={(v) => setFormData({ ...formData, requiresHealthDeclaration: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="requiresCreditDeclaration">Kredit bəyannaməsi</Label>
              <Switch id="requiresCreditDeclaration" checked={formData.requiresCreditDeclaration}
                onCheckedChange={(v) => setFormData({ ...formData, requiresCreditDeclaration: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ünvan və Əmək haqqı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Şəhər</Label>
                <Input 
                  id="city" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dəqiq ünvan</Label>
                <Input 
                  id="address" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Minimum Əmək haqqı</Label>
                <Input 
                  id="salaryMin" 
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData({...formData, salaryMin: e.target.value})}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="salaryMax">Maksimum Əmək haqqı</Label>
                <Input 
                  id="salaryMax" 
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({...formData, salaryMax: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-0 z-20 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t">
          <div className="flex justify-end gap-4 max-w-4xl mx-auto">
            <Button type="button" variant="outline" onClick={() => setLocation("/jobs")}>Ləğv et</Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSaving || hasCompany === false}
            >
              {isSaving ? "Saxlanılır..." : "Yadda Saxla"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
