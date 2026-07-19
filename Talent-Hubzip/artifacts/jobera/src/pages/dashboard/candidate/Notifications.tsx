import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listNotifications, markNotificationRead } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Bell } from "lucide-react"

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  })

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6" /> Bildirişlər
        </h1>
        <p className="text-muted-foreground mt-1">Platforma bildirişləriniz.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Yüklənir...</div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-3">
          {data.map((n) => (
            <Card key={n.id} className={n.status === "read" ? "opacity-70" : ""}>
              <CardContent className="p-4 flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-semibold">{n.title}</h3>
                  {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(n.createdAt)}</p>
                </div>
                {n.status !== "read" && (
                  <Button size="sm" variant="outline" onClick={() => readMutation.mutate(n.id)}>
                    Oxundu
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Bildiriş yoxdur.</CardContent></Card>
      )}
    </div>
  )
}
