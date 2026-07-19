import { useState } from "react"
import { useCreateRating } from "@workspace/api-client-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"

type Props = {
  candidateId: number
  candidateName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RatingDialog({ candidateId, candidateName, open, onOpenChange, onSuccess }: Props) {
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState("")
  const ratingMutation = useCreateRating()

  const handleSubmit = () => {
    ratingMutation.mutate(
      { data: { candidateId, stars, comment: comment || undefined } },
      {
        onSuccess: () => {
          onOpenChange(false)
          setComment("")
          setStars(5)
          onSuccess?.()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reytinq verin</DialogTitle>
          <DialogDescription>
            {candidateName} üçün müsahibə sonrası reytinq və rəy əlavə edin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                className="p-1"
              >
                <Star className={`h-7 w-7 ${n <= stars ? "fill-accent text-accent" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Rəyiniz (istəyə bağlı)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Ləğv et</Button>
          <Button onClick={handleSubmit} disabled={ratingMutation.isPending}>
            {ratingMutation.isPending ? "Göndərilir..." : "Göndər"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
