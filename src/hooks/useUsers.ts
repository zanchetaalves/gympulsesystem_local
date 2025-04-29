
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Adapter functions para converter entre os formatos do banco e da aplicação
export const dbToAppUser = (dbUser: any): User => ({
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  profile: dbUser.profile,
  active: dbUser.active ?? true,
  createdAt: new Date(dbUser.created_at),
});

export const appToDbUser = (user: Partial<User>) => ({
  name: user.name,
  email: user.email,
  profile: user.profile,
  active: user.active,
  created_at: user.createdAt instanceof Date
    ? user.createdAt.toISOString()
    : user.createdAt,
});

export const useUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar usuários
  const {
    data: users = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      return (data || []).map(dbToAppUser);
    },
  });

  // Mutation para criar usuário
  const createUser = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const dbData = appToDbUser(data);

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;
      return dbToAppUser(newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

  // Mutation para atualizar usuário
  const updateUser = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const dbData = {
        ...appToDbUser(data),
        id: data.id
      };

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(dbData)
        .eq('id', dbData.id)
        .select()
        .single();

      if (error) throw error;
      return dbToAppUser(updatedUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

  // Mutation para excluir usuário
  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
    deleteUser
  };
};
