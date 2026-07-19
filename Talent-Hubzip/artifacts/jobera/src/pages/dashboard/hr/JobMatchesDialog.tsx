import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Link } from "wouter";
import { getJobMatches } from "@/lib/api";

export default function JobMatchesDialog({ jobId, jobTitle }: { jobId: number; jobTitle: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["job-matches", jobId],
    queryFn: () => getJobMatches(jobId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Uyğun namizədlər">
          <Users className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uyğun namizədlər — {jobTitle}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Yüklənir...</p>
        ) : data && data.length > 0 ? (
          <ul className="space-y-3">
            {data.map((m) => (
              <li key={m.id} className="flex justify-between items-center border rounded-lg p-3">
                <div>
                  <Link href={`~/candidates/${m.candidateId}`} className="font-medium hover:underline text-primary">
                    {m.candidate?.fullName ?? `Namizəd #${m.candidateId}`}
                  </Link>
                  <p className="text-xs text-muted-foreground">{m.candidate?.title}</p>
                </div>
                <Badge variant="secondary">{Math.round(m.score)}%</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">Hələ uyğun namizəd tapılmayıb.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
