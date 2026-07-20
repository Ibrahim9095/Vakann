import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useUpdateCandidate, useCreateCandidate } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BAKU_DISTRICTS, BAKU_METRO_STATIONS } from "@/lib/baku-locations"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { uploadFile } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

const CATEGORIES = [
  { value: "it", label: "İnformasiya Texnologiyaları" },
  { value: "marketing", label: "Marketinq" },
  { value: "finance", label: "Maliyyə" },
  { value: "sales", label: "Satış" },
  { value: "design", label: "Dizayn" },
  { value: "hr", label: "HR / Kadrlar" },
  { value: "logistics", label: "Logistika" },
  { value: "legal", label: "Hüquq" },
  { value: "education", label: "Təhsil" },
  { value: "other", label: "Digər" },
]

type ProfileData = {
  fullName: string; title: string; category: string; summary: string;
  city: string; district: string; metroStation: string; salaryExpectation: string;
  experienceYears: string; education: string; skills: string; languages: string;
  cvUrl: string; voiceIntroUrl: string; videoIntroUrl: string;
  contactEmail: string; contactPhone: string;
  isContactBlurred: boolean; hasDisabilityStatus: boolean;
  hasMedicalRestriction: boolean; hasFinancialIssues: boolean;
}

const EMPTY: ProfileData = {
  fullName: "", title: "", category: "it", summary: "",
  city: "", district: "", metroStation: "", salaryExpectation: "",
  experienceYears: "", education: "", skills: "", languages: "",
  cvUrl: "", voiceIntroUrl: "", videoIntroUrl: "",
  contactEmail: "", contactPhone: "",
  isContactBlurred: true, hasDisabilityStatus: false,
  hasMedicalRestriction: false, hasFinancialIssues: false,
}

export default function ProfileEditor() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<ProfileData>({ ...EMPTY, fullName: user?.fullName || "" })
  const [existingId, setExistingId] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const createMutation = useCreateCandidate()
  const updateMutation = useUpdateCandidate()

  const BASE = import.meta.env.PROD
  ? "https://vakann-api.onrender.com"
  : "";

  useEffect(() => {
    const token = localStorage.getItem("jobera_token")
    if (!token) return
    fetch(`${BASE}/api/candidates/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async r => {
      if (r.status === 404) return // no profile yet
      if (!r.ok) { setLoadError("Profil yüklənmədi"); return }
      const data = await r.json()
      setExistingId(data.id)
      if (data.adminNote) setAdminNote(data.adminNote)
      setFormData({
        fullName: data.fullName || "",
        title: data.title || "",
        category: data.category || "it",
        summary: data.summary || "",
        city: data.city || "",
        district: data.district || "",
        metroStation: data.metroStation || "",
        salaryExpectation: data.salaryExpectation != null ? String(data.salaryExpectation) : "",
        experienceYears: data.experienceYears != null ? String(data.experienceYears) : "",
        education: data.education || "",
        skills: (data.skills || []).join(", "),
        languages: (data.languages || []).join(", "),
        cvUrl: data.cvUrl || "",
        voiceIntroUrl: data.voiceIntroUrl || "",
        videoIntroUrl: data.videoIntroUrl || "",
        contactEmail: data.contactEmail || "",
        contactPhone: data.contactPhone || "",
        isContactBlurred: data.isContactBlurred ?? true,
        hasDisabilityStatus: data.hasDisabilityStatus ?? false,
        hasMedicalRestriction: data.hasMedicalRestriction ?? false,
        hasFinancialIssues: data.hasFinancialIssues ?? false,
      })
    }).catch(() => setLoadError("Profil yüklənərkən xəta"))
  }, [])

  const set = (k: keyof ProfileData, v: unknown) => setFormData(prev => ({ ...prev, [k]: v }))

  const handleFileUpload = async (field: "cvUrl" | "voiceIntroUrl" | "videoIntroUrl", file: File) => {
    try {
      const { url } = await uploadFile(file)
      const fullUrl = url.startsWith("http") ? url : `${BASE}${url}`
      set(field, fullUrl)
    } catch {
      setLoadError("Fayl yüklənmədi")
    }
  }

  const payload = () => ({
    ...formData,
    salaryExpectation: formData.salaryExpectation ? Number(formData.salaryExpectation) : undefined,
    experienceYears: formData.experienceYears ? Number(formData.experienceYears) : undefined,
    skills: formData.skills ? formData.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
    languages: formData.languages ? formData.languages.split(",").map(s => s.trim()).filter(Boolean) : [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)
    if (existingId) {
      updateMutation.mutate({ id: existingId, data: payload() }, {
        onSuccess: () => { setSaved(true); queryClient.invalidateQueries() }
      })
    } else {
      createMutation.mutate({ data: payload() }, {
        onSuccess: (data: any) => { setExistingId(data.id); setSaved(true); queryClient.invalidateQueries() }
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isError = createMutation.isError || updateMutation.isError

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profilim</h1>
        <p className="text-muted-foreground mt-1">Məlumatlarınızı yeniləyərək daha çox işəgötürənin diqqətini çəkin.</p>
      </div>

      {adminNote && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Admin tərəfindən dayandırıldı:</strong> {adminNote}
          </AlertDescription>
        </Alert>
      )}

      {loadError && <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>}
      {saved && <Alert><AlertDescription className="text-green-700">✅ Profil uğurla yadda saxlanıldı!</AlertDescription></Alert>}
      {isError && <Alert variant="destructive"><AlertDescription>Xəta baş verdi. Yenidən cəhd edin.</AlertDescription></Alert>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Əsas Məlumatlar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad, Soyad</Label>
                <Input id="fullName" value={formData.fullName} onChange={(e) => set("fullName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Vəzifə Başlığı</Label>
                <Input id="title" placeholder="Məs: Senior Frontend Developer" value={formData.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kateqoriya</Label>
                <Select value={formData.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceYears">Təcrübə (il)</Label>
                <Input id="experienceYears" type="number" min="0" value={formData.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="summary">Haqqımda</Label>
                <Textarea id="summary" rows={4} placeholder="Özünüz haqqında qısa məlumat..." value={formData.summary} onChange={(e) => set("summary", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Yer / Ünvan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Şəhər</Label>
                <Input id="city" value={formData.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Rayon</Label>
                <Select value={formData.district || "none"} onValueChange={(v) => set("district", v === "none" ? "" : v)}>
                  <SelectTrigger id="district"><SelectValue placeholder="Rayon seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seçilməyib</SelectItem>
                    {BAKU_DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metroStation">Metro Stansiyası</Label>
                <Select value={formData.metroStation || "none"} onValueChange={(v) => set("metroStation", v === "none" ? "" : v)}>
                  <SelectTrigger id="metroStation"><SelectValue placeholder="Metro seçin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seçilməyib</SelectItem>
                    {BAKU_METRO_STATIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Peşəkar Məlumatlar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="education">Təhsil</Label>
                <Input id="education" placeholder="Məs: Bakı Dövlət Universiteti, İqtisadiyyat" value={formData.education} onChange={(e) => set("education", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryExpectation">Gözlənilən Maaş (AZN)</Label>
                <Input id="salaryExpectation" type="number" min="0" value={formData.salaryExpectation} onChange={(e) => set("salaryExpectation", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Bacarıqlar (vergüllə ayırın)</Label>
                <Input id="skills" placeholder="Məs: React, TypeScript, Node.js" value={formData.skills} onChange={(e) => set("skills", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">Dillər (vergüllə ayırın)</Label>
                <Input id="languages" placeholder="Məs: Azərbaycanca, İngilis dili, Rus dili" value={formData.languages} onChange={(e) => set("languages", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Əlaqə Məlumatları</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">E-poçt</Label>
              <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefon</Label>
              <Input id="contactPhone" placeholder="+994..." value={formData.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fayl Keçidləri</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cvUrl">CV</Label>
                <Input id="cvUrl" placeholder="https://..." value={formData.cvUrl} onChange={(e) => set("cvUrl", e.target.value)} />
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && handleFileUpload("cvUrl", e.target.files[0])} className="text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voiceIntroUrl">Səsli Təqdimat</Label>
                <Input id="voiceIntroUrl" placeholder="https://..." value={formData.voiceIntroUrl} onChange={(e) => set("voiceIntroUrl", e.target.value)} />
                <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && handleFileUpload("voiceIntroUrl", e.target.files[0])} className="text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoIntroUrl">Video Təqdimat</Label>
                <Input id="videoIntroUrl" placeholder="https://..." value={formData.videoIntroUrl} onChange={(e) => set("videoIntroUrl", e.target.value)} />
                <input type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && handleFileUpload("videoIntroUrl", e.target.files[0])} className="text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Gizlilik və Xüsusi Statuslar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-sm">Əlaqə Məlumatlarını Gizlə</p>
                <p className="text-xs text-muted-foreground">Aktiv olduqda ad və əlaqəniz HR-lardan gizli saxlanılır</p>
              </div>
              <Switch checked={formData.isContactBlurred} onCheckedChange={(v) => set("isContactBlurred", v)} />
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-sm">Əlillik Kvotasına Uyğunam</p>
                <p className="text-xs text-muted-foreground">Əlillik statusu olan işçilər üçün vakansiyalarda üstünlük</p>
              </div>
              <Switch checked={formData.hasDisabilityStatus} onCheckedChange={(v) => set("hasDisabilityStatus", v)} />
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-sm">Tibbi Məhdudiyyətim Var</p>
              </div>
              <Switch checked={formData.hasMedicalRestriction} onCheckedChange={(v) => set("hasMedicalRestriction", v)} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Maliyyə Arayışı Çətinliyi Ola Bilər</p>
                <p className="text-xs text-muted-foreground">HR-lar bu məlumatı nəzərə alaraq daha ədalətli qiymətləndirə bilər</p>
              </div>
              <Switch checked={formData.hasFinancialIssues} onCheckedChange={(v) => set("hasFinancialIssues", v)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? "Yadda saxlanılır..." : existingId ? "Yenilə" : "Profil Yarat"}
          </Button>
        </div>
      </form>
    </div>
  )
}
