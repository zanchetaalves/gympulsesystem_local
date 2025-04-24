
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  FileText, 
  CreditCard, 
  BarChart2 
} from "lucide-react";

const Reports = () => {
  const reportTypes = [
    {
      title: "Relatório de Clientes Ativos",
      description: "Lista completa de todos os clientes ativos no sistema",
      icon: User,
    },
    {
      title: "Relatório de Matrículas Vencidas",
      description: "Lista de matrículas que já venceram e precisam de renovação",
      icon: FileText,
    },
    {
      title: "Relatório de Inadimplentes",
      description: "Lista de clientes com pagamentos pendentes ou atrasados",
      icon: CreditCard,
    },
    {
      title: "Relatório Financeiro",
      description: "Análise de receitas e pagamentos por período",
      icon: BarChart2,
    },
  ];

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
                <Button className="bg-gym-primary hover:bg-gym-secondary">
                  Gerar Relatório
                </Button>
                <Button variant="outline">
                  Visualizar Último
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
