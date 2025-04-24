
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockSubscriptions, mockClients, plans } from "@/lib/mock-data";
import { formatDate, isAboutToExpire } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, BarChart2 } from "lucide-react";

const Subscriptions = () => {
  const [subscriptions] = useState(mockSubscriptions);

  const getSubscriptionStatus = (subscription: typeof mockSubscriptions[0]) => {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (!subscription.active) return "inactive";
    if (endDate < now) return "expired";
    if (isAboutToExpire(endDate)) return "expiring";
    return "active";
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Matrículas</h1>
        <Button className="bg-gym-primary hover:bg-gym-secondary">
          <Plus className="mr-2 h-4 w-4" />
          Nova Matrícula
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {Object.values(plans).map((plan) => (
          <Card key={plan.type} className="overflow-hidden">
            <CardHeader className={`${plan.color} py-3`}>
              <CardTitle className="text-center">{plan.type}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold mb-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(plan.priceBrl)}
              </div>
              <p className="text-muted-foreground mb-4">
                {plan.durationMonths === 1 
                  ? 'Mensal'
                  : plan.durationMonths === 3 
                    ? 'Trimestral' 
                    : 'Anual'}
              </p>
              <Button className="w-full bg-gym-primary hover:bg-gym-secondary">
                Selecionar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Matrículas</CardTitle>
          <Button variant="outline" size="sm">
            <BarChart2 className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Fim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => {
                const client = mockClients.find(c => c.id === subscription.clientId);
                const status = getSubscriptionStatus(subscription);
                
                return (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{client?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={plans[subscription.plan]?.color}>
                        {subscription.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(subscription.startDate)}</TableCell>
                    <TableCell>{formatDate(subscription.endDate)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        status === "active" 
                          ? "success" 
                          : status === "expiring" 
                            ? "warning" 
                            : status === "expired" 
                              ? "destructive" 
                              : "outline"
                      }>
                        {status === "active" 
                          ? "Ativa" 
                          : status === "expiring" 
                            ? "A Vencer" 
                            : status === "expired" 
                              ? "Vencida" 
                              : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscriptions;
