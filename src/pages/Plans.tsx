
import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { PlanForm } from "@/components/plans/PlanForm";
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
import { Plan } from "@/types";
import { usePlans } from "@/hooks/usePlans";
import { formatCurrency } from "@/lib/utils";

const Plans = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  // Removido isMounted - simplificando lógica

  const {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan
  } = usePlans();

  const handleCreatePlan = async (data: any) => {
    try {
      await createPlan.mutateAsync(data);
      setCreateDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Erro ao criar plano:', error);
    }
  };

  const handleEditPlan = async (data: any) => {
    if (!selectedPlan) return;

    try {
      await updatePlan.mutateAsync({
        ...data,
        id: selectedPlan.id // Ensure the plan ID is included for the update
      });
      setEditDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      // Deixa o dialog aberto em caso de erro
      console.error('Erro ao editar plano:', error);
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    deletePlan.mutate(selectedPlan.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedPlan(null);
      },
      onError: () => {
        // Mantém o dialog aberto em caso de erro
      }
    });
  };

  const openDeleteDialog = (plan: Plan) => {
    setEditDialogOpen(false);
    setCreateDialogOpen(false);
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (plan: Plan) => {
    setCreateDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedPlan(null);
    setCreateDialogOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planos</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Dialog de Criar Plano */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      >
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
                        <div className="flex space-x-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(plan)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {selectedPlan && (
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o plano "{selectedPlan?.name}"?
                Esta ação não pode ser desfeita e só será permitida se não houver matrículas associadas a este plano.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePlan}
                disabled={deletePlan.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletePlan.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog de Editar Plano */}
      {selectedPlan && (
        <Dialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        >
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
      )}
    </div>
  );
};

export default Plans;
