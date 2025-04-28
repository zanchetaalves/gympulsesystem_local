
import { User, Client, Subscription, Payment, Plan } from "@/types";

// Mock data for testing purposes
export const plans: Record<string, Plan> = {
  Mensal: {
    id: "1",
    name: "Plano Mensal",
    type: 'Mensal',
    priceBrl: 100,
    durationMonths: 1,
    active: true,
    color: 'bg-blue-100 text-blue-800'
  },
  Trimestral: {
    id: "2",
    name: "Plano Trimestral",
    type: 'Trimestral',
    priceBrl: 270,
    durationMonths: 3,
    active: true,
    color: 'bg-green-100 text-green-800'
  },
  Anual: {
    id: "3",
    name: "Plano Anual",
    type: 'Anual',
    priceBrl: 960,
    durationMonths: 12,
    active: true,
    color: 'bg-purple-100 text-purple-800'
  }
};

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin Teste",
    email: "admin@gympulse.com",
    profile: "Admin",
    active: true,
    createdAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    name: "Gerente Teste",
    email: "gerente@gympulse.com",
    profile: "Gerente",
    active: true,
    createdAt: new Date("2023-02-15"),
  },
  {
    id: "3",
    name: "Operador Teste",
    email: "operador@gympulse.com",
    profile: "Operador",
    active: false,
    createdAt: new Date("2023-03-10"),
  },
];

export const mockClients: Client[] = [
  {
    id: "1",
    name: "João Silva",
    cpf: "123.456.789-00",
    email: "joao@email.com",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123, São Paulo - SP",
    birthDate: new Date("1990-05-15"),
    createdAt: new Date("2023-01-10"),
  },
  {
    id: "2",
    name: "Maria Santos",
    cpf: "987.654.321-00",
    email: "maria@email.com",
    phone: "(11) 91234-5678",
    address: "Av. Principal, 456, São Paulo - SP",
    birthDate: new Date("1985-08-20"),
    createdAt: new Date("2023-02-05"),
  },
  {
    id: "3",
    name: "Carlos Oliveira",
    cpf: "456.789.123-00",
    email: null,
    phone: "(11) 94567-8901",
    address: "Rua Secundária, 789, São Paulo - SP",
    birthDate: new Date("1995-12-03"),
    createdAt: new Date("2023-03-15"),
  },
  {
    id: "4",
    name: "Ana Souza",
    cpf: "321.654.987-00",
    email: "ana@email.com",
    phone: "(11) 97890-1234",
    address: "Av. Secundária, 987, São Paulo - SP",
    birthDate: new Date("1992-07-25"),
    createdAt: new Date("2023-04-20"),
  },
  {
    id: "5",
    name: "Pedro Lima",
    cpf: "654.321.987-00",
    email: "pedro@email.com",
    phone: "(11) 93456-7890",
    address: "Rua Terciária, 654, São Paulo - SP",
    birthDate: new Date("1988-03-10"),
    createdAt: new Date("2023-05-12"),
  },
];

export const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    clientId: "1",
    plan: "Mensal",
    startDate: new Date("2023-06-01"),
    endDate: new Date("2023-07-01"),
    active: true,
    client: mockClients[0],
  },
  {
    id: "2",
    clientId: "2",
    plan: "Trimestral",
    startDate: new Date("2023-05-15"),
    endDate: new Date("2023-08-15"),
    active: true,
    client: mockClients[1],
  },
  {
    id: "3",
    clientId: "3",
    plan: "Anual",
    startDate: new Date("2023-01-10"),
    endDate: new Date("2024-01-10"),
    active: true,
    client: mockClients[2],
  },
  {
    id: "4",
    clientId: "4",
    plan: "Mensal",
    startDate: new Date("2023-06-05"),
    endDate: new Date("2023-07-05"),
    active: false,
    client: mockClients[3],
  },
  {
    id: "5",
    clientId: "5",
    plan: "Trimestral",
    startDate: new Date("2023-04-01"),
    endDate: new Date("2023-07-01"),
    active: true,
    client: mockClients[4],
  },
];

export const mockPayments: Payment[] = [
  {
    id: "1",
    subscriptionId: "1",
    paymentDate: new Date("2023-06-01"),
    amount: 100,
    paymentMethod: "Cartão",
    confirmed: true,
    subscription: mockSubscriptions[0],
    client: mockClients[0],
  },
  {
    id: "2",
    subscriptionId: "2",
    paymentDate: new Date("2023-05-15"),
    amount: 270,
    paymentMethod: "Pix",
    confirmed: true,
    subscription: mockSubscriptions[1],
    client: mockClients[1],
  },
  {
    id: "3",
    subscriptionId: "3",
    paymentDate: new Date("2023-01-10"),
    amount: 960,
    paymentMethod: "Dinheiro",
    confirmed: true,
    subscription: mockSubscriptions[2],
    client: mockClients[2],
  },
  {
    id: "4",
    subscriptionId: "4",
    paymentDate: new Date("2023-06-05"),
    amount: 100,
    paymentMethod: "Cartão",
    confirmed: false,
    subscription: mockSubscriptions[3],
    client: mockClients[3],
  },
  {
    id: "5",
    subscriptionId: "5",
    paymentDate: new Date("2023-04-01"),
    amount: 270,
    paymentMethod: "Pix",
    confirmed: true,
    subscription: mockSubscriptions[4],
    client: mockClients[4],
  },
];
