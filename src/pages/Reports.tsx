
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  FileText, 
  CreditCard, 
  BarChart2,
  Check,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign
} from "lucide-react";
import { mockClients, mockSubscriptions, mockPayments } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Reports = () => {
  const [reportType, setReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    {
      id: "active-clients",
      title: "Relatório de Clientes Ativos",
      description: "Lista completa de todos os clientes ativos no sistema",
      icon: TrendingUp,
    },
    {
      id: "expired-subscriptions",
      title: "Relatório de Matrículas Vencidas",
      description: "Lista de matrículas que já venceram e precisam de renovação",
      icon: TrendingDown,
    },
    {
      id: "delinquent-clients",
      title: "Relatório de Inadimplentes",
      description: "Lista de clientes com pagamentos pendentes ou atrasados",
      icon: AlertTriangle,
    },
    {
      id: "financial",
      title: "Relatório Financeiro",
      description: "Análise de receitas e pagamentos por período",
      icon: DollarSign,
    },
  ];

  const generateReport = (reportId: string) => {
    setIsLoading(true);
    setReportType(reportId);
    
    setTimeout(() => {
      try {
        let data: any[] = [];
        
        switch (reportId) {
          case "active-clients":
            // Clientes com matrículas ativas
            const activeSubscriptions = mockSubscriptions.filter(sub => sub.active);
            const activeClientIds = new Set(activeSubscriptions.map(sub => sub.clientId));
            data = mockClients.filter(client => activeClientIds.has(client.id));
            break;
            
          case "expired-subscriptions":
            // Matrículas vencidas
            const now = new Date();
            const expiredSubscriptions = mockSubscriptions
              .filter(sub => sub.active && new Date(sub.endDate) < now)
              .map(sub => {
                const client = mockClients.find(c => c.id === sub.clientId);
                return { 
                  ...sub,
                  clientName: client?.name || "Desconhecido",
                  daysExpired: Math.floor((now.getTime() - new Date(sub.endDate).getTime()) / (1000 * 60 * 60 * 24))
                };
              });
            data = expiredSubscriptions;
            break;
            
          case "delinquent-clients":
            // Clientes inadimplentes (com matrículas ativas mas sem pagamentos recentes)
            const clientsWithActiveSubscriptions = mockSubscriptions
              .filter(sub => sub.active)
              .map(sub => {
                const client = mockClients.find(c => c.id === sub.clientId);
                const hasRecentPayment = mockPayments.some(
                  payment => payment.subscriptionId === sub.id && 
                  new Date(payment.paymentDate).getMonth() === new Date().getMonth()
                );
                
                return {
                  clientId: sub.clientId,
                  clientName: client?.name || "Desconhecido",
                  subscriptionId: sub.id,
                  plan: sub.plan,
                  endDate: sub.endDate,
                  isDelinquent: !hasRecentPayment
                };
              });
            
            data = clientsWithActiveSubscriptions.filter(item => item.isDelinquent);
            break;
            
          case "financial":
            // Relatório financeiro
            const lastMonthsPayments = mockPayments
              .filter(payment => payment.confirmed)
              .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
            
            // Agrupar por mês para relatório financeiro
            const paymentsByMonth: { [key: string]: number } = {};
            lastMonthsPayments.forEach(payment => {
              const date = new Date(payment.paymentDate);
              const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
              
              if (!paymentsByMonth[monthYear]) {
                paymentsByMonth[monthYear] = 0;
              }
              
              paymentsByMonth[monthYear] += payment.amount;
            });
            
            data = Object.entries(paymentsByMonth).map(([month, total]) => ({
              month,
              total,
              count: lastMonthsPayments.filter(p => {
                const date = new Date(p.paymentDate);
                const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
                return monthYear === month;
              }).length
            }));
            break;
        }
        
        setReportData(data);
        setIsLoading(false);
        setIsDialogOpen(true);
        
        toast({
          title: "Sucesso",
          description: "Relatório gerado com sucesso!",
        });
      } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        setIsLoading(false);
        toast({
          title: "Erro",
          description: "Erro ao gerar relatório. Tente novamente.",
          variant: "destructive",
        });
      }
    }, 1000); // Simulando processamento
  };

  const renderReportContent = () => {
    if (!reportData) return null;
    
    switch (reportType) {
      case "active-clients":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.email || "-"}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.cpf}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
        
      case "expired-subscriptions":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Dias Vencidos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.clientName}</TableCell>
                  <TableCell>{subscription.plan}</TableCell>
                  <TableCell>{formatDate(subscription.endDate)}</TableCell>
                  <TableCell>{subscription.daysExpired}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
        
      case "delinquent-clients":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item) => (
                <TableRow key={item.subscriptionId}>
                  <TableCell>{item.clientName}</TableCell>
                  <TableCell>{item.plan}</TableCell>
                  <TableCell>{formatDate(item.endDate)}</TableCell>
                  <TableCell className="text-red-600">Inadimplente</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
        
      case "financial":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês/Ano</TableHead>
                <TableHead>Total de Pagamentos</TableHead>
                <TableHead>Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item) => (
                <TableRow key={item.month}>
                  <TableCell>{item.month}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
        
      default:
        return null;
    }
  };

  const getReportTitle = () => {
    const report = reportTypes.find(r => r.id === reportType);
    return report ? report.title : "Relatório";
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="bg-gym-light p-3 rounded-lg">
                  <report.icon className="h-6 w-6 text-gym-primary" />
                </div>
                <CardTitle>{report.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {report.description}
              </p>
              <div className="flex space-x-2">
                <Button 
                  className="bg-gym-primary hover:bg-gym-secondary"
                  onClick={() => generateReport(report.id)}
                  disabled={isLoading}
                >
                  {isLoading && reportType === report.id ? (
                    <>Gerando...</>
                  ) : (
                    <>Gerar Relatório</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{getReportTitle()}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            {renderReportContent()}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Fechar
            </Button>
            <Button onClick={() => alert("Exportação simulada")}>
              Exportar para Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
