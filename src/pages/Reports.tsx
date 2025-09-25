
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { usePayments } from "@/hooks/usePayments";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useClients } from "@/hooks/useClients";
import { toSafeNumber } from "@/lib/money-utils";

const Reports = () => {
  const { payments } = usePayments();
  const { subscriptions } = useSubscriptions();
  const { clients } = useClients();

  // Calculate monthly payments for the current year
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = Array(12).fill(0);

  payments.forEach(payment => {
    if (payment.confirmed) {
      const paymentDate = new Date(payment.paymentDate);
      if (paymentDate.getFullYear() === currentYear) {
        monthlyRevenue[paymentDate.getMonth()] += toSafeNumber(payment.amount);
      }
    }
  });

  const monthlyData = monthlyRevenue.map((amount, index) => ({
    month: format(new Date(currentYear, index, 1), 'MMM', { locale: ptBR }),
    amount
  }));

  // Calculate active, inactive, and expiring subscriptions
  const now = new Date();
  const activeCount = subscriptions.filter(sub => sub.active && new Date(sub.endDate) >= now).length;
  const expiredCount = subscriptions.filter(sub => new Date(sub.endDate) < now).length;
  const inactiveCount = subscriptions.filter(sub => !sub.active).length;

  // Calculate clients by subscription status
  const clientStatusCounts = {
    active: 0,
    expired: 0,
    none: 0
  };

  clients.forEach(client => {
    const clientSubs = subscriptions.filter(sub => sub.clientId === client.id);
    if (clientSubs.length === 0) {
      clientStatusCounts.none++;
    } else if (clientSubs.some(sub => sub.active && new Date(sub.endDate) >= now)) {
      clientStatusCounts.active++;
    } else {
      clientStatusCounts.expired++;
    }
  });

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Clientes por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge className="bg-green-100 text-green-800 mr-2">Ativos</Badge>
                </div>
                <span className="font-semibold">{clientStatusCounts.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge className="bg-red-100 text-red-800 mr-2">Expirados</Badge>
                </div>
                <span className="font-semibold">{clientStatusCounts.expired}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge className="bg-gray-100 text-gray-800 mr-2">Sem Matrícula</Badge>
                </div>
                <span className="font-semibold">{clientStatusCounts.none}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Matrículas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge variant="success" className="mr-2">Ativas</Badge>
                </div>
                <span className="font-semibold">{activeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge variant="destructive" className="mr-2">Expiradas</Badge>
                </div>
                <span className="font-semibold">{expiredCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">Inativas</Badge>
                </div>
                <span className="font-semibold">{inactiveCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Faturamento {currentYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(monthlyRevenue.reduce((a, b) => a + b, 0))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total acumulado no ano
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faturamento Mensal - {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$${value}`} />
                <Tooltip
                  formatter={(value) => [`${formatCurrency(Number(value))}`, 'Faturamento']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
