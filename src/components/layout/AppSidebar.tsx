
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup
} from "@/components/ui/sidebar";
import { 
  Users, 
  User, 
  FileText, 
  CreditCard, 
  BarChart2, 
  Calendar,
  LayoutList,
  LogOut,
  Database
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AppSidebar() {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Menu items
  const menuItems = [
    {
      title: "Dashboard",
      icon: BarChart2,
      url: "/",
    },
    {
      title: "Usuários",
      icon: Users,
      url: "/usuarios",
    },
    {
      title: "Clientes",
      icon: User,
      url: "/clientes",
    },
    {
      title: "Matrículas",
      icon: FileText,
      url: "/matriculas",
    },
    {
      title: "Pagamentos",
      icon: CreditCard,
      url: "/pagamentos",
    },
    {
      title: "Planos",
      icon: LayoutList,
      url: "/planos",
    },
    {
      title: "Relatórios",
      icon: Calendar,
      url: "/relatorios",
    },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setIsDownloading(true);
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa estar autenticado para baixar o backup");
        navigate("/auth");
        return;
      }
      
      // Call the function with authorization header containing the access token
      const { data, error } = await supabase.functions.invoke("generate-backup", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Create a blob and download it
      const blob = new Blob([data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gympulse_backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Backup baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar o backup:", error);
      toast.error("Erro ao baixar o backup");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 flex items-center space-x-2">
        <div className="bg-gym-primary rounded-md p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
        <span className="font-bold text-xl">GymPulse</span>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link to={item.url} className="flex items-center">
                    <item.icon className="mr-2 h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleDownloadBackup}
            className="flex items-center text-blue-500 hover:bg-blue-50 rounded-md px-2 py-1.5 transition-colors text-sm"
            disabled={isDownloading}
          >
            <Database className="mr-2 h-4 w-4" />
            <span>{isDownloading ? "Baixando..." : "Baixar Backup"}</span>
          </button>
          
          <div className="text-sm text-gray-500">
            GymPulse System v1.0
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center text-red-500 hover:bg-red-50 rounded-md px-2 py-1.5 transition-colors text-sm"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
