
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
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Subscription, Client } from "@/types";

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState(mockSubscriptions);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectClientDialogOpen, setSelectClientDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getSubscriptionStatus = (subscription: typeof mockSubscriptions[0]) => {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (!subscription.active) return "inactive";
    if (endDate < now) return "expired";
    if (isAboutToExpire(endDate)) return "expiring";
    return "active";
  };

  const handleCreateSubscription = async (data: any) => {
    setIsLoading(true);
    try {
      // Simulando uma chamada de API
      const newSubscription = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      };
      
      setSubscriptions([newSubscription, ...subscriptions]);
      setCreateDialogOpen(false);
      setSelectClientDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Matrícula cadastrada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar matrícula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedClient(null);
    }
  };

  const handleEditSubscription = async (data: any) => {
    setIsLoading(true);
    try {
      const updatedSubscriptions = subscriptions.map(subscription => 
        subscription.id === data.id ? { ...subscription, ...data } : subscription
      );
      
      setSubscriptions(updatedSubscriptions);
      setEditDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Matrícula atualizada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar matrícula.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedSubscription(null);
    }
  };

  const selectClientForSubscription = (client: Client) => {
    setSelectedClient(client);
    setSelectClientDialogOpen(false);
    setCreateDialogOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Matrículas</h1>
        <Dialog open={selectClientDialogOpen} onOpenChange={setSelectClientDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gym-primary hover:bg-gym-secondary">
              <Plus className="mr-2 h-4 w-4" />
              Nova Matrícula
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Cliente para Matrícula</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.cpf}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => selectClientForSubscription(client)}
                        >
                          Selecionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Matrícula</DialogTitle>
            </DialogHeader>
            <SubscriptionForm 
              onSubmit={handleCreateSubscription} 
              isLoading={isLoading}
              selectedClientId={selectedClient?.id}
            />
          </DialogContent>
        </Dialog>
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
              <Button 
                className="w-full bg-gym-primary hover:bg-gym-secondary"
                onClick={() => setSelectClientDialogOpen(true)}
              >
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
                      <Dialog 
                        open={editDialogOpen && selectedSubscription?.id === subscription.id} 
                        onOpenChange={(open) => {
                          setEditDialogOpen(open);
                          if (!open) setSelectedSubscription(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedSubscription(subscription)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Matrícula</DialogTitle>
                          </DialogHeader>
                          {selectedSubscription && (
                            <SubscriptionForm 
                              onSubmit={handleEditSubscription} 
                              isLoading={isLoading} 
                              defaultValues={selectedSubscription}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
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
