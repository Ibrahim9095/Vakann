import { Link } from "wouter"
import { useListContactRequests, useUpdateContactRequest, getListContactRequestsQueryKey } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { Check, X } from "lucide-react"

export default function ContactRequests() {
  const { data, isLoading } = useListContactRequests()
  const updateMutation = useUpdateContactRequest()
  const queryClient = useQueryClient()

  const handleAction = (id: number, status: 'accepted' | 'declined') => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListContactRequestsQueryKey() })
      }
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Müsahibə Dəvətləri</h1>
        <p className="text-muted-foreground mt-1">HR-ların sizi müsahibəyə dəvət etdiyi sorğular.</p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map(req => (
            <Card key={req.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg">{req.company?.name || "Şirkət"}</h3>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">Tarix: {formatDate(req.createdAt)}</p>
                    {req.message && (
                      <div className="mt-2 p-3 bg-muted rounded-md text-sm border">
                        <span className="font-semibold block mb-1">Mesaj:</span>
                        {req.message}
                      </div>
                    )}
                    {req.status === 'accepted_pending_payment' && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                        <p className="font-medium text-amber-800 mb-2">Kontaktlarınızı aktivləşdirin</p>
                        <p className="text-amber-700 mb-2">Müsahibə dəvətini qəbul etdiniz. HR sizinlə əlaqə saxlaya bilməsi üçün abunəlik paketi seçin.</p>
                        <Link href={`/checkout?contactRequestId=${req.id}`}>
                          <Button size="sm">Ödəniş paketi seçin</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  {req.status === 'pending' && (
                    <div className="flex gap-2 shrink-0 w-full md:w-auto">
                      <Button 
                        variant="outline" 
                        className="flex-1 md:flex-none border-destructive text-destructive hover:bg-destructive hover:text-white"
                        onClick={() => handleAction(req.id, 'declined')}
                        disabled={updateMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" /> İmtina
                      </Button>
                      <Button 
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAction(req.id, 'accepted')}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" /> Qəbul Et
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Hələ heç bir əlaqə sorğusu yoxdur.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
