import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecommendedJobs } from "@/lib/api";
import { Briefcase, Sparkles } from "lucide-react";

export default function RecommendedJobs() {
  const { data, isLoading } = useQuery({
    queryKey: ["recommended-jobs"],
    queryFn: getRecommendedJobs,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Tövsiyə olunan vakansiyalar
        </h1>
        <p className="text-muted-foreground mt-1">Profilinizə uyğun vakansiyalar (matching alqoritmi)</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Yüklənir...</p>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">{m.job?.title ?? "Vakansiya"}</h3>
                  <div className="flex gap-2 mt-2">
                    {m.job?.category && <Badge variant="outline">{m.job.category}</Badge>}
                    {m.job?.city && <Badge variant="secondary">{m.job.city}</Badge>}
                    <Badge className="bg-primary/10 text-primary border-0">{Math.round(m.score)}% uyğun</Badge>
                  </div>
                </div>
                {m.job && (
                  <Link href={`/jobs/${m.job.id}`}>
                    <Button>Bax</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
            Hələ tövsiyə yoxdur. Profilinizi yeniləyin və ya yeni vakansiyalar gözləyin.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
