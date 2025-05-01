
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

const formSchema = z.object({
  id: z.string().optional(),
  subscription_id: z.string({
    required_error: "Matrícula é obrigatória",
  }),
  payment_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de pagamento inválida",
  }),
  amount: z.number({
    required_error: "Valor é obrigatório",
  }).min(0, {
    message: "Valor deve ser maior que zero",
  }),
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
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Create enriched subscriptions with client data
  const enrichedSubscriptions = subscriptions.map(subscription => {
    const client = clients.find(client => client.id === subscription.clientId);
    return {
      ...subscription,
      clientName: client ? client.name : "Cliente não encontrado"
    };
  });
  
  const formattedDefaultValues = {
    ...defaultValues,
    payment_date: defaultValues?.paymentDate 
      ? new Date(defaultValues.paymentDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
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
      }
    }
  }, [selectedSubscriptionId, subscriptions, form]);

  const handleSubmit = (data: PaymentFormData) => {
    console.log("Form data submitted:", data);
    const subscription = subscriptions.find(sub => sub.id === data.subscription_id);
    
    const formattedData = {
      id: data.id,
      paymentDate: new Date(data.payment_date),
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
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  {...field} 
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
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
