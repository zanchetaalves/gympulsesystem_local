
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Subscription, Client, PlanType } from "@/types";
import { mockClients, plans } from "@/lib/mock-data";
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
import { addMonths } from "date-fns";

const formSchema = z.object({
  id: z.string().optional(),
  clientId: z.string({
    required_error: "Cliente é obrigatório",
  }),
  plan: z.enum(["Mensal", "Trimestral", "Anual"], {
    required_error: "Plano é obrigatório",
  }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de início inválida",
  }),
  active: z.boolean().default(true),
});

type SubscriptionFormData = z.infer<typeof formSchema>;

interface SubscriptionFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  defaultValues?: Partial<Subscription>;
  selectedClientId?: string;
}

export function SubscriptionForm({ 
  onSubmit, 
  isLoading, 
  defaultValues,
  selectedClientId 
}: SubscriptionFormProps) {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      active: true,
      ...defaultValues,
      clientId: selectedClientId || defaultValues?.clientId || "",
      startDate: defaultValues?.startDate 
        ? new Date(defaultValues.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  });

  // Calcular a data de término com base no plano e data de início
  useEffect(() => {
    const planType = form.watch("plan") as PlanType;
    const startDateString = form.watch("startDate");
    
    if (planType && startDateString) {
      try {
        const startDate = new Date(startDateString);
        const planInfo = plans[planType];
        if (planInfo) {
          const calculatedEndDate = addMonths(startDate, planInfo.durationMonths);
          setEndDate(calculatedEndDate);
        }
      } catch (error) {
        setEndDate(null);
      }
    } else {
      setEndDate(null);
    }
  }, [form.watch("plan"), form.watch("startDate")]);

  const handleSubmit = (data: SubscriptionFormData) => {
    if (!endDate) return;
    
    const formattedData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: endDate,
    };
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                disabled={!!selectedClientId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
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
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Início</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mb-4">
          <FormLabel>Data de Término</FormLabel>
          <Input 
            type="date" 
            value={endDate ? endDate.toISOString().split('T')[0] : ''} 
            disabled 
          />
          <p className="text-sm text-muted-foreground mt-1">
            Data calculada automaticamente com base no plano.
          </p>
        </div>

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Ativo</FormLabel>
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
