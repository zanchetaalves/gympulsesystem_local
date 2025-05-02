
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Subscription, Client, PlanType } from "@/types";
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
import { addMonths, format, parse, isValid } from "date-fns";
import { usePlans } from "@/hooks/usePlans";
import { useClients } from "@/hooks/useClients";
import { formatCurrency } from "@/lib/utils";

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
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateInput, setStartDateInput] = useState(
    defaultValues?.startDate 
      ? format(new Date(defaultValues.startDate), "dd/MM/yyyy")
      : format(new Date(), "dd/MM/yyyy")
  );
  const { plans } = usePlans();
  const { clients } = useClients();
  const activePlans = plans.filter(p => p.active);
  
  // Ajuste para preservar a data exata ao converter para formato ISO
  const getISODateWithoutTimezoneAdjustment = (dateObj: Date): string => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    return new Date(Date.UTC(year, month, day, 4, 0, 0)).toISOString().split('T')[0];
  };
  
  const formattedDefaultValues = {
    ...defaultValues,
    startDate: defaultValues?.startDate 
      ? getISODateWithoutTimezoneAdjustment(new Date(defaultValues.startDate))
      : getISODateWithoutTimezoneAdjustment(new Date()),
  };
  
  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      active: true,
      ...formattedDefaultValues,
      clientId: selectedClientId || defaultValues?.clientId || "",
    },
  });

  useEffect(() => {
    const planType = form.watch("plan") as PlanType;
    const startDateString = form.watch("startDate");
    
    if (planType && startDateString) {
      try {
        // Criar a data usando UTC para evitar ajustes de fuso horário
        const startDate = new Date(startDateString);
        const planInfo = plans.find(p => p.type === planType);
        if (planInfo) {
          const calculatedEndDate = addMonths(startDate, planInfo.durationMonths);
          // Garantir que a data final também não sofra ajuste de fuso horário
          setEndDate(calculatedEndDate);
        }
      } catch (error) {
        setEndDate(null);
      }
    } else {
      setEndDate(null);
    }
  }, [form.watch("plan"), form.watch("startDate"), plans]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDateInput(value);
    
    // Try to parse the date
    const parsedDate = parse(value, "dd/MM/yyyy", new Date());
    if (isValid(parsedDate)) {
      // Usar UTC-4 para preservar o dia exato
      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth();
      const day = parsedDate.getDate();
      const utcDate = new Date(Date.UTC(year, month, day, 4, 0, 0));
      form.setValue("startDate", utcDate.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (data: SubscriptionFormData) => {
    if (!endDate) return;
    
    // Converter a data de início para um objeto Date sem ajuste de fuso horário
    const startDate = new Date(data.startDate);
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const day = startDate.getDate();
    const utcStartDate = new Date(Date.UTC(year, month, day, 4, 0, 0));
    
    // Garantir que a data final também não sofra ajuste de fuso horário
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endDay = endDate.getDate();
    const utcEndDate = new Date(Date.UTC(endYear, endMonth, endDay, 4, 0, 0));
    
    const formattedData = {
      ...data,
      startDate: utcStartDate,
      endDate: utcEndDate,
      clientId: data.clientId,
      active: data.active,
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
                  {activePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.type}>
                      {plan.name} - {formatCurrency(plan.priceBrl)}
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
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Início</FormLabel>
              <FormControl>
                <Input 
                  placeholder="DD/MM/AAAA" 
                  value={startDateInput} 
                  onChange={handleStartDateChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mb-4">
          <FormLabel>Data de Término</FormLabel>
          <Input 
            type="text" 
            value={endDate ? format(endDate, "dd/MM/yyyy") : ''} 
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
