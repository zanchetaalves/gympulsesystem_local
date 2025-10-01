
export interface User {
  id: string;
  name: string;
  email: string;
  profile: 'Admin' | 'Gerente' | 'Operador';
  active: boolean;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  cpf: string;
  email: string | null;
  phone: string;
  address: string;
  birthDate: Date;
  createdAt: Date;
  photoUrl?: string | null;
  observations?: string | null;
}

export interface Subscription {
  id: string;
  clientId: string;
  plan: PlanType; // Tipo do plano (Mensal, Anual, etc) - vem do JOIN
  planId?: string; // ID do plano na tabela plans
  startDate: Date;
  endDate: Date;
  active: boolean;
  locked?: boolean; // Indica se a matrícula está trancada
  lockDays?: number; // Quantidade de dias de trancamento
  client?: Client; // For joined data
}

export interface Payment {
  id: string;
  subscriptionId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'boleto' | 'transferencia';
  confirmed: boolean;
  subscription?: Subscription; // For joined data
  client?: Client; // For joined data
}

export type PlanType = 'Mensal' | 'Trimestral' | 'Quadrimestral' | 'Anual';

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  priceBrl: number;
  description?: string;
  durationMonths: number;
  active: boolean;
  color: string;
}
