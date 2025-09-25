
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatCPF, formatPhone, calculateAge } from "@/lib/utils";
import { Plus, Search, Edit, Trash2, Camera } from "lucide-react";
import { ClientForm } from "@/components/clients/ClientForm";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Client } from "@/types";
import { useClients } from "@/hooks/useClients";
import { useSubscriptions } from "@/hooks/useSubscriptions";

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Usando hooks personalizados
  const {
    clients,
    isLoading: isLoadingClients,
    createClient,
    updateClient,
    deleteClient
  } = useClients();

  const { subscriptions } = useSubscriptions();

  const getClientSubscriptionStatus = (clientId: string) => {
    const subscription = subscriptions.find(
      (sub) => sub.clientId === clientId && sub.active
    );
    return subscription ? "Ativo" : "Inativo";
  };

  const filteredClients = clients.filter(
    (client) => {
      // Filtro de busca por texto
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.cpf && client.cpf.includes(searchTerm)) ||
        (client.phone && client.phone.includes(searchTerm));

      // Filtro por status
      const clientStatus = getClientSubscriptionStatus(client.id);
      const matchesStatus = statusFilter === "todos" ||
        (statusFilter === "ativo" && clientStatus === "Ativo") ||
        (statusFilter === "inativo" && clientStatus === "Inativo");

      return matchesSearch && matchesStatus;
    }
  );

  const handleCreateClient = async (data: any) => {
    createClient.mutate({
      ...data,
      createdAt: new Date(),
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      }
    });
  };

  const handleEditClient = async (data: any) => {
    if (!selectedClient) return;

    updateClient.mutate({
      ...data,
      id: selectedClient.id // Ensure the client ID is included for the update
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedClient(null);
      }
    });
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    deleteClient.mutate(selectedClient.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedClient(null);
      },
      onError: () => {
        // Mantém o dialog aberto em caso de erro
      }
    });
  };

  // Function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gym-primary hover:bg-gym-secondary">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <ClientForm onSubmit={handleCreateClient} isLoading={createClient.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome, CPF ou telefone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingClients ? (
            <div className="flex justify-center py-8">
              <p>Carregando clientes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        Nenhum cliente cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Avatar>
                            <AvatarImage src={client.photoUrl || undefined} />
                            <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{formatCPF(client.cpf)}</TableCell>
                        <TableCell>{formatPhone(client.phone)}</TableCell>
                        <TableCell>{client.email || "-"}</TableCell>
                        <TableCell>{calculateAge(client.birthDate) || "-"} {calculateAge(client.birthDate) ? "anos" : ""}</TableCell>
                        <TableCell>
                          <div
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getClientSubscriptionStatus(client.id) === "Ativo"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {getClientSubscriptionStatus(client.id)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(client.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Dialog open={editDialogOpen && selectedClient?.id === client.id} onOpenChange={(open) => {
                            setEditDialogOpen(open);
                            if (!open) setSelectedClient(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedClient(client)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Editar Cliente</DialogTitle>
                              </DialogHeader>
                              {selectedClient && (
                                <ClientForm
                                  onSubmit={handleEditClient}
                                  isLoading={updateClient.isPending}
                                  defaultValues={selectedClient}
                                />
                              )}
                            </DialogContent>
                          </Dialog>

                          <AlertDialog
                            open={deleteDialogOpen && selectedClient?.id === client.id}
                            onOpenChange={(open) => {
                              setDeleteDialogOpen(open);
                              if (!open) setSelectedClient(null);
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedClient(client);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O cliente será permanentemente excluído.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteClient}
                                  disabled={deleteClient.isPending}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteClient.isPending ? "Excluindo..." : "Excluir"}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
