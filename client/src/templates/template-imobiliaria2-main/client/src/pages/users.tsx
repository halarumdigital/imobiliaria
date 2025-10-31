import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function Users() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: currentUser, error: authError } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  useEffect(() => {
    if (authError) {
      setLocation("/login");
    }
  }, [authError, setLocation]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
        variant: "destructive",
      });
    },
  });

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-users-title">
              Usuários
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie os usuários do sistema
            </p>
          </div>
          <Link href="/dashboard/users/new">
            <Button data-testid="button-new-user" className="bg-[#2C9ADB] hover:bg-[#2488c4]">
              <Plus size={20} className="mr-2" />
              Novo Usuário
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome de Usuário
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users?.map((user) => (
                  <tr key={user.id} data-testid={`row-user-${user.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link href={`/dashboard/users/${user.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Pencil size={16} className="mr-1" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este usuário?")) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        data-testid={`button-delete-${user.id}`}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
