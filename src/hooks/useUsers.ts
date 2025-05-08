
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Define the User type for Supabase Auth users
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  app_metadata: {
    provider?: string;
  };
  user_metadata: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export const useUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if current user has access to this feature
  const hasAccess = user?.email === "zancheta2010@gmail.com";

  // Query for fetching users
  const {
    data: users = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['auth-users'],
    queryFn: async () => {
      if (!hasAccess) {
        return [];
      }
      
      // Only users with service_role can access auth.users through the API
      const { data, error } = await supabase.auth.admin.listUsers();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data.users || [];
    },
    enabled: hasAccess,
  });

  // Mutation for creating a new user
  const createUser = useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string }) => {
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          name: data.name
        }
      });

      if (error) throw error;
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-users'] });
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao criar usuário: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a user
  const updateUser = useMutation({
    mutationFn: async (data: { id: string; email?: string; metadata?: Record<string, any> }) => {
      const { data: updatedUser, error } = await supabase.auth.admin.updateUserById(
        data.id,
        {
          email: data.email,
          user_metadata: data.metadata,
        }
      );

      if (error) throw error;
      return updatedUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-users'] });
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a user
  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.auth.admin.deleteUser(id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-users'] });
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário: " + error.message,
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
    hasAccess
  };
};
