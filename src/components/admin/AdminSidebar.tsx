import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Users,
  BookOpen,
  Video,
  TrendingUp,
  BarChart3,
  Mail,
  MessageSquare,
  UserCircle,
  LayoutDashboard,
  Award,
  Layout,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'Vue d\'ensemble',
    icon: LayoutDashboard,
    tab: 'overview',
  },
  {
    title: 'Pages',
    icon: FileText,
    tab: 'pages',
  },
  {
    title: 'Page de Vente',
    icon: Layout,
    tab: 'landing-page',
  },
  {
    title: 'Utilisateurs',
    icon: Users,
    tab: 'users',
  },
  {
    title: 'Formations',
    icon: BookOpen,
    tab: 'courses',
  },
  {
    title: 'Vidéos',
    icon: Video,
    tab: 'videos',
  },
  {
    title: 'Progression',
    icon: TrendingUp,
    tab: 'progress',
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    tab: 'analytics',
  },
  {
    title: 'Certificats',
    icon: Award,
    tab: 'certificates',
  },
  {
    title: 'Inscriptions',
    icon: Mail,
    tab: 'submissions',
  },
  {
    title: 'Messages',
    icon: MessageSquare,
    tab: 'messages',
  },
  {
    title: 'Mon Profil',
    icon: UserCircle,
    tab: 'profile',
  },
];

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (tab: string) => {
    navigate(`/admin?tab=${tab}`);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          {state === 'expanded' && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">Dashboard</span>
              <span className="text-xs text-muted-foreground truncate">Administration</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.tab}>
                  <SidebarMenuButton
                    onClick={() => handleTabChange(item.tab)}
                    isActive={currentTab === item.tab}
                    tooltip={item.title}
                    className={cn(
                      'w-full justify-start',
                      currentTab === item.tab && 'bg-accent text-accent-foreground font-medium'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
