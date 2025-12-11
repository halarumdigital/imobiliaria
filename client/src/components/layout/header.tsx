import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-card shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive"></span>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Sistema Online</p>
            <p className="text-muted-foreground">Conectado</p>
          </div>
        </div>
      </div>
    </header>
  );
}
