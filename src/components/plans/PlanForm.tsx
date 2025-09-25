
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plan } from "@/types";
import { usePlanTypes } from "@/hooks/usePlanTypes";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceInput } from "@/components/form/PriceInput";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string({
    required_error: "Nome é obrigatório",
  }).min(1, "Nome é obrigatório"),
  type: z.string({
    required_error: "Tipo é obrigatório",
  }).min(1, "Tipo é obrigatório"),
  priceBrl: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    if (isNaN(num)) throw new Error("Preço deve ser um número válido");
    return num;
  }).refine((val) => val > 0, "Preço deve ser maior que zero"),
  description: z.string().optional(),
  durationMonths: z.string().transform((val) => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Duração deve ser um número válido");
    return num;
  }).refine((val) => val >= 1, "Duração deve ser maior que zero"),
  active: z.boolean().default(true),
});

interface PlanFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  defaultValues?: Partial<Plan>;
}

export function PlanForm({ onSubmit, isLoading, defaultValues }: PlanFormProps) {
  const { planTypes } = usePlanTypes();

  // Convert numeric values to strings for form inputs
  const convertedDefaults = defaultValues ? {
    ...defaultValues,
    priceBrl: defaultValues.priceBrl ? String(defaultValues.priceBrl) : '',
    durationMonths: defaultValues.durationMonths ? String(defaultValues.durationMonths) : '',
  } : {};

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      active: true,
      ...convertedDefaults,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Plano</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {planTypes.map((planType) => (
                    <SelectItem key={planType.id} value={planType.name}>
                      {planType.name}
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
          name="priceBrl"
          render={({ field }) => (
            <PriceInput
              label="Preço (R$)"
              placeholder="0,00"
              value={field.value}
              onChange={field.onChange}
              required
              error={form.formState.errors.priceBrl?.message}
            />
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="durationMonths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duração (meses)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  {...field}
                  value={field.value ? String(field.value) : ''}
                  placeholder="1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
