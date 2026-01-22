import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date?: string | Date | null) {
  if (!date) return 'NA';

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'NA';

  if (
    parsedDate.getFullYear() == 1 &&
    parsedDate.getMonth() === 0 &&
    parsedDate.getDate() === 1
  ) {
    return 'NA';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(parsedDate);
};