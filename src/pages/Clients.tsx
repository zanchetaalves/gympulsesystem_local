
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
import { mockClients } from "@/lib/mock-data";
import { formatDate, formatCPF, formatPhone, calculateAge } from "@/lib/utils";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { mockSubscriptions } from "@/lib/mock-data";

const Clients = () => {
  const [clients] = useState(mockClients);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf.includes(searchTerm) ||
      client.phone.includes(searchTerm)
  );

  const getClientSubscriptionStatus = (clientId: string) => {
    const subscription = mockSubscriptions.find(
      (sub) => sub.clientId === clientId && sub.active
    );
    return subscription ? "Ativo" : "Inativo";
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button className="bg-gym-primary hover:bg-gym-secondary">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buscar Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{formatCPF(client.cpf)}</TableCell>
                    <TableCell>{formatPhone(client.phone)}</TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>{calculateAge(client.birthDate)} anos</TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          getClientSubscriptionStatus(client.id) === "Ativo"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getClientSubscriptionStatus(client.id)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
