import { useState, useEffect } from "react"
import { useCreateCompany, useUpdateCompany } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { BadgeCheck } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

type FormData = {
  name: string; logoUrl: string; sector: string; city: string;
  address: string; website: string; contactEmail: string;
  contactPhone: string; employeeCount: string; description: string;
}

const EMPTY: FormData = {
  name: "", logoUrl: "", sector: "", city: "", address: "",
  website: "", contactEmail: "", contactPhone: "", employeeCount: "", description: "",
}

export default function CompanyProfile() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<FormData>(EMPTY)
  const [existingId, setExistingId] = useState<number | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isError, setIsError] = useState(false)

  const createMutation = useCreateCompany()
  const updateMutation = useUpdateCompany()

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "")

  useEffect(() => {
    const token = localStorage.getItem("jobera_token")
    if (!token) return
    fetch(`${BASE}/api/companies/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async r => {
      if (r.status === 404) return
      if (!r.ok) return
      const data = await r.json()
      setExistingId(data.id)
      setIsVerified(data.isVerified ?? false)
      setFormData({
        name: data.name || "",
        logoUrl: data.logoUrl || "",
        sector: data.sector || "",
        city: data.city || "",
        address: data.address || "",
        website: data.website || "",
        contactEmail: data.contactEmail || "",
        contactPhone: data.contactPhone || "",
        employeeCount: data.employeeCount || "",
        description: data.description || "",
      })
    }).catch(() => {})
  }, [])

  const set = (k: keyof FormData, v: string) => setFormData(prev => ({ ...prev, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)
    setIsError(false)
    const opts = {
      onSuccess: (data: any) => {
        setExistingId(data.id)
        setIsVerified(data.isVerified ?? false)
        setSaved(true)
        queryClient.invalidateQueries()
      },
      onError: () => setIsError(true)
    }
    if (existingId) {
      updateMutation.mutate({ id: existingId, data: formData }, opts)
    } else {
      createMutation.mutate({ data: formData }, opts)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Şirkət Profili</h1>
          <p className="text-muted-foreground mt-1">Namizədlərin sizin haqqınızda görəcəyi məlumatlar.</p>
        </div>
        {isVerified && (
          <Badge className="bg-green-600 text-white gap-1.5 py-1.5 px-3">
            <BadgeCheck className="h-4 w-4" /> Doğrulanmış Şirkət
          </Badge>
        )}
      </div>

      {saved && <Alert><AlertDescription className="text-green-700">✅ Şirkət profili uğurla yadda saxlanıldı!</AlertDescription></Alert>}
      {isError && <Alert variant="destructive"><AlertDescription>Xəta baş verdi. Yenidən cəhd edin.</AlertDescription></Alert>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Əsas Məlumatlar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Şirkət Adı *</Label>
                <Input id="name" value={formData.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sektor / Sənaye</Label>
                <Input id="sector" placeholder="Məs: İT, Maliyyə, Pərakəndə..." value={formData.sector} onChange={(e) => set("sector", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Loqo URL</Label>
                <Input id="logoUrl" placeholder="https://..." value={formData.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeCount">İşçi Sayı</Label>
                <Input id="employeeCount" placeholder="Məs: 50-100" value={formData.employeeCount} onChange={(e) => set("employeeCount", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Şirkət haqqında</Label>
                <Textarea id="description" rows={4} placeholder="Şirkətin fəaliyyəti, dəyərləri..." value={formData.description} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Əlaqə Məlumatları</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Şəhər</Label>
                <Input id="city" value={formData.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dəqiq Ünvan</Label>
                <Input id="address" value={formData.address} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Əlaqə E-poçtu</Label>
                <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Əlaqə Nömrəsi</Label>
                <Input id="contactPhone" value={formData.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Veb Sayt</Label>
                <Input id="website" placeholder="https://..." value={formData.website} onChange={(e) => set("website", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? "Yadda saxlanılır..." : existingId ? "Yenilə" : "Şirkət Yarat"}
          </Button>
        </div>
      </form>
    </div>
  )
}
