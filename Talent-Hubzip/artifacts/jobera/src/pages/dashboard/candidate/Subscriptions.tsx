import { useListPackages, useGetCandidateDashboardSummary, useListContactRequests } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Check, Lock } from "lucide-react"
import { Link } from "wouter"

export default function Subscriptions() {
  const { data: summary } = useGetCandidateDashboardSummary()
  const { data: packagesData, isLoading } = useListPackages()
  const { data: contactRequests } = useListContactRequests()

  const pendingPaymentRequests = contactRequests?.filter(
    (r) => r.status === "accepted_pending_payment",
  ) ?? []

  const isActive = summary?.subscriptionStatus === "active"
  const candidatePackages = packagesData?.filter(
    (p) => !p.tier.startsWith("hr_") && (p as { audience?: string }).audience !== "hr",
  ) ?? []
  const vipPackages = candidatePackages.filter((p) => p.tier === "vip")
  const timePackages = candidatePackages.filter((p) => p.tier.startsWith("time_"))

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abunəlik Paketləri</h1>
        <p className="text-muted-foreground mt-1">
          A-paket VIP abunəlik və ya real HR təklifi sonrası B-paket blur qaldırma.
        </p>
      </div>

      {isActive && (
        <Card className="border-accent bg-accent/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Star className="h-6 w-6 text-accent fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Aktiv Abunəlik</h3>
              {summary?.subscriptionExpiresAt && (
                <p className="text-sm text-muted-foreground">
                  Son tarix: {new Date(summary.subscriptionExpiresAt).toLocaleDateString("az-AZ")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingPaymentRequests.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Ödəniş Gözləyən Sorğular
            </CardTitle>
            <CardDescription>
              HR sorğusunu qəbul etdiniz. Əlaqə məlumatlarınızı açmaq üçün paket seçin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingPaymentRequests.map((req) => (
              <div key={req.id} className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-3">{req.company?.name ?? "Şirkət"} — sorğu #{req.id}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {timePackages.map((pkg) => (
                    <Link
                      key={pkg.id}
                      href={`/checkout?packageId=${pkg.id}&contactRequestId=${req.id}`}
                    >
                      <Button variant="outline" className="w-full">
                        {pkg.name} — {pkg.price} {pkg.currency}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">A-Paket: VIP Reytinq</h2>
        {isLoading ? (
          <div className="text-center py-8">Yüklənir...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vipPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} isVip />
            ))}
          </div>
        )}
      </div>

      {pendingPaymentRequests.length === 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">B-Paket: Müddətli Blur Qaldırma</h2>
          <p className="text-sm text-muted-foreground mb-4">
            B-paketlər yalnız HR əlaqə sorğusunu qəbul etdikdən sonra aktivləşir.
          </p>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Hazırda ödəniş gözləyən sorğu yoxdur.
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function PackageCard({ pkg, isVip }: { pkg: { id: number; name: string; description?: string | null; price: number; currency: string; durationDays: number; features?: string[] }; isVip?: boolean }) {
  return (
    <Card className={`flex flex-col ${isVip ? "border-accent shadow-md relative" : ""}`}>
      {isVip && <div className="absolute top-0 inset-x-0 h-1 bg-accent rounded-t-xl" />}
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {pkg.name}
          {isVip && <Star className="h-5 w-5 text-accent fill-current" />}
        </CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-3xl font-bold">{pkg.price} {pkg.currency}</span>
          {pkg.durationDays > 0 && <span className="text-muted-foreground"> / {pkg.durationDays} gün</span>}
        </div>
        <ul className="space-y-2">
          {pkg.features?.map((feature, i) => (
            <li key={i} className="flex items-center text-sm gap-2">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Link href={`/checkout?packageId=${pkg.id}`} className="w-full">
          <Button className={`w-full ${isVip ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}>
            Ödənişə Keç
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
