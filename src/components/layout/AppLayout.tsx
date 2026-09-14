import { CSSProperties, ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider
      defaultOpen={true}
      style={{ "--sidebar-width-icon": "3.5rem" } as CSSProperties}
    >
      <div className="app-shell flex w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-0 pb-3 md:px-3">
          <Header />
          <main className="app-content mt-3 flex-1 overflow-x-hidden overflow-y-auto border border-border/60 shadow-card">
            <div className="p-4 sm:p-6 lg:p-7">
              <div className="w-full max-w-7xl mx-auto">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
