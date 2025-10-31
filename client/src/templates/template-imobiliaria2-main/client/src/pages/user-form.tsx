import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

const userFormSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function UserForm() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/dashboard/users/:id");
  const { toast } = useToast();
  
  const isNew = params?.id === "new";
  const userId = isNew ? null : params?.id;

  const { data: currentUser, error: authError } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !isNew && !!userId,
  });

  useEffect(() => {
    if (authError) {
      setLocation("/login");
    }
  }, [authError, setLocation]);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user && !isNew) {
      form.reset({
        username: user.username,
        password: "",
      });
    }
  }, [user, isNew, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (isNew) {
        await apiRequest("POST", "/api/users", data);
      } else {
        const updateData = data.password ? data : { username: data.username };
        await apiRequest("PATCH", `/api/users/${userId}`, updateData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: `Usuário ${isNew ? "criado" : "atualizado"} com sucesso`,
      });
      setLocation("/dashboard/users");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o usuário",
        variant: "destructive",
      });
    },
  });

  if (!currentUser) {
    return null;
  }

  if (isLoading && !isNew) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <p>Carregando...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-6">
          <Link href="/dashboard/users">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4" data-testid="text-form-title">
            {isNew ? "Novo Usuário" : "Editar Usuário"}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-username"
                        placeholder="Digite o nome de usuário"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isNew ? "Senha" : "Nova Senha (deixe em branco para não alterar)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        data-testid="input-password"
                        placeholder={isNew ? "Digite a senha" : "Digite a nova senha"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  data-testid="button-save"
                  disabled={saveMutation.isPending}
                  className="bg-[#2C9ADB] hover:bg-[#2488c4]"
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
                <Link href="/dashboard/users">
                  <Button type="button" variant="outline" data-testid="button-cancel">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
