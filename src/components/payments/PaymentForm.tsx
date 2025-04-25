
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Payment, Subscription } from "@/types";
import { mockSubscriptions, mockClients } from "@/lib/mock-data";
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

const formSchema = z.object({
  id: z.string().optional(),
  subscriptionId: z.string({
    required_error: "Matrícula é obrigatória",
  }),
  paymentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de pagamento inválida",
  }),
  amount: z.number({
    required_error: "Valor é obrigatório",
    invalid_type_error: "O valor deve ser um número",
  }).positive("Valor deve ser positivo"),
  paymentMethod: z.enum(["Cartão", "Dinheiro", "Pix", "Outro"], {
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

export function PaymentForm({ 
  onSubmit, 
  isLoading, 
  defaultValues,
  selectedSubscriptionId 
}: PaymentFormProps) {
  const [subscriptions, setSubscriptions] = useState<
    Array<Subscription & { clientName?: string }>
  >(() => {
    return mockSubscriptions.map(subscription => {
      const client = mockClients.find(c => c.id === subscription.clientId);
      return {
        ...subscription,
        clientName: client?.name
      };
    });
  });
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      confirmed: false,
      ...defaultValues,
      subscriptionId: selectedSubscriptionId || defaultValues?.subscriptionId || "",
      paymentDate: defaultValues?.paymentDate 
        ? new Date(defaultValues.paymentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      amount: defaultValues?.amount || undefined,
    },
  });

  const handleSubmit = (data: PaymentFormData) => {
    const formattedData = {
      ...data,
      paymentDate: new Date(data.paymentDate),
    };
    
    onSubmit(formattedData);
  };

  const watchSubscriptionId = form.watch("subscriptionId");
  
  // Encontra a matrícula selecionada para auto-preencher o valor
  const selectedSubscription = subscriptions.find(sub => sub.id === watchSubscriptionId);
  
  // Quando selecionar uma matrícula, preencher automaticamente o valor baseado no plano
  useState(() => {
    if (selectedSubscription && !defaultValues?.amount) {
      const planType = selectedSubscription.plan;
      let amount = 0;
      
      if (planType === "Mensal") amount = 100;
      else if (planType === "Trimestral") amount = 270;
      else if (planType === "Anual") amount = 960;
      
      form.setValue("amount", amount);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="subscriptionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={!!selectedSubscriptionId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma matrícula" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subscriptions
                    .filter(sub => sub.active)
                    .map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.clientName} - {sub.plan}
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
          name="paymentMethod"
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
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDate"
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
                  placeholder="0,00" 
                  {...field} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                  value={field.value || ''}
                />
              </FormControl>
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
