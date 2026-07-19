import { useSearch } from "wouter"
import { useState } from "react"
import { useListPackages } from "@workspace/api-client-react"
import { createPayment, confirmPayment } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link, useLocation } from "wouter"
import { CreditCard, Check } from "lucide-react"

export default function Checkout() {
  const search = useSearch()
  const params = new URLSearchParams(search)
  const packageId = params.get("packageId") ? Number(params.get("packageId")) : null
  const contactRequestId = params.get("contactRequestId") ? Number(params.get("contactRequestId")) : undefined
  const [, setLocation] = useLocation()

  const { data: packages, isLoading } = useListPackages()
  const pkg = packages?.find((p) => p.id === packageId)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  const handlePay = async () => {
    if (!packageId) return
    setProcessing(true)
    setError("")
    try {
      const payment = await createPayment(packageId, contactRequestId)
      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl
        return
      }
      await confirmPayment(payment.id)
      setLocation("/subscriptions")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ödəniş uğursuz oldu")
    } finally {
      setProcessing(false)
    }
  }

  if (isLoading) return <div className="p-8 text-center">Yüklənir...</div>

  if (!pkg) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-destructive">Paket tapılmadı.</p>
        <Link href="/subscriptions"><Button variant="outline">Geri</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ödəniş</h1>
        <p className="text-muted-foreground mt-1">Seçilmiş paketi aktivləşdirmək üçün ödənişi tamamlayın.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> {pkg.name}
          </CardTitle>
          <CardDescription>{pkg.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold">{pkg.price} {pkg.currency}</div>
          <ul className="space-y-2">
            {pkg.features?.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" /> {f}
              </li>
            ))}
          </ul>
          {contactRequestId && (
            <p className="text-sm text-muted-foreground border-t pt-3">
              HR sorğusu #{contactRequestId} üçün ödəniş
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {error && <p className="text-sm text-destructive w-full">{error}</p>}
          <Button className="w-full" size="lg" onClick={handlePay} disabled={processing}>
            {processing ? "Ödənilir..." : "Ödənişi Təsdiqlə (Simulyasiya)"}
          </Button>
          <Link href="/subscriptions" className="w-full">
            <Button variant="ghost" className="w-full">Ləğv et</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
