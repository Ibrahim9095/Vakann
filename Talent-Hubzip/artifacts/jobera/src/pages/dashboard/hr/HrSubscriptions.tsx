import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  listHrPackages,
  getCompanySubscription,
  createPayment,
  confirmPayment,
  type Package,
} from "@/lib/api";
import { toast } from "sonner";
import { Star, Video } from "lucide-react";

export default function HrSubscriptions() {
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState<number | null>(null);

  const { data: packages } = useQuery({
    queryKey: ["hr-packages"],
    queryFn: listHrPackages,
  });

  const { data: subInfo, isLoading } = useQuery({
    queryKey: ["company-subscription"],
    queryFn: getCompanySubscription,
  });

  const checkout = useMutation({
    mutationFn: async (pkg: Package) => {
      setPayingId(pkg.id);
      const payment = await createPayment(pkg.id, undefined, subInfo?.company.id);
      await confirmPayment(payment.id);
    },
    onSuccess: () => {
      toast.success("HR paketi aktivləşdirildi");
      void queryClient.invalidateQueries({ queryKey: ["company-subscription"] });
      setPayingId(null);
    },
    onError: () => {
      toast.error("Ödəniş uğursuz oldu");
      setPayingId(null);
    },
  });

  const quota = subInfo?.quota;
  const usagePct = quota
    ? Math.min(100, (quota.mediaViewsUsed / Math.max(quota.mediaViewLimit, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">HR Premium Abunəlik</h1>
        <p className="text-muted-foreground mt-1">Səsli/videolu CV baxış limitinizi artırın</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Yüklənir...</p>
      ) : quota && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5" /> Media baxış limiti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>İstifadə: {quota.mediaViewsUsed} / {quota.mediaViewLimit >= 999999 ? "∞" : quota.mediaViewLimit}</span>
              <Badge variant="outline">{quota.tier}</Badge>
            </div>
            <Progress value={usagePct} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(packages ?? []).map((pkg) => (
          <Card key={pkg.id} className={pkg.tier === "hr_premium" ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {pkg.tier === "hr_premium" && <Star className="h-4 w-4 text-primary" />}
                {pkg.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{pkg.description}</p>
              <p className="text-2xl font-bold">{pkg.price === 0 ? "Pulsuz" : `${pkg.price} AZN`}</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {pkg.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {pkg.price > 0 && (
                <Button
                  className="w-full"
                  disabled={checkout.isPending}
                  onClick={() => checkout.mutate(pkg)}
                >
                  {payingId === pkg.id ? "Emal olunur..." : "Aktivləşdir"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
