
import { useState } from "react";
import { Navigate } from "react-router-dom";
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
import { UserForm } from "@/components/users/UserForm";
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
import { useUsers, AuthUser } from "@/hooks/useUsers";

const Users = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  
  // Using the updated hook to manage users
  const { 
    users, 
    isLoading: isLoadingUsers,
    createUser,
    updateUser,
    deleteUser,
    hasAccess
  } = useUsers();

  // If the user doesn't have access, redirect to home
  if (!hasAccess) {
    return <Navigate to="/" />;
  }

  const handleCreateUser = async (data: any) => {
    createUser.mutate({
      email: data.email,
      password: data.password || '',
      name: data.name,
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      }
    });
  };

  const handleEditUser = async (data: any) => {
    if (!selectedUser) return;
    
    updateUser.mutate({
      id: selectedUser.id,
      email: data.email,
      metadata: {
        ...selectedUser.user_metadata,
        name: data.name
      }
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedUser(null);
      }
    });
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    deleteUser.mutate(selectedUser.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usuários do Sistema</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gym-primary hover:bg-gym-secondary">
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <UserForm 
              onSubmit={handleCreateUser} 
              isLoading={createUser.isPending} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <p>Carregando usuários...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Nenhum usuário cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.user_metadata?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.app_metadata?.provider || 'Email'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(new Date(user.created_at))}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={editDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setEditDialogOpen(open);
                          if (!open) setSelectedUser(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Usuário</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <UserForm 
                                onSubmit={handleEditUser} 
                                isLoading={updateUser.isPending} 
                                defaultValues={{
                                  id: selectedUser.id,
                                  name: selectedUser.user_metadata?.name || '',
                                  email: selectedUser.email,
                                }}
                                isEditing
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog 
                          open={deleteDialogOpen && selectedUser?.id === user.id}
                          onOpenChange={(open) => {
                            setDeleteDialogOpen(open);
                            if (!open) setSelectedUser(null);
                          }}
                        >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O usuário será permanentemente excluído.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDeleteUser}
                                disabled={deleteUser.isPending}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteUser.isPending ? "Excluindo..." : "Excluir"}
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

export default Users;
