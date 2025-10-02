
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
const API_BASE_URL = 'http://localhost:3000/api';

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = 'Erro na requisição';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || `Erro ${response.status}`;
    } catch {
      errorMessage = `Erro ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
import { Payment, PlanType } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Adapter functions para converter entre os formatos do banco e da aplicação
export const dbToAppPayment = (dbPayment: any): Payment => ({
  id: dbPayment.id,
  subscriptionId: dbPayment.subscription_id,
  paymentDate: new Date(dbPayment.payment_date || dbPayment.created_at),
  amount: typeof dbPayment.amount === 'number' ? dbPayment.amount : parseFloat(dbPayment.amount) || 0,
  paymentMethod: dbPayment.payment_method,
  // 🔧 CORREÇÃO: Usar apenas o campo 'confirmed' do banco, não o 'status'
  confirmed: dbPayment.confirmed === true,
});

export const appToDbPayment = (payment: Partial<Payment>) => ({
  subscription_id: payment.subscriptionId,
  payment_date: payment.paymentDate instanceof Date
    ? payment.paymentDate.toISOString().split('T')[0]
    : payment.paymentDate,
  amount: payment.amount,
  payment_method: payment.paymentMethod,
  confirmed: payment.confirmed
});

export const usePayments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar pagamentos
  const {
    data: payments = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await apiCall('/payments');

      // 🔧 CORREÇÃO: API pode retornar {data: Array} em vez de Array direto
      let paymentsArray;
      if (Array.isArray(response)) {
        paymentsArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        console.log('🔍 [DEBUG] Usando response.data para payments');
        paymentsArray = response.data;
      } else {
        console.warn('Payments API returned unexpected format:', response);
        paymentsArray = [];
      }

      return paymentsArray.map((dbPayment) => {
        const payment = dbToAppPayment(dbPayment);

        // Adicionar dados do cliente e matrícula para exibição (dados flat da query)
        if (dbPayment.subscription_id) {
          payment.subscription = {
            id: dbPayment.subscription_id,
            clientId: dbPayment.client_id_real || dbPayment.client_id,
            plan: dbPayment.subscription_plan as PlanType,
            startDate: new Date(),
            endDate: new Date(),
            active: true
          };
        }

        // 🔧 CORREÇÃO: API retorna clients_name (com "s") não client_name
        const clientName = dbPayment.clients_name || dbPayment.client_name;
        const clientId = dbPayment.clients_id || dbPayment.client_id_real || dbPayment.client_id;

        // Criar objeto client apenas se temos dados válidos (não null/undefined)
        if (clientName && clientName.trim() !== '') {
          payment.client = {
            id: clientId || '',
            name: clientName,
            cpf: '',
            email: '',
            phone: '',
            address: '',
            birthDate: new Date(),
            createdAt: new Date()
          };
        } else {
          // Se client_name for null/undefined, deixar payment.client undefined
          // A UI vai mostrar "Cliente não encontrado" automaticamente
          payment.client = undefined;
        }

        return payment;
      });
    },
  });

  // Mutation para criar pagamento
  const createPayment = useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      console.log("Dados enviados para criação:", data);
      console.log("Dados formatados para DB:", appToDbPayment(data));

      const dbData = appToDbPayment(data);
      const response = await apiCall('/payments', {
        method: 'POST',
        body: JSON.stringify(dbData),
      });

      // 🔧 CORREÇÃO: Backend retorna o objeto diretamente, não em response.data
      console.log("🔍 [DEBUG] Response from backend:", response);
      return dbToAppPayment(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: "Sucesso",
        description: "Pagamento cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar pagamento: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar pagamento
  const updatePayment = useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      const dbData = {
        ...appToDbPayment(data),
        id: data.id
      };

      const response = await apiCall(`/payments/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(dbData),
      });

      // 🔧 CORREÇÃO: Backend retorna o objeto diretamente, não em response.data
      return dbToAppPayment(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar pagamento: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    payments,
    isLoading,
    error,
    createPayment,
    updatePayment
  };
};
