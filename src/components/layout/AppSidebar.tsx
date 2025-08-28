import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { authService } from "@/services/authService";
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  Users,
  ShoppingCart,
  FileText,
  ClipboardList,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
  Building2,
  Activity
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const getMenuItems = (userRole: string) => {
  const baseItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Projects", url: "/projects", icon: FolderOpen },
    { title: "Inventory", url: "/inventory", icon: Package },
    { title: "Users", url: "/users", icon: Users },
    { title: "Vendors", url: "/vendors", icon: Building2 },
    { title: "Bill of Materials", url: "/bom", icon: FileText },
    { title: "Work Orders", url: "/work-orders", icon: ClipboardList },
    { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
    { title: "Gate Pass", url: "/gate-pass", icon: Truck },
    { title: "Vehicle Request", url: "/vehicle-request", icon: Truck },
    { title: "Reports", url: "/reports", icon: BarChart3 },
  ];

  // Add BOM Status for Store In Charge users
  if (userRole === 'Store In Charge') {
    const bomIndex = baseItems.findIndex(item => item.title === 'Bill of Materials');
    baseItems.splice(bomIndex + 1, 0, { title: "BOM Status", url: "/bom-status", icon: Activity });
  }

  return baseItems;
};

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const user = authService.getCurrentUser();
  const menuItems = getMenuItems(user?.role || '');

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth text-sm font-medium ${
      isActive
        ? "bg-destructive text-primary-foreground shadow-sm"
        : "text-foreground hover:bg-secondary hover:text-foreground"
    }`;

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} transition-smooth border-r bg-muted/30 backdrop-blur-sm`}>
      <div className="flex h-16 items-center justify-between px-4 border-b bg-background/80">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold text-lg">Pavillions and Interiors</h1>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-secondary rounded-lg transition-smooth"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <SidebarContent className="p-4 bg-primary">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className={getNavClassName}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto pt-6">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/settings" className={getNavClassName}>
                      <Settings className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">Settings</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
