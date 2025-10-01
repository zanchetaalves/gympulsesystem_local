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

const formSchema = z.object({
    name: z.string({
        required_error: "Nome é obrigatório",
    }).min(2, "Nome deve ter pelo menos 2 caracteres"),
    description: z.string().optional(),
});

type PlanTypeFormData = z.infer<typeof formSchema>;

interface PlanTypeFormProps {
    onSubmit: (data: PlanTypeFormData) => void;
    isLoading?: boolean;
    defaultValues?: Partial<PlanTypeFormData>;
    isEditing?: boolean;
}

export function PlanTypeForm({
    onSubmit,
    isLoading = false,
    defaultValues,
    isEditing = false
}: PlanTypeFormProps) {
    const form = useForm<PlanTypeFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: defaultValues?.name || "",
            description: defaultValues?.description || "",
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
                            <FormLabel className="!text-left block" style={{ textAlign: 'left' }}>Nome</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Mensal, Trimestral, Anual" {...field} />
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
                            <FormLabel className="!text-left block" style={{ textAlign: 'left' }}>Descrição</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descrição do tipo de plano..."
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
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