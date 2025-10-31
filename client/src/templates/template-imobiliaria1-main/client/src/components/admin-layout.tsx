import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isAdmin, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      setLocation("/login");
    }
  }, [isAdmin, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/users", label: "Usuários", icon: Users },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">Painel Admin</h2>
        <p className="text-sm text-muted-foreground mt-1">{user?.username}</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start"
                    data-testid={`link-${item.label.toLowerCase()}`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <aside className="hidden md:block w-64 bg-white dark:bg-slate-800 border-r min-h-screen">
          <Sidebar />
        </aside>

        <div className="flex-1">
          <header className="bg-white dark:bg-slate-800 border-b p-4 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </header>

          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
