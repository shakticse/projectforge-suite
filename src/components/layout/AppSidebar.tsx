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
  Activity,
  CogIcon,
  ChartBarStackedIcon,
  PencilRulerIcon,
  FileQuestionIcon,
  PencilLineIcon,
  ReceiptTextIcon,
  Shield,
  Store,
  Factory,
  PanelTop,
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
// Project Manager

// Project Supervisor
const getMenuItems = (userRole: string) => {
  const baseItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Projects", url: "/projects", icon: FolderOpen },
    { title: 'Store', url: '/stores', icon: Store },
    { title: "Inventory", url: "/inventory", icon: Package },
    { title: "Vendors", url: "/vendors", icon: Building2 },
    { title: "Purchase Requests", url: "/purchase-requests", icon: ShoppingCart },
    { title: "Outsourcing Requests", url: "/outsourcing-requests", icon: Factory },
    { title: "Purchase Orders", url: "/purchase-orders", icon: FileText },
    { title: "Service Request", url: "/", icon: CogIcon },
    { title: "Service Order", url: "/", icon: CogIcon },
    { title: "Bill of Materials", url: "/bom", icon: FileText },
    { title: "BOM Allocation", url: "/bom-action", icon: Activity },
    { title: "Intra-Store Allocation", url: "/material-request", icon: Building2 },
    { title: "Work Request", url: "/work-requests", icon: ClipboardList },
    { title: "Work Order", url: "/work-orders", icon: ClipboardList },
    { title: "MRN List/Challan", url: "/mrn-list", icon: ReceiptTextIcon },
    { title: "Gate Pass", url: "/gate-pass", icon: Truck },
    { title: "Vehicle Request", url: "/vehicle-request", icon: Truck },
    { title: "Users", url: "/users", icon: Users },
    { title: "Role Management", url: "/role-management", icon: Shield },
    { title: "Change Request", url: "/", icon: PencilLineIcon },
    { title: "Project Status Report", url: "/", icon: ChartBarStackedIcon },
    { title: "Measurment Report", url: "/", icon: PencilRulerIcon },
    { title: "Query/Issue Log", url: "/query-issue-log", icon: FileQuestionIcon },
    { title: "Reports", url: "/reports", icon: BarChart3 },
  ];

  // Add BOM Action for Project Supervisor users
  if (userRole === 'Project Supervisor') {
    const arr = [
      { title: "Inventory", url: "/inventory", icon: Activity },
      { title: "Users", url: "/users", icon: Activity },
      { title: "BOM Allocation", url: "/bom-action", icon: Activity },
      { title: "Purchase Request", url: "/purchase-requests", icon: ShoppingCart },
      { title: "Work Order", url: "/work-orders", icon: ClipboardList },
      { title: "Vendors", url: "/vendors", icon: Building2 },
      { title: "Intra-Store Allocation", url: "/material-request", icon: Building2 },
      { title: "Work Request", url: "/work-requests", icon: ClipboardList },
      { title: "Purchase Orders", url: "/purchase-orders", icon: FileText },
      { title: "Role Management", url: "/role-management", icon: Shield },
      { title: "Service Order", url: "/", icon: CogIcon },
    ];
    arr.forEach(item => {
      const index = baseItems.findIndex(i => i.title === item.title);
      if (index !== -1) {
        baseItems.splice(index, 1);
      }
    });
  }

  if (userRole === 'Store Supervisor') {
    const arr = [
      { title: "Projects", url: "/projects", icon: Activity },
      { title: "Users", url: "/users", icon: Activity },
      { title: "Project Status Report", url: "/", icon: ChartBarStackedIcon },
      { title: "Measurment Report", url: "/", icon: PencilRulerIcon },
      { title: "Vendors", url: "/vendors", icon: Building2 },
      { title: "Change Request", url: "/", icon: PencilLineIcon },
      { title: "Purchase Orders", url: "/purchase-orders", icon: FileText },
      { title: "Role Management", url: "/role-management", icon: Shield },
      { title: "Work Order", url: "/work-orders", icon: ClipboardList },
      { title: "Service Order", url: "/", icon: CogIcon },
    ];
    arr.forEach(item => {
      const index = baseItems.findIndex(i => i.title === item.title);
      if (index !== -1) {
        baseItems.splice(index, 1);
      }
    });
  }

  if (userRole === 'Purchase') {
    // const arr[] : array of menu which needs to be remove 
    const arr = [
        { title: "Projects", url: "/projects", icon: Activity },
        { title: "Inventory", url: "/inventory", icon: Package },
        { title: "Service Request", url: "/", icon: CogIcon },
        { title: "Bill of Materials", url: "/bom", icon: FileText },
        { title: "BOM Allocation", url: "/bom-action", icon: Activity },
        { title: "Intra-Store Allocation", url: "/material-request", icon: Building2 },
        { title: "Work Request", url: "/work-requests", icon: ClipboardList },
        { title: "Purchase Request", url: "/purchase-requests", icon: ShoppingCart },
        { title: "Gate Pass", url: "/gate-pass", icon: Truck },
        { title: "Vehicle Request", url: "/vehicle-request", icon: Truck },
        { title: "Users", url: "/users", icon: Users },
        { title: "Role Management", url: "/role-management", icon: Shield },
        { title: "Project Status Report", url: "/", icon: ChartBarStackedIcon },
    ];
    arr.forEach(item => {
      const index = baseItems.findIndex(i => i.title === item.title);
      if (index !== -1) {
        baseItems.splice(index, 1);
      }
    });
  }

  return baseItems;
};

export function AppSidebar() {
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const user = authService.getCurrentUser();
  let menuItems = getMenuItems(user?.role || '');

  // If permissions are available on the user, filter menu items to allowed ones
  const allowedMenuNames: string[] = (user as any)?.allowedMenuNames || [];
  if (allowedMenuNames.length > 0) {
    menuItems = menuItems.filter(item => allowedMenuNames.includes(item.title));
  }

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  // Function to handle menu item click and auto-close mobile menu
  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const labelStateClass = !collapsed
    ? "max-w-[12rem] opacity-100 translate-x-0"
    : "max-w-0 opacity-0 -translate-x-1";
  const collapsedClass = collapsed
    ? "justify-center gap-0 !h-10 !w-10 !p-0 mx-auto"
    : "h-10 gap-3 px-3";

  // Sidebar primitives can handle the active styling.
  const resolveIsActive = (item: { url: string }) => isActive(item.url);

  const getNavClassName = ({ isActive: active }: { isActive: boolean }) => {
    return active
      ? `nav-pill nav-pill-active text-white ${collapsedClass}`
      : `nav-pill hover:border-sidebar-border/70 hover:bg-sidebar-accent/70 hover:text-white ${collapsedClass}`;
  };


  return (
    <Sidebar
      collapsible="icon"
      className={`${collapsed ? "w-14" : "w-[16.5rem]"} transition-smooth border-r-0 bg-transparent`}
    >
      <div className="sidebar-shell flex h-full flex-col overflow-hidden rounded-none">
        <div className={`relative flex h-20 items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <div className= { `${collapsed ? "" : "gap-3"} flex items-center` }>
            <div className="gradient-hero flex h-11 w-11 items-center justify-center rounded-none shadow-md">
              <PanelTop className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-out ${labelStateClass}`}>
              <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/60">
                Project Control
              </p>
              <h1 className="whitespace-nowrap text-base font-semibold tracking-[0.01em] text-sidebar-foreground">
                Pavillions and Interiors
              </h1>
            </div>
          </div>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="rounded-none border border-white/10 bg-white/5 p-2 text-sidebar-foreground shadow-sm hover:bg-primary/20 hover:text-white transition-smooth"
            >
              <ChevronLeft className="h-4 w-4 transition-transform" />
            </button>
          )}
        </div>

        <SidebarContent className={`${collapsed ? "px-2 py-3" : "p-4"} [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-primary/25 [&::-webkit-scrollbar-track]:bg-transparent scrollbar-thin`}>
          <SidebarGroup className={collapsed ? "p-0" : undefined}>
            <SidebarGroupLabel
              className={`mb-2 overflow-hidden px-3 text-[11px] uppercase tracking-[0.24em] text-sidebar-foreground/60 transition-all duration-300 ease-out ${labelStateClass}`}
            >
              Operations
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={resolveIsActive(item)} tooltip={item.title}>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"} 
                        className={getNavClassName}
                        onClick={handleMenuClick}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span
                          className={`inline-block overflow-hidden whitespace-nowrap font-medium tracking-[0.01em] transition-all duration-300 ease-out ${labelStateClass}`}
                        >
                          {item.title}
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mt-auto pt-6">
            <SidebarGroup className={collapsed ? "p-0" : undefined}>
              <SidebarGroupLabel
                className={`mb-2 overflow-hidden px-3 text-[11px] uppercase tracking-[0.24em] text-sidebar-foreground/60 transition-all duration-300 ease-out ${labelStateClass}`}
              >
                Preferences
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={currentPath.startsWith("/settings")} tooltip="Settings">
                      <NavLink 
                        to="/settings" 
                        className={getNavClassName}
                        onClick={handleMenuClick}
                      >
                        <Settings className="h-5 w-5 flex-shrink-0" />
                        <span
                          className={`inline-block overflow-hidden whitespace-nowrap font-medium transition-all duration-300 ease-out ${labelStateClass}`}
                        >
                          Settings
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
      </SidebarContent>
      </div>
    </Sidebar>
  );
}
