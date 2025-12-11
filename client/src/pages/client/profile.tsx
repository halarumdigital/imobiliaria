import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiGet, apiPut } from "@/lib/api";
import { Company } from "@/types";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Building, Camera } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Company>>({});

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/profile"],
  });

  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Company>) => apiPut("/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/profile"] });
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof Company, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async () => {
    return {
      method: 'PUT' as const,
      url: await apiGet("/objects/upload").then(res => res.uploadURL),
    };
  };

  const handleAvatarComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      handleInputChange("avatar", uploadURL);
      
      // Update avatar immediately
      apiPut("/avatar", { avatarURL: uploadURL });
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil da Empresa</CardTitle>
        <p className="text-sm text-muted-foreground">
          Gerencie as informações da sua empresa e conta
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={formData.avatar} />
                <AvatarFallback>
                  <Building className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={handleAvatarUpload}
                onComplete={handleAvatarComplete}
                buttonClassName="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary/90"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </ObjectUploader>
            </div>
            <div>
              <h3 className="text-lg font-medium">Avatar da Empresa</h3>
              <p className="text-sm text-muted-foreground">
                Clique no ícone da câmera para alterar a imagem
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Nome da Empresa</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj || ""}
                onChange={(e) => handleInputChange("cnpj", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep || ""}
                onChange={(e) => handleInputChange("cep", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
