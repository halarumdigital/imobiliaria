import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building, Settings, Waypoints, Bot, Users, 
  LayoutDashboard, User, MessageSquare, 
  MessageCircle, LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalConfiguration } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/admin/configurations", label: "Configurações", icon: <Settings className="w-5 h-5" /> },
  { href: "/admin/evolution-api", label: "Evolution API", icon: <Waypoints className="w-5 h-5" /> },
  { href: "/admin/ai-settings", label: "IA Global", icon: <Bot className="w-5 h-5" /> },
  { href: "/admin/companies", label: "Empresas", icon: <Building className="w-5 h-5" /> },
];

const clientNavItems: NavItem[] = [
  { href: "/client", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/client/profile", label: "Perfil", icon: <User className="w-5 h-5" /> },
  { href: "/client/whatsapp", label: "WhatsApp", icon: <MessageSquare className="w-5 h-5" /> },
  { href: "/client/ai-agents", label: "Agentes IA", icon: <Bot className="w-5 h-5" /> },
  { href: "/client/conversations", label: "Conversas", icon: <MessageCircle className="w-5 h-5" /> },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { config } = useTheme();
  const [location] = useLocation();

  const { data: globalConfig } = useQuery<Partial<GlobalConfiguration>>({
    queryKey: ["/global-config/public"],
    queryFn: () => fetch("/api/global-config/public", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }).then(res => res.json()),
    enabled: !!user
  });

  if (!user) return null;

  const navItems = user.role === "admin" ? adminNavItems : clientNavItems;
  const isAdmin = user.role === "admin";

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          {globalConfig?.logo ? (
            <img 
              src={globalConfig.logo} 
              alt="Logo" 
              className="h-12 w-auto object-contain"
            />
          ) : (
            <div className="w-12 h-12 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Building className="text-sidebar-primary-foreground text-xl" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.role === "admin" ? "Administrador" : "Cliente"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
