import { useState, useMemo, useEffect } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar.css";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Clock, User, FileText } from "lucide-react";
import { useAppointments, Appointment } from "@/hooks/useAppointments";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";

// Configure Portuguese locale more explicitly
moment.updateLocale('pt-br', {
    months: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ],
    monthsShort: [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ],
    weekdays: [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
    ],
    weekdaysShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    weekdaysMin: ['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá']
});

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

// Define custom styles for calendar
const calendarStyle = {
    height: '600px',
};

const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6';
    let borderColor = '#2563eb';

    switch (event.status) {
        case 'confirmed':
            backgroundColor = '#10b981';
            borderColor = '#059669';
            break;
        case 'completed':
            backgroundColor = '#6b7280';
            borderColor = '#4b5563';
            break;
        case 'cancelled':
            backgroundColor = '#ef4444';
            borderColor = '#dc2626';
            break;
        default:
            backgroundColor = '#3b82f6';
            borderColor = '#2563eb';
    }

    return {
        style: {
            backgroundColor,
            borderRadius: '6px',
            opacity: 0.9,
            color: 'white',
            border: `1px solid ${borderColor}`,
            display: 'block',
            fontSize: '11px',
            fontWeight: '500',
            padding: '2px 6px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }
    };
};

const Appointments = () => {
    const [view, setView] = useState<View>('month');
    const [date, setDate] = useState(new Date());
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    const {
        appointments,
        isLoading,
        createAppointment,
        updateAppointment,
        deleteAppointment
    } = useAppointments();

    // Transform appointments for calendar
    const calendarEvents = useMemo(() => {
        const events = appointments.map((appointment) => {
            // Ensure we have valid date and time
            if (!appointment.appointmentDate || !appointment.appointmentTime) {
                return null;
            }

            const startDate = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);

            if (isNaN(startDate.getTime())) {
                return null;
            }

            const endDate = new Date(startDate.getTime() + (appointment.durationMinutes * 60000));

            return {
                id: appointment.id,
                title: appointment.title,
                start: startDate,
                end: endDate,
                resource: appointment,
                status: appointment.status,
            };
        }).filter(event => event !== null);

        return events;
    }, [appointments]);

    const handleCreateAppointment = async (data: any) => {
        createAppointment.mutate(data, {
            onSuccess: () => {
                setCreateDialogOpen(false);
            },
            onError: (error) => {
                console.error('Error creating appointment:', error);
            }
        });
    };

    const handleEditAppointment = async (data: any) => {
        if (selectedAppointment) {
            updateAppointment.mutate({
                id: selectedAppointment.id,
                ...data,
            }, {
                onSuccess: () => {
                    setEditDialogOpen(false);
                    setSelectedAppointment(null);
                }
            });
        }
    };

    const handleDeleteAppointment = async () => {
        if (selectedAppointment) {
            deleteAppointment.mutate(selectedAppointment.id, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setSelectedAppointment(null);
                }
            });
        }
    };

    const openEditDialog = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setDeleteDialogOpen(true);
    };

    const openDetailsDialog = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setDetailsDialogOpen(true);
    };

    const handleSelectEvent = (event: any) => {
        openDetailsDialog(event.resource);
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        // Auto-fill the form with selected date/time
        setCreateDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            scheduled: "outline",
            confirmed: "default",
            completed: "secondary",
            cancelled: "destructive",
        };

        const labels = {
            scheduled: "Agendado",
            confirmed: "Confirmado",
            completed: "Concluído",
            cancelled: "Cancelado",
        };

        return (
            <Badge variant={variants[status] || "outline"}>
                {labels[status] || status}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Compromissos</h1>

                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Compromisso
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Compromisso</DialogTitle>
                        </DialogHeader>
                        <AppointmentForm
                            onSubmit={handleCreateAppointment}
                            isLoading={createAppointment.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border bg-card">
                <CardHeader className="border-b border-border">
                    <CardTitle className="text-card-foreground">Calendário de Compromissos</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="rounded-lg border border-border overflow-hidden bg-background">
                        <Calendar
                            localizer={localizer}
                            events={calendarEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={calendarStyle}
                            view={view}
                            onView={setView}
                            date={date}
                            onNavigate={setDate}
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            selectable
                            eventPropGetter={eventStyleGetter}
                            culture="pt-BR"
                            messages={{
                                next: 'Próximo',
                                previous: 'Anterior',
                                today: 'Hoje',
                                month: 'Mês',
                                week: 'Semana',
                                day: 'Dia',
                                agenda: 'Agenda',
                                date: 'Data',
                                time: 'Hora',
                                event: 'Evento',
                                noEventsInRange: 'Não há compromissos neste período.',
                                showMore: (total) => `+${total} mais`,
                            }}
                            formats={{
                                monthHeaderFormat: 'MMMM YYYY',
                                dayHeaderFormat: 'dddd, DD/MM/YYYY',
                                dayRangeHeaderFormat: ({ start, end }) =>
                                    `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM/YYYY')}`,
                                agendaHeaderFormat: ({ start, end }) =>
                                    `${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`,
                                selectRangeFormat: ({ start, end }) =>
                                    `${moment(start).format('DD/MM/YYYY')} - ${moment(end).format('DD/MM/YYYY')}`,
                                agendaDateFormat: 'DD/MM/YYYY',
                                agendaTimeFormat: 'HH:mm',
                                agendaTimeRangeFormat: ({ start, end }) =>
                                    `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalhes do Compromisso</DialogTitle>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg">{selectedAppointment.title}</h3>
                                {getStatusBadge(selectedAppointment.status)}
                            </div>

                            {selectedAppointment.description && (
                                <div className="flex items-start space-x-2">
                                    <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Descrição</p>
                                        <p className="text-sm text-muted-foreground">{selectedAppointment.description}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Data e Hora</p>
                                    <p className="text-sm text-muted-foreground">
                                        {moment(selectedAppointment.appointmentDate).format('DD/MM/YYYY')} às {selectedAppointment.appointmentTime}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Duração: {selectedAppointment.durationMinutes} minutos
                                    </p>
                                </div>
                            </div>

                            {selectedAppointment.clientName && (
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Cliente</p>
                                        <p className="text-sm text-muted-foreground">{selectedAppointment.clientName}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-2 pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setDetailsDialogOpen(false);
                                        openEditDialog(selectedAppointment);
                                    }}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setDetailsDialogOpen(false);
                                        openDeleteDialog(selectedAppointment);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Compromisso</DialogTitle>
                    </DialogHeader>
                    {selectedAppointment && (
                        <AppointmentForm
                            onSubmit={handleEditAppointment}
                            isLoading={updateAppointment.isPending}
                            defaultValues={{
                                title: selectedAppointment.title,
                                description: selectedAppointment.description,
                                appointmentDate: selectedAppointment.appointmentDate,
                                appointmentTime: selectedAppointment.appointmentTime,
                                durationMinutes: selectedAppointment.durationMinutes,
                                clientId: selectedAppointment.clientId,
                                status: selectedAppointment.status,
                            }}
                            isEditing
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Compromisso</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o compromisso "{selectedAppointment?.title}"?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAppointment}
                            disabled={deleteAppointment.isPending}
                        >
                            {deleteAppointment.isPending ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Appointments; 