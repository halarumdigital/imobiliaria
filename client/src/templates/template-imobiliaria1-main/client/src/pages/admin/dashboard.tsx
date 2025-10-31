import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserCog, Activity } from "lucide-react";

type User = {
  id: string;
  username: string;
  role: string;
};

export default function AdminDashboard() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const totalUsers = users?.length || 0;
  const adminCount = users?.filter(u => u.role === "admin").length || 0;
  const userCount = users?.filter(u => u.role === "user").length || 0;

  const stats = [
    {
      title: "Total de Usuários",
      value: totalUsers,
      icon: Users,
      description: "Usuários cadastrados no sistema",
      color: "text-blue-600",
    },
    {
      title: "Administradores",
      value: adminCount,
      icon: UserCog,
      description: "Usuários com acesso admin",
      color: "text-purple-600",
    },
    {
      title: "Usuários Normais",
      value: userCount,
      icon: UserCheck,
      description: "Usuários sem privilégios admin",
      color: "text-green-600",
    },
    {
      title: "Sistema",
      value: "Online",
      icon: Activity,
      description: "Status do sistema",
      color: "text-emerald-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral do sistema de administração
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-slate-200 rounded w-16 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao Painel de Administração</CardTitle>
            <CardDescription>
              Gerencie usuários e visualize estatísticas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Use o menu lateral para navegar entre as diferentes seções:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>Dashboard:</strong> Visão geral e estatísticas do sistema
                </li>
                <li>
                  <strong>Usuários:</strong> Gerenciar usuários cadastrados (criar, editar, excluir)
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
