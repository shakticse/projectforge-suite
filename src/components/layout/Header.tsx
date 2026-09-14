import { useState } from "react";
import { Bell, Search, User, LogOut, Settings, ChevronDown, BriefcaseBusiness, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";


export function Header() {
  const [notifications] = useState(3); // Mock notification count
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Fallback user data if auth hook doesn't have user yet
  const currentUser = user || {
    name: "Admin",
    email: "Admin@PavillionsInteriors.com",
    role: "Project Manager",
    avatar: "AD"
  };

  // Generate initials from name if no avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayAvatar = currentUser.avatar || getInitials(currentUser.name);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header-surface mx-3 mt-3 flex min-h-[84px] items-center justify-between rounded-[26px] px-4 sm:px-6">

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <SidebarTrigger className="h-10 w-10 rounded-xl border border-primary/15 bg-primary/5 text-primary shadow-sm hover:bg-primary/10" />

        {/* <div className="hidden min-w-0 lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Project Operations Desk
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="truncate text-xl font-semibold tracking-[0.01em] text-foreground">
              Delivery, inventory, and BOM control
            </h2>
            <div className="hidden items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-muted-foreground xl:flex">
              <MapPinned className="h-3.5 w-3.5 text-primary" />
              Unified project workspace
            </div>
          </div>
        </div> */}

        <div className="relative hidden max-w-xl flex-1 sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input 
            placeholder="Search projects, inventory, users..."
            className="h-11 rounded-2xl border-primary/15 bg-background/80 pl-10 shadow-sm focus:bg-background transition-smooth"
          />
        </div>

        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open search" className="h-10 w-10 rounded-xl border border-primary/15 bg-primary/5 shadow-sm">
                <Search className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Search</SheetTitle>
                <SheetDescription>Find projects, inventory items, vendors, and more.</SheetDescription>
              </SheetHeader>

              <div className="mt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Type to search..."
                    className="pl-10"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* <div className="hidden rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 shadow-sm md:flex md:items-center md:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BriefcaseBusiness className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Control Center
            </div>
            <div className="text-sm font-semibold text-foreground">
              Active workflows online
            </div>
          </div>
        </div> */}

        <Button variant="ghost" size="sm" className="relative h-10 rounded-xl border border-primary/15 bg-primary/5 px-3 shadow-sm hover:bg-primary/10">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-xs shadow-sm"
            >
              {notifications}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-12 items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-3 shadow-sm hover:bg-primary/10">
              <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium text-primary-foreground shadow-sm">
                {displayAvatar}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground">{currentUser.role}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/user-preferences")}>
              <Settings className="mr-2 h-4 w-4" />
              User Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Store Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
