
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
import { Plus, Check, BarChart2, Search, X, Edit, Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Payment, Subscription } from "@/types";
import { usePayments } from "@/hooks/usePayments";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useClients } from "@/hooks/useClients";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/pagination";

const Payments = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectSubscriptionDialogOpen, setSelectSubscriptionDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [subscriptionSearchQuery, setSubscriptionSearchQuery] = useState("");

  // Estados para filtros
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Usando hooks personalizados
  const {
    payments,
    isLoading: isLoadingPayments,
    createPayment,
    updatePayment,
    deletePayment
  } = usePayments();

  const { subscriptions } = useSubscriptions();
  const { clients } = useClients();

  // Enrich subscriptions with client data
  const enrichedSubscriptions = subscriptions.map(subscription => {
    const client = clients.find(c => c.id === subscription.clientId);
    return {
      ...subscription,
      client: client || null
    };
  });

  const handleCreatePayment = async (data: any) => {
    createPayment.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setSelectSubscriptionDialogOpen(false);
        setSelectedSubscription(null);
      }
    });
  };

  const handleEditPayment = async (data: any) => {
    if (!selectedPayment) return;

    updatePayment.mutate({
      ...data,
      id: selectedPayment.id
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedPayment(null);
      }
    });
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    deletePayment.mutate(selectedPayment.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedPayment(null);
      }
    });
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;

    updatePayment.mutate({
      ...selectedPayment,
      id: selectedPayment.id, // Ensure the payment ID is included for the update
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

  // Função para verificar se uma matrícula já possui pagamento confirmado
  const subscriptionHasConfirmedPayment = (subscriptionId: string): boolean => {
    return payments.some(payment =>
      payment.subscriptionId === subscriptionId &&
      payment.confirmed
    );
  };

  // Filter subscriptions based on client name search query and confirmed payments
  const filteredSubscriptions = enrichedSubscriptions
    .filter(sub => sub.active)
    .filter(sub => !subscriptionHasConfirmedPayment(sub.id)) // Excluir matrículas com pagamento confirmado
    .filter(sub => {
      const clientName = sub.client?.name || "";
      return clientName.toLowerCase().includes(subscriptionSearchQuery.toLowerCase());
    });

  // Filter payments based on filters
  const filteredPayments = payments.filter((payment) => {
    // Filtro por cliente (busca por texto no nome)
    let matchesClient = true;
    if (clientFilter) {
      const subscription = subscriptions.find(sub => sub.id === payment.subscriptionId);
      const client = subscription ? clients.find(c => c.id === subscription.clientId) : null;
      matchesClient = client ? client.name.toLowerCase().includes(clientFilter.toLowerCase()) : false;
    }

    // Filtro por data
    let matchesDate = true;
    if (dateFilter) {
      const paymentDate = payment.paymentDate.toISOString().split('T')[0];
      matchesDate = paymentDate === dateFilter;
    }

    // Filtro por método
    const matchesMethod = methodFilter === "todos" || payment.paymentMethod === methodFilter;

    // Filtro por status
    const matchesStatus = statusFilter === "todos" ||
      (statusFilter === "confirmado" && payment.confirmed) ||
      (statusFilter === "pendente" && !payment.confirmed);

    return matchesClient && matchesDate && matchesMethod && matchesStatus;
  });

  // Paginação
  const pagination = usePagination({
    data: filteredPayments,
    itemsPerPage: 6,
    dependencies: [clientFilter, dateFilter, methodFilter, statusFilter]
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
                      <TableCell colSpan={3} className="text-center py-6">
                        {subscriptionSearchQuery ? (
                          <div>
                            <p className="text-muted-foreground">Nenhuma matrícula encontrada</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Tente ajustar o termo de busca
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-muted-foreground">Nenhuma matrícula disponível</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Todas as matrículas já possuem pagamentos confirmados
                            </p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          {subscription.client?.name || "Cliente não encontrado"}
                        </TableCell>
                        <TableCell>{subscription.plan || "Plano não definido"}</TableCell>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome do cliente"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="relative">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-foreground [&::-webkit-calendar-picker-indicator]:opacity-80 [&::-webkit-calendar-picker-indicator]:cursor-pointer pr-8"
                title="Filtrar por data"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Limpar data"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Métodos</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
                {pagination.paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      {filteredPayments.length === 0 ? "Nenhum pagamento encontrado com os filtros aplicados" : "Nenhum pagamento nesta página"}
                    </TableCell>
                  </TableRow>
                ) : (
                  pagination.paginatedData.map((payment) => (
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
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Confirmar (apenas para pagamentos não confirmados) */}
                          {!payment.confirmed && (
                            <AlertDialog
                              open={confirmDialogOpen && selectedPayment?.id === payment.id}
                              onOpenChange={(open) => {
                                setConfirmDialogOpen(open);
                                if (!open) setSelectedPayment(null);
                              }}
                            >
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
                          )}

                          {/* Botão Editar */}
                          <Dialog open={editDialogOpen && selectedPayment?.id === payment.id} onOpenChange={(open) => {
                            setEditDialogOpen(open);
                            if (!open) setSelectedPayment(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedPayment(payment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Editar Pagamento</DialogTitle>
                              </DialogHeader>
                              {selectedPayment && (
                                <PaymentForm
                                  onSubmit={handleEditPayment}
                                  isLoading={updatePayment.isPending}
                                  defaultValues={selectedPayment}
                                  selectedSubscriptionId={selectedPayment.subscriptionId}
                                />
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Botão Excluir */}
                          <AlertDialog
                            open={deleteDialogOpen && selectedPayment?.id === payment.id}
                            onOpenChange={(open) => {
                              setDeleteDialogOpen(open);
                              if (!open) setSelectedPayment(null);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedPayment(payment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Pagamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este pagamento no valor de {formatCurrency(selectedPayment?.amount || 0)}? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeletePayment}
                                  disabled={deletePayment.isPending}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deletePayment.isPending ? "Excluindo..." : "Excluir"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={filteredPayments.length}
            itemsPerPage={6}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={pagination.setCurrentPage}
            onPreviousPage={pagination.goToPreviousPage}
            onNextPage={pagination.goToNextPage}
            canGoPrevious={pagination.canGoPrevious}
            canGoNext={pagination.canGoNext}
            itemName="pagamentos"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
