import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center bg-muted/20">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">404 — Səhifə tapılmadı</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Axtardığınız səhifə mövcud deyil və ya köçürülüb.
          </p>
          <Link href="/">
            <Button>Ana səhifəyə qayıt</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
