import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  type BadgeVariant = "default" | "destructive" | "outline" | "secondary";

  let label = status;
  let variant: BadgeVariant = "secondary";
  let extraClass = "";

  switch (status) {
    case 'pending':
      label = "Gözləyir";
      variant = "outline";
      break;
    case 'reviewed':
      label = "Baxılıb";
      variant = "secondary";
      break;
    case 'shortlisted':
      label = "Seçilib";
      variant = "default";
      extraClass = "bg-blue-600 text-white border-blue-700 hover:bg-blue-700";
      break;
    case 'rejected':
    case 'declined':
      label = status === 'declined' ? "İmtina" : "Rədd edilib";
      variant = "destructive";
      break;
    case 'accepted_pending_payment':
      label = "Ödəniş gözləyir";
      variant = "outline";
      extraClass = "border-amber-500 text-amber-700 bg-amber-50";
      break;
    case 'hired':
    case 'accepted':
      label = status === 'accepted' ? "Qəbul edilib" : "İşə götürülüb";
      variant = "default";
      extraClass = "bg-green-600 text-white border-green-700 hover:bg-green-700";
      break;
    case 'expired':
      label = "Müddəti bitib";
      variant = "outline";
      break;
    case 'active':
      label = "Aktiv";
      variant = "default";
      extraClass = "bg-green-600 text-white border-green-700 hover:bg-green-700";
      break;
    case 'inactive':
      label = "Passiv";
      variant = "outline";
      break;
    case 'full_time':
      label = "Tam iş günü";
      variant = "default";
      break;
    case 'part_time':
      label = "Natamam iş günü";
      variant = "secondary";
      break;
    case 'remote':
      label = "Distant";
      variant = "outline";
      break;
    case 'hybrid':
      label = "Hibrid";
      variant = "secondary";
      break;
    case 'internship':
      label = "Təcrübə";
      variant = "outline";
      extraClass = "border-amber-500 text-amber-700 bg-amber-50";
      break;
    case 'vip':
      label = "VIP";
      return <Badge className={cn("bg-amber-500 text-white border-amber-600 hover:bg-amber-600", className)}>{label}</Badge>;
    case 'time_limited':
      label = "Müvəqqəti";
      return <Badge className={cn("bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200", className)}>{label}</Badge>;
    case 'free':
      label = "Pulsuz";
      variant = "outline";
      break;
    default:
      label = status;
  }

  return <Badge variant={variant} className={cn(extraClass, className)}>{label}</Badge>;
}
