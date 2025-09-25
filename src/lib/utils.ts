
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to Brazilian format: DD/MM/YYYY
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

// Format currency to Brazilian Real: R$ 100,00
export function formatCurrency(value: number | string | any): string {
  // Convert to safe number first
  let numValue: number;

  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    numValue = value;
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.,-]/g, '').replace(',', '.'));
    numValue = !isNaN(parsed) && isFinite(parsed) ? parsed : 0;
  } else {
    numValue = 0;
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
}

// Check if a subscription is about to expire (7 days or less)
export function isAboutToExpire(endDate: Date | string): boolean {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
}

// Calculate age from birthdate
export function calculateAge(birthDate: Date | string | null | undefined): number {
  if (!birthDate) return 0;

  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;

  // Check if date is valid
  if (isNaN(birth.getTime())) return 0;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Format CPF: 123.456.789-00
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "-";

  // Remove non-numeric characters
  const cleanCpf = cpf.replace(/\D/g, '');

  // If not enough digits, return as is
  if (cleanCpf.length !== 11) return cpf;

  // Format as xxx.xxx.xxx-xx
  return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Format phone: (11) 98765-4321
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";

  // Remove non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Check if it's a cell phone (with 9 digits) or landline
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  // Return original if format doesn't match
  return phone;
}
