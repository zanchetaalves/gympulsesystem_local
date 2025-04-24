
import { CardMetric } from "@/components/ui/card-metric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockClients, mockSubscriptions, mockPayments } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { BarChart2, Calendar, CreditCard, User } from "lucide-react";

const Dashboard = () => {
  // Calculate metrics
  const totalClients = mockClients.length;
  const activeSubscriptions = mockSubscriptions.filter(sub => sub.active).length;
  
  const totalRevenue = mockPayments
    .filter(payment => payment.confirmed)
    .reduce((total, payment) => total + payment.amount, 0);
    
  const expiringSubscriptions = mockSubscriptions
    .filter(sub => {
      const now = new Date();
      const endDate = new Date(sub.endDate);
      const diff = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0 && sub.active;
    });

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <CardMetric 
          title="Total de Clientes" 
          value={totalClients}
          icon={<User className="h-6 w-6 text-gym-primary" />}
        />
        
        <CardMetric 
          title="Matrículas Ativas" 
          value={activeSubscriptions}
          icon={<Calendar className="h-6 w-6 text-gym-primary" />}
        />
        
        <CardMetric 
          title="Faturamento Total" 
          value={formatCurrency(totalRevenue)}
          icon={<CreditCard className="h-6 w-6 text-gym-primary" />}
        />
        
        <CardMetric 
          title="Matrículas a Vencer" 
          value={expiringSubscriptions.length}
          icon={<BarChart2 className="h-6 w-6 text-gym-primary" />}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Matrículas Próximas do Vencimento</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringSubscriptions.length > 0 ? (
              <div className="space-y-4">
                {expiringSubscriptions.map(subscription => {
                  const client = mockClients.find(c => c.id === subscription.clientId);
                  const endDate = new Date(subscription.endDate);
                  const now = new Date();
                  const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={subscription.id} className="flex justify-between items-center p-4 border rounded-md">
                      <div>
                        <p className="font-semibold">{client?.name}</p>
                        <p className="text-sm text-muted-foreground">Plano: {subscription.plan}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-500">{diffDays} dias</p>
                        <p className="text-sm text-muted-foreground">
                          Vence: {endDate.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Não há matrículas próximas do vencimento.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPayments.slice(0, 5).map(payment => {
                const client = mockClients.find(c => c.id === payment.subscription?.clientId);
                
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
