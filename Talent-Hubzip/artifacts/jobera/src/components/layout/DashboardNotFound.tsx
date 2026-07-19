import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { dashboardPathForRole } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      const dest = dashboardPathForRole(user.role);
      setLocation(dest);
    } else {
      setLocation("/auth/login");
    }
  }, [user, isLoading, setLocation]);

  return null;
}

export function DashboardNotFound({ homeHref }: { homeHref: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-semibold mb-2">Panel səhifəsi tapılmadı</h2>
        <p className="text-sm text-muted-foreground mb-4">Bu bölmə mövcud deyil və ya köçürülüb.</p>
        <Link href={homeHref}>
          <Button variant="outline">Panelə qayıt</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
