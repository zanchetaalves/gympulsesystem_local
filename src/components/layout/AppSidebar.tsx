
import { useState } from "react";
import { Link } from "react-router-dom";
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
  LayoutList
} from "lucide-react";

export function AppSidebar() {
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
        <div className="text-sm text-gray-500">
          GymPulse System v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
