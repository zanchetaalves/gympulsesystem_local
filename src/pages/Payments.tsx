
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
import { mockPayments, mockClients } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, BarChart2 } from "lucide-react";

const Payments = () => {
  const [payments] = useState(mockPayments);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pagamentos</h1>
        <Button className="bg-gym-primary hover:bg-gym-secondary">
          <Plus className="mr-2 h-4 w-4" />
          Novo Pagamento
        </Button>
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
                      {!payment.confirmed && (
                        <Button variant="outline" size="sm">
                          <Check className="mr-2 h-4 w-4" />
                          Confirmar
                        </Button>
                      )}
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
