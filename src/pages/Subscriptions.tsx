
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
import { formatDate, isAboutToExpire } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, BarChart2, Search } from "lucide-react";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Subscription, Client } from "@/types";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useClients } from "@/hooks/useClients";
import { usePlans } from "@/hooks/usePlans";

const Subscriptions = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectClientDialogOpen, setSelectClientDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  
  // Using hooks to fetch data from Supabase
  const { 
    subscriptions, 
    isLoading: isLoadingSubscriptions,
    createSubscription,
    updateSubscription
  } = useSubscriptions();
  
  const { clients } = useClients();
  const { plans } = usePlans();

  const handleCreateSubscription = async (data: any) => {
    createSubscription.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setSelectClientDialogOpen(false);
        setSelectedClient(null);
      }
    });
  };

  const handleEditSubscription = async (data: any) => {
    if (!selectedSubscription) return;
    
    updateSubscription.mutate({
      ...data,
      id: selectedSubscription.id // Ensure the subscription ID is included for the update
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedSubscription(null);
      }
    });
  };

  const selectClientForSubscription = (client: Client) => {
    setSelectedClient(client);
    setSelectClientDialogOpen(false);
    setCreateDialogOpen(true);
  };

  const getSubscriptionStatus = (subscription: Subscription) => {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (!subscription.active) return "inactive";
    if (endDate < now) return "expired";
    if (isAboutToExpire(endDate)) return "expiring";
    return "active";
  };

  // Get active plans
  const activePlans = plans.filter(p => p.active);

  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
  );

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
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar cliente por nome..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
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
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
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
                    ))
                  )}
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
              isLoading={createSubscription.isPending}
              selectedClientId={selectedClient?.id}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {activePlans.map((plan) => (
          <Card key={plan.id} className="overflow-hidden">
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
          {isLoadingSubscriptions ? (
            <div className="flex justify-center py-8">
              <p>Carregando matrículas...</p>
            </div>
          ) : (
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
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Nenhuma matrícula cadastrada
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => {
                    const client = clients.find(c => c.id === subscription.clientId);
                    const status = getSubscriptionStatus(subscription);
                    const planColor = plans.find(p => p.type === subscription.plan)?.color || '';
                    
                    return (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">{client?.name || "Cliente não encontrado"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={planColor}>
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
                                  isLoading={updateSubscription.isPending} 
                                  defaultValues={selectedSubscription}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscriptions;
