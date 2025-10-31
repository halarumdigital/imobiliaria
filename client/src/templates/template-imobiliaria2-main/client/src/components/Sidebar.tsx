import { Home, Users, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Usuários", path: "/dashboard/users" },
  ];

  return (
    <div className="w-64 min-h-screen bg-[#1E2738] text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-[#2C9ADB]">FindHouse</h1>
        <p className="text-sm text-gray-400 mt-1">Painel Administrativo</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  data-testid={`link-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#2C9ADB] text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <Button
          data-testid="button-logout"
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <LogOut size={20} className="mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
}
