
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createErrorHandler, getErrorMessage } from "@/lib/error-utils";

// Define the User type for our auth system
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export const useUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const handleError = createErrorHandler('Gestão de Usuários');

  // Check if current user has access to this feature
  const hasAccess = isAdmin;

  // API helper function
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`http://localhost:3000/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  };

  // Query for fetching users
  const {
    data: users = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['auth-users'],
    queryFn: async () => {
      if (!hasAccess) return [];

      try {
        const result = await apiCall('/auth-users?orderBy=created_at&ascending=false');
        return result.data || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários: " + (error as Error).message,
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: hasAccess
  });

  // Mutation for creating users
  const createUser = useMutation({
    mutationFn: async (userData: { email: string; password: string; name: string; role?: string }) => {
      if (!hasAccess) {
        throw new Error('Acesso negado');
      }

      const result = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          role: userData.role || 'user'
        }),
      });

      return result.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-users'] });
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      const errorMessage = handleError(error);
      toast({
        title: "Erro ao Criar Usuário",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating users
  const updateUser = useMutation({
    mutationFn: async (userData: { id: string; email?: string; name?: string; role?: string }) => {
      if (!hasAccess) {
        throw new Error('Acesso negado');
      }

      const { id, ...updateData } = userData;
      const result = await apiCall(`/auth-users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-users'] });
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      const errorMessage = handleError(error);
      toast({
        title: "Erro ao Atualizar Usuário",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting users
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!hasAccess) {
        throw new Error('Acesso negado');
      }

      const result = await apiCall(`/auth-users/${userId}`, {
        method: 'DELETE',
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-users'] });
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });
    },
    onError: (error: Error) => {
      const errorMessage = handleError(error);
      toast({
        title: "Erro ao Excluir Usuário",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    hasAccess,
  };
};
