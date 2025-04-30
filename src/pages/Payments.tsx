
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
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, BarChart2, Search } from "lucide-react";
import { PaymentForm } from "@/components/payments/PaymentForm";
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
import { Input } from "@/components/ui/input";
import { Payment, Subscription } from "@/types";
import { usePayments } from "@/hooks/usePayments";
import { useSubscriptions } from "@/hooks/useSubscriptions";

const Payments = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectSubscriptionDialogOpen, setSelectSubscriptionDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [subscriptionSearchQuery, setSubscriptionSearchQuery] = useState("");
  
  // Usando hooks personalizados
  const { 
    payments, 
    isLoading: isLoadingPayments,
    createPayment,
    updatePayment
  } = usePayments();
  
  const { subscriptions } = useSubscriptions();

  const handleCreatePayment = async (data: any) => {
    createPayment.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setSelectSubscriptionDialogOpen(false);
        setSelectedSubscription(null);
      }
    });
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    
    updatePayment.mutate({
      ...selectedPayment,
      confirmed: true
    }, {
      onSuccess: () => {
        setConfirmDialogOpen(false);
        setSelectedPayment(null);
      }
    });
  };

  const selectSubscriptionForPayment = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setSelectSubscriptionDialogOpen(false);
    setCreateDialogOpen(true);
  };

  // Filter subscriptions based on client name search query
  const filteredSubscriptions = subscriptions
    .filter(sub => sub.active)
    .filter(sub => {
      const clientName = sub.client?.name || "";
      return clientName.toLowerCase().includes(subscriptionSearchQuery.toLowerCase());
    });

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pagamentos</h1>
        <Dialog open={selectSubscriptionDialogOpen} onOpenChange={setSelectSubscriptionDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gym-primary hover:bg-gym-secondary">
              <Plus className="mr-2 h-4 w-4" />
              Novo Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Matrícula para Pagamento</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome do cliente..."
                  value={subscriptionSearchQuery}
                  onChange={(e) => setSubscriptionSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        Nenhuma matrícula encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          {subscription.client?.name || "Cliente não encontrado"}
                        </TableCell>
                        <TableCell>{subscription.plan}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => selectSubscriptionForPayment(subscription)}
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
              <DialogTitle>Cadastrar Novo Pagamento</DialogTitle>
            </DialogHeader>
            <PaymentForm 
              onSubmit={handleCreatePayment} 
              isLoading={createPayment.isPending}
              selectedSubscriptionId={selectedSubscription?.id}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <Button variant="outline" size="sm">
            <BarChart2 className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingPayments ? (
            <div className="flex justify-center py-8">
              <p>Carregando pagamentos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Nenhum pagamento cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.client?.name || "Cliente não encontrado"}</TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.confirmed ? "success" : "outline"}>
                          {payment.confirmed ? "Confirmado" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog 
                          open={confirmDialogOpen && selectedPayment?.id === payment.id}
                          onOpenChange={(open) => {
                            setConfirmDialogOpen(open);
                            if (!open) setSelectedPayment(null);
                          }}
                        >
                          {!payment.confirmed && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setConfirmDialogOpen(true);
                              }}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Confirmar
                            </Button>
                          )}
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Você está confirmando o recebimento do pagamento no valor de {formatCurrency(selectedPayment?.amount || 0)}. Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleConfirmPayment}
                                disabled={updatePayment.isPending}
                                className="bg-gym-primary text-primary-foreground hover:bg-gym-secondary"
                              >
                                {updatePayment.isPending ? "Confirmando..." : "Confirmar pagamento"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
