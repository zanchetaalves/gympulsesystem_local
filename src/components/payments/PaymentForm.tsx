import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Payment } from "@/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useClients } from "@/hooks/useClients";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { usePlans } from "@/hooks/usePlans";
import { format, parse, isValid } from "date-fns";
import { PriceInput, usePriceField } from "@/components/form/PriceInput";

const formSchema = z.object({
  id: z.string().optional(),
  subscription_id: z.string({
    required_error: "Matrícula é obrigatória",
  }),
  payment_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de pagamento inválida",
  }),
  amount: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    if (isNaN(num)) throw new Error("Valor deve ser um número válido");
    return num;
  }).refine((val) => val > 0, "Valor deve ser maior que zero"),
  payment_method: z.enum(["pix", "dinheiro", "cartao_debito", "cartao_credito", "boleto", "transferencia"], {
    required_error: "Método de pagamento é obrigatório",
  }),
  confirmed: z.boolean().default(false),
});

type PaymentFormData = z.infer<typeof formSchema>;

interface PaymentFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  defaultValues?: Partial<Payment>;
  selectedSubscriptionId?: string;
}

export function PaymentForm({ onSubmit, isLoading, defaultValues, selectedSubscriptionId }: PaymentFormProps) {
  const { subscriptions } = useSubscriptions();
  const { clients } = useClients();
  const { plans } = usePlans();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [paymentDateInput, setPaymentDateInput] = useState(() => {
    if (defaultValues?.paymentDate) {
      const date = new Date(defaultValues.paymentDate);
      return isValid(date) ? format(date, "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy");
    }
    return format(new Date(), "dd/MM/yyyy");
  });

  // Simplify date formatting to preserve the exact date
  const getISODateString = (dateObj: Date): string => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Create enriched subscriptions with client data
  const enrichedSubscriptions = subscriptions.map(subscription => {
    const client = clients.find(client => client.id === subscription.clientId);
    return {
      ...subscription,
      clientName: client ? client.name : "Cliente não encontrado"
    };
  });

  // Função para obter o preço do plano
  const getPlanPrice = (planType: string): number => {
    const plan = plans.find(p => p.type === planType);
    return plan ? plan.priceBrl : 0;
  };

  const formattedDefaultValues = {
    ...defaultValues,
    payment_date: defaultValues?.paymentDate
      ? (() => {
        const date = new Date(defaultValues.paymentDate);
        return isValid(date) ? getISODateString(date) : getISODateString(new Date());
      })()
      : getISODateString(new Date()),
    subscription_id: selectedSubscriptionId || defaultValues?.subscription?.id || "",
    amount: defaultValues?.amount || 0,
    payment_method: defaultValues?.paymentMethod || "pix",
    confirmed: defaultValues?.confirmed || false,
  };

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: formattedDefaultValues,
  });

  // Filter subscriptions by selected client
  const clientSubscriptions = selectedClientId
    ? enrichedSubscriptions.filter(sub => sub.clientId === selectedClientId)
    : enrichedSubscriptions;

  useEffect(() => {
    const subscription_id = form.watch("subscription_id");
    if (subscription_id) {
      const subscription = subscriptions.find(sub => sub.id === subscription_id);
      if (subscription) {
        setSelectedClientId(subscription.clientId);
      }
    }
  }, [form.watch("subscription_id"), subscriptions]);

  // Set the subscription ID when selectedSubscriptionId changes
  useEffect(() => {
    if (selectedSubscriptionId) {
      form.setValue("subscription_id", selectedSubscriptionId);

      // Update the client ID as well
      const subscription = subscriptions.find(sub => sub.id === selectedSubscriptionId);
      if (subscription) {
        setSelectedClientId(subscription.clientId);

        // Sugerir valor do plano automaticamente (apenas se não houver valor padrão)
        if (!defaultValues?.amount) {
          const planPrice = getPlanPrice(subscription.plan);
          if (planPrice > 0) {
            form.setValue("amount", planPrice);
          }
        }
      }
    }
  }, [selectedSubscriptionId, subscriptions, form, plans, defaultValues?.amount, getPlanPrice]);

  // Sugerir valor quando a matrícula for alterada no formulário
  useEffect(() => {
    const subscription_id = form.watch("subscription_id");
    if (subscription_id && !defaultValues?.amount) {
      const subscription = subscriptions.find(sub => sub.id === subscription_id);
      if (subscription) {
        const planPrice = getPlanPrice(subscription.plan);
        if (planPrice > 0) {
          form.setValue("amount", planPrice);
        }
      }
    }
  }, [form.watch("subscription_id"), subscriptions, plans, defaultValues?.amount, form, getPlanPrice]);

  const handlePaymentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaymentDateInput(value);

    // Parse the date using date-fns
    const parsedDate = parse(value, "dd/MM/yyyy", new Date());

    if (isValid(parsedDate)) {
      // Use the exact date as a string in YYYY-MM-DD format
      const formattedDate = getISODateString(parsedDate);
      form.setValue("payment_date", formattedDate);
    }
  };

  const handleSubmit = (data: PaymentFormData) => {
    console.log("Form data submitted:", data);
    const subscription = subscriptions.find(sub => sub.id === data.subscription_id);

    // Convert payment_date string to Date object without timezone adjustments
    const paymentDateParts = data.payment_date.split('-').map(Number);
    const paymentDate = new Date(paymentDateParts[0], paymentDateParts[1] - 1, paymentDateParts[2]);

    const formattedData = {
      id: data.id,
      paymentDate: paymentDate,
      amount: data.amount,
      paymentMethod: data.payment_method,
      confirmed: data.confirmed,
      subscription: subscription || null,
      subscriptionId: data.subscription_id,
    };

    console.log("Formatted data:", formattedData);
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex items-center space-x-4 mb-4">
          <FormLabel className="text-sm font-medium text-gray-500 min-w-[100px]">Cliente:</FormLabel>
          <Select
            value={selectedClientId || undefined}
            onValueChange={setSelectedClientId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormField
          control={form.control}
          name="subscription_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma matrícula" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientSubscriptions.map((subscription) => (
                    <SelectItem key={subscription.id} value={subscription.id}>
                      {subscription.clientName} - {subscription.plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Pagamento</FormLabel>
              <FormControl>
                <Input
                  placeholder="DD/MM/AAAA"
                  value={paymentDateInput}
                  onChange={handlePaymentDateChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <PriceInput
              label="Valor (R$)"
              placeholder="0,00"
              value={field.value}
              onChange={field.onChange}
              required
              error={form.formState.errors.amount?.message}
            />
          )}
        />

        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pagamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um método" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Pagamento Confirmado</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
