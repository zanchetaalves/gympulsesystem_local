
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
import { mockClients, plans } from "@/lib/mock-data";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Adapter functions to convert between database and application types
const dbToAppSubscription = (dbSubscription: any): Subscription => ({
  id: dbSubscription.id,
  clientId: dbSubscription.client_id,
  plan: dbSubscription.plan,
  startDate: new Date(dbSubscription.start_date),
  endDate: new Date(dbSubscription.end_date),
  active: dbSubscription.active ?? true,
});

const appToDbSubscription = (subscription: Partial<Subscription>) => ({
  id: subscription.id,
  client_id: subscription.clientId,
  plan: subscription.plan,
  start_date: subscription.startDate instanceof Date 
    ? subscription.startDate.toISOString() 
    : subscription.startDate,
  end_date: subscription.endDate instanceof Date 
    ? subscription.endDate.toISOString() 
    : subscription.endDate,
  active: subscription.active
});

const Subscriptions = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectClientDialogOpen, setSelectClientDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar matrículas.",
          variant: "destructive",
        });
        throw error;
      }

      // Convert database format to application format
      return (data || []).map(dbToAppSubscription);
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: Partial<Subscription>) => {
      const dbData = appToDbSubscription(data);
      
      const { data: newSubscription, error } = await supabase
        .from('subscriptions')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;
      return dbToAppSubscription(newSubscription);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setCreateDialogOpen(false);
      setSelectClientDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Matrícula cadastrada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar matrícula.",
        variant: "destructive",
      });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: Partial<Subscription>) => {
      const dbData = appToDbSubscription(data);
      
      const { data: updatedSubscription, error } = await supabase
        .from('subscriptions')
        .update(dbData)
        .eq('id', dbData.id)
        .select()
        .single();

      if (error) throw error;
      return dbToAppSubscription(updatedSubscription);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setEditDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Matrícula atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar matrícula.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubscription = async (data: any) => {
    createSubscriptionMutation.mutate(data);
  };

  const handleEditSubscription = async (data: any) => {
    updateSubscriptionMutation.mutate(data);
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
              isLoading={isLoadingSubscriptions}
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
                              isLoading={isLoadingSubscriptions} 
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
