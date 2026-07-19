import { useListContactRequests, useUpdateContactRequest } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/utils"
import { Link } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function ContactRequests() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useListContactRequests()
  const cancelMutation = useUpdateContactRequest({
    mutation: {
      onSuccess: () => {
        toast.success("Sorğu ləğv edildi")
        void queryClient.invalidateQueries({ queryKey: ["/contact-requests"] })
      },
      onError: () => toast.error("Ləğv edilə bilmədi"),
    },
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Göndərilən Sorğular</h1>
        <p className="text-muted-foreground mt-1">Namizədlərə göndərdiyiniz əlaqə sorğularının vəziyyəti.</p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map(req => (
            <Card key={req.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Link href={`~/candidates/${req.candidateId}`} className="font-bold text-lg hover:underline text-primary">
                        {req.candidate?.fullName || "Namizəd"}
                      </Link>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">Tarix: {formatDate(req.createdAt)}</p>
                    {req.message && (
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-2 inline-block">M: {req.message}</p>
                    )}
                  </div>
                  {req.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate({ id: req.id, data: { status: "cancelled" } })}
                    >
                      Ləğv et
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Hələ heç bir əlaqə sorğusu göndərməmisiniz.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
