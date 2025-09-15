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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { formatDate } from "@/lib/utils";
import { usePlanTypes, PlanType } from "@/hooks/usePlanTypes";
import { PlanTypeForm } from "@/components/plan-types/PlanTypeForm";

const PlanTypes = () => {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(null);

    const {
        planTypes,
        isLoading,
        createPlanType,
        updatePlanType,
        deletePlanType
    } = usePlanTypes();

    const handleCreatePlanType = async (data: any) => {
        createPlanType.mutate({
            name: data.name,
            description: data.description,
        }, {
            onSuccess: () => {
                setCreateDialogOpen(false);
            }
        });
    };

    const handleEditPlanType = async (data: any) => {
        if (selectedPlanType) {
            updatePlanType.mutate({
                id: selectedPlanType.id,
                name: data.name,
                description: data.description,
            }, {
                onSuccess: () => {
                    setEditDialogOpen(false);
                    setSelectedPlanType(null);
                }
            });
        }
    };

    const handleDeletePlanType = async () => {
        if (selectedPlanType) {
            deletePlanType.mutate(selectedPlanType.id, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setSelectedPlanType(null);
                }
            });
        }
    };

    const openEditDialog = (planType: PlanType) => {
        setSelectedPlanType(planType);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (planType: PlanType) => {
        setSelectedPlanType(planType);
        setDeleteDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Tipos de Planos</h1>

                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Tipo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Tipo de Plano</DialogTitle>
                        </DialogHeader>
                        <PlanTypeForm
                            onSubmit={handleCreatePlanType}
                            isLoading={createPlanType.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Tipos de Planos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {planTypes.map((planType) => (
                                <TableRow key={planType.id}>
                                    <TableCell className="font-medium">{planType.name}</TableCell>
                                    <TableCell>{planType.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={planType.active ? "default" : "secondary"}>
                                            {planType.active ? "Ativo" : "Inativo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(planType.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditDialog(planType)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDeleteDialog(planType)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Tipo de Plano</DialogTitle>
                    </DialogHeader>
                    {selectedPlanType && (
                        <PlanTypeForm
                            onSubmit={handleEditPlanType}
                            isLoading={updatePlanType.isPending}
                            defaultValues={{
                                name: selectedPlanType.name,
                                description: selectedPlanType.description,
                            }}
                            isEditing
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Tipo de Plano</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o tipo "{selectedPlanType?.name}"?
                            Esta ação não pode ser desfeita e pode afetar planos existentes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePlanType}
                            disabled={deletePlanType.isPending}
                        >
                            {deletePlanType.isPending ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PlanTypes; 