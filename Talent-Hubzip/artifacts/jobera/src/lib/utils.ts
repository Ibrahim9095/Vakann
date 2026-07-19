import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "AZN") {
  return new Intl.NumberFormat("az-AZ", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString))
}
