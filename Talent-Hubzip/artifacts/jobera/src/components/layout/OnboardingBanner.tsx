import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Building2, UserCircle } from "lucide-react";

const BASE = import.meta.env.PROD
  ? "https://vakann-api.onrender.com"
  : "";

type OnboardingBannerProps =
  | { type: "hr" }
  | { type: "candidate" };

export function OnboardingBanner({ type }: OnboardingBannerProps) {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jobera_token");
    if (!token) {
      setNeedsSetup(false);
      return;
    }

    const endpoint = type === "hr" ? "/api/companies/me" : "/api/candidates/me";
    fetch(`${BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setNeedsSetup(r.status === 404))
      .catch(() => setNeedsSetup(false));
  }, [type]);

  if (needsSetup !== true) return null;

  if (type === "hr") {
    return (
      <Alert className="mb-6 border-primary/30 bg-primary/5">
        <Building2 className="h-4 w-4" />
        <AlertTitle>Şirkət profilinizi tamamlayın</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
          <span>Vakansiya yerləşdirmək üçün əvvəlcə şirkət məlumatlarınızı daxil edin.</span>
          <Link href="/company">
            <Button size="sm">Şirkət profili yarat</Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6 border-primary/30 bg-primary/5">
      <UserCircle className="h-4 w-4" />
      <AlertTitle>Namizəd profilinizi yaradın</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
        <span>İşə müraciət etmək və HR-lar tərəfindən tapılmaq üçün profilinizi doldurun.</span>
        <Link href="/profile">
          <Button size="sm">Profil yarat</Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
