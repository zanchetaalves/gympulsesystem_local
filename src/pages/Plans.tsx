
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
import { Badge } from "@/components/ui/badge";
import { Plus, Edit } from "lucide-react";
import { PlanForm } from "@/components/plans/PlanForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plan } from "@/types";
import { usePlans } from "@/hooks/usePlans";
import { formatCurrency } from "@/lib/utils";

const Plans = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const { 
    plans, 
    isLoading,
    createPlan,
    updatePlan
  } = usePlans();

  const handleCreatePlan = async (data: any) => {
    await createPlan.mutateAsync(data);
    setCreateDialogOpen(false);
  };

  const handleEditPlan = async (data: any) => {
    await updatePlan.mutateAsync(data);
    setEditDialogOpen(false);
    setSelectedPlan(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planos</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Plano</DialogTitle>
            </DialogHeader>
            <PlanForm 
              onSubmit={handleCreatePlan} 
              isLoading={createPlan.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Planos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Carregando planos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Duração (meses)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Nenhum plano cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={plan.color}>
                          {plan.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(plan.priceBrl)}</TableCell>
                      <TableCell>{plan.durationMonths}</TableCell>
                      <TableCell>
                        <Badge variant={plan.active ? "success" : "secondary"}>
                          {plan.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog 
                          open={editDialogOpen && selectedPlan?.id === plan.id} 
                          onOpenChange={(open) => {
                            setEditDialogOpen(open);
                            if (!open) setSelectedPlan(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setSelectedPlan(plan)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Plano</DialogTitle>
                            </DialogHeader>
                            {selectedPlan && (
                              <PlanForm 
                                onSubmit={handleEditPlan} 
                                isLoading={updatePlan.isPending} 
                                defaultValues={selectedPlan}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
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

export default Plans;
