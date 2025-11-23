import { LayoutDashboard, BookOpen, Award, Trophy, Bell, Settings, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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

const menuItems = [
  { title: "Vue d'ensemble", url: "/espace-formation", icon: LayoutDashboard },
  { title: "Mes Cours", url: "/espace-formation?tab=courses", icon: BookOpen },
  { title: "Progression", url: "/espace-formation?tab=progress", icon: Award },
  { title: "Badges", url: "/espace-formation?tab=badges", icon: Trophy },
  { title: "Notifications", url: "/espace-formation?tab=notifications", icon: Bell },
  { title: "Paramètres", url: "/espace-formation?tab=settings", icon: Settings },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentTab = params.get("tab");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ description: "Déconnexion réussie" });
    navigate("/auth");
  };

  const isActive = (url: string) => {
    if (url === "/espace-formation" && !currentTab) return true;
    return url.includes(`tab=${currentTab}`);
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"}>
      <SidebarContent className="bg-card border-r border-border">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          {!isCollapsed ? (
            <h2 className="text-xl font-bold text-primary">Meta Ads Mastery</h2>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">M</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className={`
                      ${isActive(item.url) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}
                      ${isCollapsed ? "justify-center" : "justify-start"}
                    `}
                  >
                    <item.icon className={isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout button at bottom */}
        <div className="mt-auto p-4 border-t border-border">
          <SidebarMenuButton
            onClick={handleLogout}
            className={`
              w-full text-destructive hover:bg-destructive/10
              ${isCollapsed ? "justify-center" : "justify-start"}
            `}
          >
            <LogOut className={isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"} />
            {!isCollapsed && <span>Déconnexion</span>}
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
