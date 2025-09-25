
import { useState, useEffect } from "react";
import { CardMetric } from "@/components/ui/card-metric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart2, Calendar, CreditCard, User, Clock, EyeOff, Eye } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useClients } from "@/hooks/useClients";
import { usePayments } from "@/hooks/usePayments";
import { useAppointments } from "@/hooks/useAppointments";
import { sumConfirmedPayments } from "@/lib/money-utils";

const Dashboard = () => {
  const [showRevenue, setShowRevenue] = useState(false);

  // Carregar preferência salva no localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('dashboard-show-revenue');
    if (savedPreference !== null) {
      setShowRevenue(JSON.parse(savedPreference));
    }
  }, []);

  // Salvar preferência quando mudada
  const toggleRevenue = () => {
    const newValue = !showRevenue;
    setShowRevenue(newValue);
    localStorage.setItem('dashboard-show-revenue', JSON.stringify(newValue));
  };

  const { subscriptions } = useSubscriptions();
  const { clients } = useClients();
  const { payments } = usePayments();
  const { upcomingAppointments } = useAppointments();

  // Calculate metrics
  const totalClients = clients.length;
  const activeSubscriptions = subscriptions.filter(sub => sub.active).length;

  const totalRevenue = sumConfirmedPayments(payments);

  const expiringSubscriptions = subscriptions
    .filter(sub => {
      const now = new Date();
      const endDate = new Date(sub.endDate);
      const diff = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0 && sub.active;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <CardMetric
          title="Total de Clientes"
          value={totalClients}
          icon={<User className="h-6 w-6 text-gym-primary" />}
        />
        <CardMetric
          title="Matrículas Ativas"
          value={activeSubscriptions}
          icon={<BarChart2 className="h-6 w-6 text-gym-primary" />}
        />
        {/* Card customizado para receita com toggle de visibilidade */}
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200" onClick={toggleRevenue}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <div className="flex items-center mt-2 min-h-[2rem]">
                  {showRevenue ? (
                    <h3 className="text-2xl font-bold transition-all duration-300">{formatCurrency(totalRevenue)}</h3>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-6 bg-muted-foreground/40 rounded-full"></div>
                        <div className="w-2 h-6 bg-muted-foreground/40 rounded-full"></div>
                        <div className="w-2 h-6 bg-muted-foreground/40 rounded-full"></div>
                        <div className="w-8 h-6 bg-muted-foreground/40 rounded-full"></div>
                        <div className="w-2 h-6 bg-muted-foreground/40 rounded-full"></div>
                        <div className="w-2 h-6 bg-muted-foreground/40 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center transition-all duration-200">
                  {showRevenue ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Toque para ocultar a receita
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Toque para exibir a receita
                    </>
                  )}
                </p>
              </div>
              <div className="bg-gym-light p-3 rounded-lg transition-all duration-200">
                {showRevenue ? (
                  <CreditCard className="h-6 w-6 text-gym-primary" />
                ) : (
                  <EyeOff className="h-6 w-6 text-gym-primary" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <CardMetric
          title="Próximos Compromissos"
          value={upcomingAppointments.length}
          icon={<Calendar className="h-6 w-6 text-gym-primary" />}
        />
      </div>

      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Compromissos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <p className="text-muted-foreground">Nenhum compromisso nos próximos 5 dias</p>
              ) : (
                upcomingAppointments.slice(0, 5).map(appointment => (
                  <div key={appointment.id} className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <p className="font-semibold">{appointment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.clientName || 'Sem cliente'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(appointment.appointmentDate).toLocaleDateString('pt-BR')} às {appointment.appointmentTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}>
                        {appointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expiring Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Matrículas Vencendo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringSubscriptions.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma matrícula vencendo esta semana</p>
              ) : (
                expiringSubscriptions.map(subscription => {
                  const client = clients.find(c => c.id === subscription.clientId);
                  const endDate = new Date(subscription.endDate);
                  const today = new Date();
                  const diffTime = endDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <div key={subscription.id} className="flex justify-between items-center p-4 border rounded-md">
                      <div>
                        <p className="font-semibold">{client?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence em {diffDays} dia{diffDays !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-600 font-medium">
                          {endDate.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.slice(0, 5).map(payment => {
                const client = clients.find(c => c.id === payment.subscription?.clientId);

                return (
                  <div key={payment.id} className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <p className="font-semibold">{client?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.paymentDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className={`text-sm ${payment.confirmed ? 'text-gym-accent' : 'text-red-500'}`}>
                        {payment.confirmed ? 'Confirmado' : 'Pendente'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
