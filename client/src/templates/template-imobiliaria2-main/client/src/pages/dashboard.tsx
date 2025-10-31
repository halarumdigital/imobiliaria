import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    if (error) {
      setLocation("/login");
    }
  }, [error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-username">
            Bem-vindo, {user.username}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-6 py-8">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total de Propriedades
              </dt>
              <dd className="mt-2 text-4xl font-semibold text-gray-900">
                16
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-6 py-8">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Para Alugar
              </dt>
              <dd className="mt-2 text-4xl font-semibold text-gray-900">
                8
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-6 py-8">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Para Venda
              </dt>
              <dd className="mt-2 text-4xl font-semibold text-gray-900">
                8
              </dd>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
