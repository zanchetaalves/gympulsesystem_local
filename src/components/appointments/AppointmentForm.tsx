import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
    title: z.string({
        required_error: "Título é obrigatório",
    }).min(2, "Título deve ter pelo menos 2 caracteres"),
    description: z.string().optional(),
    appointmentDate: z.string({
        required_error: "Data é obrigatória",
    }).min(1, "Data é obrigatória"),
    appointmentTime: z.string({
        required_error: "Horário é obrigatório",
    }).min(1, "Horário é obrigatório"),
    durationMinutes: z.number({
        required_error: "Duração é obrigatória",
    }).min(15, "Duração mínima de 15 minutos").max(480, "Duração máxima de 8 horas"),
    clientId: z.string().optional().nullable(),
    status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']),
});

type AppointmentFormData = z.infer<typeof formSchema>;

interface AppointmentFormProps {
    onSubmit: (data: AppointmentFormData) => void;
    isLoading?: boolean;
    defaultValues?: Partial<AppointmentFormData>;
    isEditing?: boolean;
}

export function AppointmentForm({
    onSubmit,
    isLoading = false,
    defaultValues,
    isEditing = false
}: AppointmentFormProps) {
    const { clients } = useClients();
    const { user } = useAuth();

    const form = useForm<AppointmentFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: defaultValues?.title || "",
            description: defaultValues?.description || "",
            appointmentDate: defaultValues?.appointmentDate || "",
            appointmentTime: defaultValues?.appointmentTime || "",
            durationMinutes: defaultValues?.durationMinutes || 60,
            clientId: defaultValues?.clientId || undefined,
            status: defaultValues?.status || 'scheduled',
        },
    });

    const handleSubmit = (data: AppointmentFormData) => {
        // Add current user ID to the appointment and handle empty clientId
        const appointmentData = {
            ...data,
            userId: user?.id || '',
            clientId: data.clientId || null, // Convert empty string to null
        };
        onSubmit(appointmentData);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Avaliação Física, Treino Personalizado" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descrição do compromisso..."
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="appointmentDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="appointmentTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Horário</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="durationMinutes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duração (minutos)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="60"
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
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="scheduled">Agendado</SelectItem>
                                        <SelectItem value="confirmed">Confirmado</SelectItem>
                                        <SelectItem value="completed">Concluído</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cliente (opcional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
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

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
                </Button>
            </form>
        </Form>
    );
} 