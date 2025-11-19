import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignOutDialog } from "@/components/SignOutDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  LogOut,
  LayoutDashboard,
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
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WholesalerLayoutProps {
  children: ReactNode;
  title: string;
  activePage: "dashboard" | "inventory" | "retailers";
  userName?: string;
  headerActions?: ReactNode;
}

function WholesalerSidebar({ menuItems, userName }: { menuItems: any[], userName?: string }) {
  const { open, setOpen } = useSidebar();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r transition-all duration-300">
      <SidebarContent>
        {/* Header with toggle button */}
        <div className="p-6 border-b flex items-center justify-between bg-card relative">
          <div className={`transition-all duration-200 ${open ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  LocalMart
                </div>
                <div className="text-xs text-muted-foreground">Shop Local, Save More</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Toggle button positioned below header */}
        <div className="px-4 py-2 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="h-8 w-8 border border-border/50 hover:bg-accent hover:border-border transition-all duration-200"
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={open ? '' : 'sr-only'}>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton 
                          onClick={item.action}
                          isActive={item.active}
                          className="transition-all duration-200"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            {item.title}
                          </span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!open && (
                        <TooltipContent side="right">
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function WholesalerLayout({ children, title, activePage, userName, headerActions }: WholesalerLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      action: () => navigate("/wholesaler-dashboard"),
      active: activePage === "dashboard",
    },
    {
      title: "Manage Inventory",
      icon: Package,
      action: () => navigate("/wholesaler/inventory"),
      active: activePage === "inventory",
    },
    {
      title: "View Retailers",
      icon: Users,
      action: () => navigate("/view-retailers"),
      active: activePage === "retailers",
    },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <WholesalerSidebar menuItems={menuItems} userName={userName} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b bg-card h-16 flex items-center px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {headerActions}
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile", { state: { from: 'wholesaler-dashboard' } })}>
                <UserCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowSignOutDialog(true)}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>

      <SignOutDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleSignOut}
      />
    </SidebarProvider>
  );
}
