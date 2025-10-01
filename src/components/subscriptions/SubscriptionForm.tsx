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
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency } from "@/lib/utils";

// Função para criar schema com validação dinâmica
const createFormSchema = (existingSubscriptions: Subscription[], currentSubscriptionId?: string, availablePlanTypes: string[] = []) => {
  // Se não há tipos de planos disponíveis, usar os padrões
  const planTypeOptions = availablePlanTypes.length > 0
    ? availablePlanTypes
    : ["Mensal", "Trimestral", "Quadrimestral", "Anual"];

  return z.object({
    id: z.string().optional(),
    clientId: z.string({
      required_error: "Cliente é obrigatório",
    }).refine((clientId) => {
      // Permitir se estiver editando a mesma matrícula
      if (currentSubscriptionId) {
        return true;
      }

      // Verificar se o cliente já possui matrícula ativa
      const now = new Date();
      const activeSubscription = existingSubscriptions.find(sub =>
        sub.clientId === clientId &&
        sub.active &&
        new Date(sub.endDate) > now
      );

      return !activeSubscription;
    }, {
      message: "Este cliente já possui uma matrícula ativa. Aguarde o vencimento da atual."
    }),
    plan: z.string({
      required_error: "Plano é obrigatório",
    }).refine((value) => planTypeOptions.includes(value), {
      message: "Tipo de plano inválido",
    }),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Data de início inválida",
    }),
    active: z.boolean().default(true),
    locked: z.boolean().default(false),
    lockDays: z.number().min(1, "Deve ser pelo menos 1 dia").optional(),
  });
};

type SubscriptionFormData = {
  id?: string;
  clientId: string;
  plan: string; // Permitir qualquer string já que validamos no schema
  startDate: string;
  active: boolean;
  locked: boolean;
  lockDays?: number;
};

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
  const [isLocked, setIsLocked] = useState(defaultValues?.locked || false);
  const [startDateInput, setStartDateInput] = useState(() => {
    if (defaultValues?.startDate) {
      const date = new Date(defaultValues.startDate);
      return isValid(date) ? format(date, "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy");
    }
    return format(new Date(), "dd/MM/yyyy");
  });
  const { plans } = usePlans();
  const { clients } = useClients();
  const { subscriptions } = useSubscriptions();
  const activePlans = plans.filter(p => p.active);

  // Obter tipos de planos únicos dos planos ativos
  const availablePlanTypes = [...new Set(activePlans.map(p => p.type))];

  // Função para verificar se um cliente possui matrícula ativa
  const clientHasActiveSubscription = (clientId: string): boolean => {
    const now = new Date();
    return subscriptions.some(sub =>
      sub.clientId === clientId &&
      sub.active &&
      new Date(sub.endDate) > now
    );
  };

  // Filtrar clientes que não possuem matrícula ativa (exceto ao editar)
  const availableClients = clients.filter(client => {
    // Se estiver editando, permitir o cliente atual
    if (defaultValues?.clientId === client.id) {
      return true;
    }
    // Caso contrário, apenas clientes sem matrícula ativa
    return !clientHasActiveSubscription(client.id);
  });

  // Simplify date formatting to preserve the exact date
  const getISODateString = (dateObj: Date): string => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formattedDefaultValues = {
    ...defaultValues,
    startDate: defaultValues?.startDate
      ? (() => {
        const date = new Date(defaultValues.startDate);
        return isValid(date) ? getISODateString(date) : getISODateString(new Date());
      })()
      : getISODateString(new Date()),
  };

  // Criar o schema dinâmico com as matrículas existentes
  const dynamicSchema = createFormSchema(subscriptions, defaultValues?.id, availablePlanTypes);

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      active: true,
      locked: false,
      ...formattedDefaultValues,
      clientId: selectedClientId || defaultValues?.clientId || "",
      plan: defaultValues?.plan || "", // ✅ Definir o plano padrão
      lockDays: defaultValues?.lockDays || undefined,
    },
  });

  useEffect(() => {
    const planType = form.watch("plan") as PlanType;
    const startDateString = form.watch("startDate");
    const locked = form.watch("locked");
    const lockDays = form.watch("lockDays");

    if (planType && startDateString) {
      try {
        // Criar a data usando UTC para evitar ajustes de fuso horário
        const startDate = new Date(startDateString);

        // Verificar se a data é válida
        if (!isValid(startDate)) {
          setEndDate(null);
          return;
        }

        const planInfo = plans.find(p => p.type === planType);
        console.log('Debug - planType:', planType, 'planInfo:', planInfo, 'available plans:', plans.map(p => ({ type: p.type, duration: p.durationMonths })));

        if (planInfo) {
          let calculatedEndDate = addMonths(startDate, planInfo.durationMonths);

          // Se a matrícula está trancada e tem dias informados, adicionar os dias
          if (locked && lockDays && lockDays > 0) {
            calculatedEndDate = new Date(calculatedEndDate.getTime() + (lockDays * 24 * 60 * 60 * 1000));
          }

          // Verificar se a data calculada também é válida
          if (isValid(calculatedEndDate)) {
            setEndDate(calculatedEndDate);
          } else {
            setEndDate(null);
          }
        }
      } catch (error) {
        console.warn('Erro ao calcular data de término:', error);
        setEndDate(null);
      }
    } else {
      setEndDate(null);
    }
  }, [form.watch("plan"), form.watch("startDate"), form.watch("locked"), form.watch("lockDays"), plans]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDateInput(value);

    // Parse the date using date-fns
    const parsedDate = parse(value, "dd/MM/yyyy", new Date());

    if (isValid(parsedDate)) {
      // Use the exact date as a string in YYYY-MM-DD format
      const formattedDate = getISODateString(parsedDate);
      form.setValue("startDate", formattedDate);
    }
  };

  const handleSubmit = (data: SubscriptionFormData) => {
    console.log('🔍 [DEBUG] Dados recebidos do formulário:', data);

    if (!endDate) {
      console.error('🚨 [ERROR] endDate não está definido!');
      return;
    }

    if (!data.startDate) {
      console.error('🚨 [ERROR] startDate não está definido!');
      return;
    }

    // Convert startDate string to Date object without timezone adjustments
    const startDateParts = data.startDate.split('-').map(Number);
    const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);

    // Handle endDate the same way
    const endDateYear = endDate.getFullYear();
    const endDateMonth = endDate.getMonth();
    const endDateDay = endDate.getDate();
    const endDateObj = new Date(endDateYear, endDateMonth, endDateDay);

    // Validar campos obrigatórios
    if (!data.clientId) {
      console.error('🚨 [ERROR] clientId não está definido!');
      return;
    }

    if (!data.plan) {
      console.error('🚨 [ERROR] plan não está definido!');
      return;
    }

    // 🔧 CORREÇÃO: Converter plan (tipo) para plan_id
    const selectedPlan = plans.find(p => p.type === data.plan);
    if (!selectedPlan) {
      console.error('🚨 [ERROR] Plano não encontrado:', data.plan, 'Planos disponíveis:', plans.map(p => p.type));
      return;
    }

    // 🔍 DEBUG: Verificar datas
    console.log('🔍 [DEBUG] Datas do formulário:', {
      originalStartDate: data.startDate,
      startDateParts,
      startDate,
      endDate,
      endDateObj
    });

    const formattedData = {
      client_id: data.clientId,
      plan_id: selectedPlan.id, // ✅ Enviar plan_id em vez de plan
      start_date: startDate.toISOString().split('T')[0], // ✅ Formato YYYY-MM-DD
      end_date: endDateObj.toISOString().split('T')[0], // ✅ Formato YYYY-MM-DD
      active: data.active,
      locked: data.locked || false,
      lock_days: data.lockDays || null,
    };

    // ✅ Adicionar ID apenas se estiver editando
    if (data.id) {
      formattedData.id = data.id;
    }

    console.log('🔍 [DEBUG] Payload final:', formattedData);

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
              <FormLabel className="!text-left block" style={{ textAlign: 'left' }}>Cliente</FormLabel>
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
                  {availableClients.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Todos os clientes já possuem matrículas ativas
                    </div>
                  ) : (
                    availableClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))
                  )}
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
              <FormLabel className="!text-left block" style={{ textAlign: 'left' }}>Plano</FormLabel>
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
              <FormLabel className="!text-left block" style={{ textAlign: 'left' }}>Data de Início</FormLabel>
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
          <FormLabel className="!text-left block" style={{ textAlign: 'left' }}>Data de Término</FormLabel>
          <Input
            type="text"
            value={endDate && isValid(endDate) ? format(endDate, "dd/MM/yyyy") : ''}
            disabled
          />
          <p className="text-sm text-muted-foreground mt-1">
            Data calculada automaticamente com base no plano{form.watch("locked") && form.watch("lockDays") ? ` + ${form.watch("lockDays")} dias de trancamento` : ''}.
          </p>
        </div>

        <FormField
          control={form.control}
          name="locked"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setIsLocked(checked as boolean);
                    if (!checked) {
                      form.setValue("lockDays", undefined);
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="!text-left block" style={{ textAlign: 'left' }}>Trancar</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Trancar matrícula por um período determinado
                </p>
              </div>
            </FormItem>
          )}
        />

        {form.watch("locked") && (
          <FormField
            control={form.control}
            name="lockDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="!text-left block" style={{ textAlign: 'left' }}>Quantidade de dias para trancamento</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 30"
                    value={field.value || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value) : undefined);
                    }}
                  />
                </FormControl>
                <p className="text-sm text-muted-foreground">
                  Os dias serão adicionados à data de término da matrícula
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                <FormLabel className="!text-left block" style={{ textAlign: 'left' }}>Ativo</FormLabel>
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
