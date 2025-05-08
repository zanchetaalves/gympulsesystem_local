
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
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().min(11, "CPF inválido"),
  email: z.string().email("Email inválido").nullable(),
  phone: z.string().min(10, "Telefone inválido"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  birthDate: z.date({
    required_error: "Data de nascimento é obrigatória",
  }),
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
      email: null,
      ...defaultValues,
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

            <CPFInput name="cpf" />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DateInput name="birthDate" label="Data de Nascimento" />
          </div>
          
          <div>
            <FormField
              control={form.control}
              name="photoUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Foto</FormLabel>
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
