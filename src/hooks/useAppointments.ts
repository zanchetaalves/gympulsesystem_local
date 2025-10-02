import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface Appointment {
    id: string;
    title: string;
    description: string;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes: number;
    clientId?: string;
    userId: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    reminderSent: boolean;
    createdAt: string;
    updatedAt: string;
    clientName?: string;
    userName?: string;
}

export const useAppointments = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // API helper function
    const apiCall = async (endpoint: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('access_token');

        const response = await fetch(`http://localhost:3000/api${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    };

    // Transform database format to app format
    const dbToAppAppointment = (dbAppointment: any): Appointment => ({
        id: dbAppointment.id,
        title: dbAppointment.title,
        description: dbAppointment.description || '',
        appointmentDate: dbAppointment.appointment_date ?
            new Date(dbAppointment.appointment_date).toISOString().split('T')[0] : '',
        appointmentTime: dbAppointment.appointment_time,
        durationMinutes: dbAppointment.duration_minutes,
        clientId: dbAppointment.client_id,
        userId: dbAppointment.user_id,
        status: dbAppointment.status,
        reminderSent: dbAppointment.reminder_sent,
        createdAt: dbAppointment.created_at,
        updatedAt: dbAppointment.updated_at,
        clientName: dbAppointment.client_name,
        userName: dbAppointment.user_name,
    });

    // Transform app format to database format
    const appToDbAppointment = (appointment: Partial<Appointment>) => ({
        title: appointment.title,
        description: appointment.description,
        appointment_date: appointment.appointmentDate,
        appointment_time: appointment.appointmentTime,
        duration_minutes: appointment.durationMinutes,
        client_id: appointment.clientId,
        user_id: appointment.userId,
        status: appointment.status,
        reminder_sent: appointment.reminderSent,
    });

    // Query for fetching appointments
    const {
        data: appointments = [],
        isLoading,
        error
    } = useQuery({
        queryKey: ['appointments'],
        queryFn: async () => {
            try {
                const result = await apiCall('/appointments?orderBy=appointment_date,appointment_time&ascending=true');
                console.log('Appointments API result:', result); // Debug log

                // Verificar se result é um array
                if (!Array.isArray(result)) {
                    console.warn('API returned non-array result:', result);
                    return [];
                }

                return result.map(dbToAppAppointment);
            } catch (error) {
                console.error('Error fetching appointments:', error);
                toast({
                    title: "Erro",
                    description: "Erro ao carregar compromissos: " + (error as Error).message,
                    variant: "destructive",
                });
                return [];
            }
        },
    });

    // Query for upcoming appointments (next 5 days)
    const {
        data: upcomingAppointments = [],
        isLoading: isLoadingUpcoming
    } = useQuery({
        queryKey: ['appointments-upcoming'],
        queryFn: async () => {
            try {
                const result = await apiCall('/appointments/upcoming');
                console.log('Upcoming appointments API result:', result); // Debug log

                // Verificar se result é um array
                if (!Array.isArray(result)) {
                    console.warn('Upcoming appointments API returned non-array result:', result);
                    return [];
                }

                return result.map(dbToAppAppointment);
            } catch (error) {
                console.error('Error fetching upcoming appointments:', error);
                return [];
            }
        },
    });

    // Mutation for creating appointments
    const createAppointment = useMutation({
        mutationFn: async (data: Partial<Appointment>) => {
            const dbData = appToDbAppointment(data);
            const result = await apiCall('/appointments', {
                method: 'POST',
                body: JSON.stringify(dbData),
            });

            // 🔧 CORREÇÃO: Backend retorna o objeto diretamente, não em result.data
            console.log("🔍 [DEBUG] Appointment creation response:", result);
            return dbToAppAppointment(result);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
            toast({
                title: "Sucesso",
                description: "Compromisso criado com sucesso!",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: "Erro ao criar compromisso: " + error.message,
                variant: "destructive",
            });
        },
    });

    // Mutation for updating appointments
    const updateAppointment = useMutation({
        mutationFn: async (data: Partial<Appointment> & { id: string }) => {
            const { id, ...updateData } = data;
            const dbData = appToDbAppointment(updateData);
            const result = await apiCall(`/appointments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(dbData),
            });

            // 🔧 CORREÇÃO: Backend retorna o objeto diretamente, não em result.data
            return dbToAppAppointment(result);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
            toast({
                title: "Sucesso",
                description: "Compromisso atualizado com sucesso!",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: "Erro ao atualizar compromisso: " + error.message,
                variant: "destructive",
            });
        },
    });

    // Mutation for deleting appointments
    const deleteAppointment = useMutation({
        mutationFn: async (id: string) => {
            const result = await apiCall(`/appointments/${id}`, {
                method: 'DELETE',
            });

            // 🔧 CORREÇÃO: Backend retorna o objeto diretamente, não em result.data
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['appointments-upcoming'] });
            toast({
                title: "Sucesso",
                description: "Compromisso excluído com sucesso!",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: "Erro ao excluir compromisso: " + error.message,
                variant: "destructive",
            });
        },
    });

    return {
        appointments,
        upcomingAppointments,
        isLoading,
        isLoadingUpcoming,
        error,
        createAppointment,
        updateAppointment,
        deleteAppointment,
    };
}; 