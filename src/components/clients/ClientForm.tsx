
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Client } from "@/types";
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
import { WebcamCapture } from "./WebcamCapture";
import { DateInput } from "@/components/form/DateInput";
import { CPFInput } from "@/components/form/CPFInput";
import { PhoneInput } from "@/components/form/PhoneInput";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string({
    required_error: "Nome é obrigatório",
  }).min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().optional().transform(val => val === "" ? undefined : val),
  email: z.union([
    z.string().email("Email inválido"),
    z.literal(""),
  ]).optional().transform(val => val === "" ? undefined : val),
  phone: z.string({
    required_error: "Telefone é obrigatório",
  }).min(10, "Telefone inválido"),
  address: z.string().optional().transform(val => val === "" ? undefined : val),
  birthDate: z.date().optional(),
  photoUrl: z.string().nullable().optional(),
});

type ClientFormData = z.infer<typeof formSchema>;

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  isLoading?: boolean;
  defaultValues?: Partial<Client>;
}

export function ClientForm({ onSubmit, isLoading, defaultValues }: ClientFormProps) {
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(defaultValues?.photoUrl || null);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      cpf: defaultValues?.cpf || "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      address: defaultValues?.address || "",
      // Use a data diretamente sem ajustes de timezone
      birthDate: defaultValues?.birthDate ? new Date(defaultValues.birthDate) : undefined,
      photoUrl: defaultValues?.photoUrl || null,
    },
  });

  const handlePhotoCapture = (photoDataUrl: string | null) => {
    setPhotoUrl(photoDataUrl);
    form.setValue("photoUrl", photoDataUrl);
  };

  const handleSubmit = (data: ClientFormData) => {
    // Passa os dados diretamente sem ajustes de timezone
    onSubmit({
      ...data,
      photoUrl,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CPFInput name="cpf" label="CPF (opcional)" />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@exemplo.com"
                      type="email"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PhoneInput name="phone" />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rua, número, bairro, cidade"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DateInput name="birthDate" label="Data de Nascimento (opcional)" />
          </div>

          <div>
            <FormField
              control={form.control}
              name="photoUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Foto (opcional)</FormLabel>
                  <FormControl>
                    <WebcamCapture
                      onCapture={handlePhotoCapture}
                      initialImage={defaultValues?.photoUrl || null}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  );
}
