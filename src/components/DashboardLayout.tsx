import { useState } from "react";
import { ResponsiveSidebar } from "@/components/ResponsiveSidebar";
import { TopNavigation } from "@/components/TopNavigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <ResponsiveSidebar 
        isOpen={sidebarOpen} 
        onClose={handleSidebarClose}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavigation 
          onMenuClick={handleMenuClick}
          showMenuButton={true}
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}