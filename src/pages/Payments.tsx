
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
import { mockPayments, mockClients, mockSubscriptions } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, BarChart2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Payment, Subscription } from "@/types";

const Payments = () => {
  const [payments, setPayments] = useState(mockPayments);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectSubscriptionDialogOpen, setSelectSubscriptionDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreatePayment = async (data: any) => {
    setIsLoading(true);
    try {
      // Simulando uma chamada de API
      const newPayment = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      };
      
      // Adicionar dados do cliente e matrícula para exibição
      const subscription = mockSubscriptions.find(sub => sub.id === data.subscriptionId);
      if (subscription) {
        const client = mockClients.find(c => c.id === subscription.clientId);
        if (client) {
          newPayment.client = client;
          newPayment.subscription = subscription;
        }
      }
      
      setPayments([newPayment, ...payments]);
      setCreateDialogOpen(false);
      setSelectSubscriptionDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Pagamento cadastrado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedSubscription(null);
    }
  };

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    try {
      if (!selectedPayment) return;
      
      const updatedPayments = payments.map(payment => 
        payment.id === selectedPayment.id ? { ...payment, confirmed: true } : payment
      );
      
      setPayments(updatedPayments);
      setConfirmDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Pagamento confirmado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedPayment(null);
    }
  };

  const selectSubscriptionForPayment = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setSelectSubscriptionDialogOpen(false);
    setCreateDialogOpen(true);
  };

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
                  {mockSubscriptions
                    .filter(sub => sub.active)
                    .map((subscription) => {
                      const client = mockClients.find(c => c.id === subscription.clientId);
                      return (
                        <TableRow key={subscription.id}>
                          <TableCell>{client?.name}</TableCell>
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
                      );
                    })}
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
              isLoading={isLoading} 
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
              {payments.map((payment) => {
                const client = mockClients.find(
                  (c) => c.id === payment.client?.id
                );
                
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{client?.name}</TableCell>
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
                              disabled={isLoading}
                              className="bg-gym-primary text-primary-foreground hover:bg-gym-secondary"
                            >
                              {isLoading ? "Confirmando..." : "Confirmar pagamento"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export default Payments;
