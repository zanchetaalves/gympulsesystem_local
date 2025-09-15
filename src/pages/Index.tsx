
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configStatus, setConfigStatus] = useState<"idle" | "success" | "error">("idle");
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const configureDbAccess = async () => {
    setIsConfiguring(true);
    setConfigStatus("idle");

    try {
      if (!isAuthenticated) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado para configurar o acesso ao banco de dados.",
          variant: "destructive",
        });
        setConfigStatus("error");
        return;
      }

      // Call the RPC function through our new API
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/api/rpc/allow_all_ips_db_access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to configure database access');
      }

      toast({
        title: "Sucesso",
        description: "Acesso ao banco de dados configurado para todos os IPs!",
      });
      setConfigStatus("success");
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: `Erro ao configurar acesso: ${error.message}`,
        variant: "destructive",
      });
      setConfigStatus("error");
    } finally {
      setIsConfiguring(false);
    }
  };

  const generateBackup = async () => {
    setIsGeneratingBackup(true);

    try {
      if (!isAuthenticated) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado para gerar backup.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A funcionalidade de backup será implementada em breve",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: `Erro ao gerar backup: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Configuração de Acesso ao Banco de Dados</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Acesso ao PostgreSQL</h2>
        <p className="mb-4">
          Clique no botão abaixo para permitir acesso ao banco de dados PostgreSQL de qualquer IP.
          Isso é necessário para ferramentas como pgAdmin ou DBeaver.
        </p>

        <div className="mb-4">
          <h3 className="font-medium mb-2">Dados de conexão:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Host: localhost</li>
            <li>Port: 5432</li>
            <li>Database: GYMPULSE_BD</li>
            <li>Username: postgres</li>
            <li>SSL mode: require</li>
          </ul>
        </div>

        <Button
          onClick={configureDbAccess}
          disabled={isConfiguring || !isAuthenticated}
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

        {!isAuthenticated && (
          <p className="mt-4 text-yellow-600">
            Você precisa estar logado para usar esta funcionalidade.
          </p>
        )}
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Backup do Banco de Dados</h2>
        <p className="mb-4">
          Gere um backup completo do banco de dados PostgreSQL.
        </p>

        <Button
          onClick={generateBackup}
          disabled={isGeneratingBackup || !isAuthenticated}
          variant="outline"
        >
          {isGeneratingBackup ? "Gerando backup..." : "Gerar Backup"}
        </Button>
      </Card>

      {user && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informações do Usuário</h2>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Função:</strong> {user.role}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Index;
