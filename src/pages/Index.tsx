
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configStatus, setConfigStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();

  const configureDbAccess = async () => {
    setIsConfiguring(true);
    setConfigStatus("idle");
    
    try {
      // Obter o token de acesso atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado para configurar o acesso ao banco de dados.",
          variant: "destructive",
        });
        setConfigStatus("error");
        return;
      }
      
      // Fix: Use a type assertion to tell TypeScript about the correct parameter type
      // The empty object is the correct way to call this function with no parameters
      const { data, error } = await supabase.rpc('allow_all_ips_db_access' as any, {});
      
      if (error) {
        console.error("Erro ao configurar acesso:", error);
        toast({
          title: "Erro",
          description: `Falha ao configurar acesso ao banco de dados: ${error.message}`,
          variant: "destructive",
        });
        setConfigStatus("error");
      } else {
        toast({
          title: "Sucesso",
          description: "Acesso ao banco de dados configurado para todos os IPs!",
        });
        setConfigStatus("success");
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: `Falha ao configurar acesso: ${error.message}`,
        variant: "destructive",
      });
      setConfigStatus("error");
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Configuração de Acesso ao Banco de Dados</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Acesso ao PostgreSQL</h2>
        <p className="mb-4">
          Clique no botão abaixo para permitir acesso ao banco de dados PostgreSQL de qualquer IP.
          Isso é necessário para ferramentas como pgAdmin ou DBeaver.
        </p>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2">Dados de conexão:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Host: db.rmvrrrqlqrmtiiwxugfe.supabase.co</li>
            <li>Port: 5432</li>
            <li>Database: postgres</li>
            <li>Username: postgres</li>
            <li>SSL mode: require</li>
          </ul>
        </div>
        
        <Button 
          onClick={configureDbAccess} 
          disabled={isConfiguring}
          variant={configStatus === "success" ? "outline" : "default"}
        >
          {isConfiguring ? "Configurando..." : 
           configStatus === "success" ? "Configurado com Sucesso" : 
           "Liberar Acesso ao Banco de Dados"}
        </Button>
        
        {configStatus === "success" && (
          <p className="mt-4 text-green-600">
            Acesso liberado! Agora você pode se conectar usando ferramentas como pgAdmin ou DBeaver.
          </p>
        )}
        
        {configStatus === "error" && (
          <p className="mt-4 text-red-600">
            Ocorreu um erro ao tentar configurar o acesso. Por favor, tente novamente ou contate o suporte.
          </p>
        )}
      </Card>
      
      <div className="mt-6 border p-4 rounded-md bg-yellow-50">
        <h3 className="font-medium text-yellow-800">Nota de Segurança</h3>
        <p className="text-yellow-700">
          Permitir acesso de qualquer IP ao seu banco de dados pode representar um risco de segurança.
          Considere restringir o acesso apenas aos IPs necessários quando estiver em um ambiente de produção.
        </p>
      </div>
    </div>
  );
};

export default Index;
