import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  MailOpen,
  FileText,
  Inbox,
  ContactRound,
  Workflow,
  Settings,
  ListChecks,
  ChevronDown,
  ChevronRight,
  Layout,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const menuSections = [
  {
    label: 'Vue d\'ensemble',
    items: [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        tab: 'overview',
      },
    ],
  },
  {
    label: 'Formation',
    items: [
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
    ],
  },
  {
    label: 'Gestion',
    items: [
      {
        title: 'Utilisateurs',
        icon: Users,
        tab: 'users',
      },
      {
        title: 'Inscriptions',
        icon: ListChecks,
        tab: 'submissions',
      },
      {
        title: 'Messages',
        icon: MessageSquare,
        tab: 'messages',
      },
      {
        title: 'Page d\'accueil',
        icon: Layout,
        tab: 'homepage',
      },
    ],
  },
  {
    label: 'Marketing & CRM',
    items: [
      {
        title: 'Contacts',
        icon: ContactRound,
        tab: 'contacts',
      },
      {
        title: 'Templates Email',
        icon: MailOpen,
        tab: 'email-templates',
      },
      {
        title: 'Campagnes Email',
        icon: Mail,
        tab: 'email-marketing',
      },
      {
        title: 'Boîte de réception',
        icon: Inbox,
        tab: 'email-inbox',
      },
      {
        title: 'Formulaires',
        icon: FileText,
        tab: 'forms',
      },
    ],
  },
  {
    label: 'Automatisation',
    items: [
      {
        title: 'Workflows',
        icon: Workflow,
        tab: 'workflows',
      },
    ],
  },
  {
    label: 'Paramètres',
    items: [
      {
        title: 'Mon Profil',
        icon: UserCircle,
        tab: 'profile',
      },
    ],
  },
];

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';

  // État pour gérer les sections ouvertes/fermées
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('admin-sidebar-sections');
    return saved ? JSON.parse(saved) : {
      'Vue d\'ensemble': true,
      'Formation': false,
      'Gestion': true,
      'Marketing & CRM': false,
      'Automatisation': false,
      'Paramètres': false,
    };
  });

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-sections', JSON.stringify(openSections));
  }, [openSections]);

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

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
        {menuSections.map((section) => (
          <Collapsible
            key={section.label}
            open={openSections[section.label]}
            onOpenChange={() => toggleSection(section.label)}
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between px-2 py-1 h-8 hover:bg-accent/50"
                >
                  <SidebarGroupLabel className="flex-1 text-left cursor-pointer">
                    {section.label}
                  </SidebarGroupLabel>
                  {openSections[section.label] ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
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
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};
