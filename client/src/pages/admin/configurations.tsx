import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { queryClient } from "@/lib/queryClient";
import { apiGet, apiPost } from "@/lib/api";
import { GlobalConfiguration } from "@/types";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Upload } from "lucide-react";

export default function Configurations() {
  const { toast } = useToast();
  const { applyTheme } = useTheme();
  const [formData, setFormData] = useState<Partial<GlobalConfiguration>>({});

  const { data: config, isLoading } = useQuery<GlobalConfiguration>({
    queryKey: ["/global-config"],
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: (data: Partial<GlobalConfiguration>) => apiPost("/global-config", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/global-config"] });
      applyTheme(data);
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configurações",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleInputChange = (field: keyof GlobalConfiguration, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field: 'logo' | 'favicon') => {
    return {
      method: 'PUT' as const,
      url: await apiGet("/objects/upload").then(res => res.uploadURL),
    };
  };

  const handleFileComplete = (field: 'logo' | 'favicon') => (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      handleInputChange(field, uploadURL);
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Globais</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure as informações visuais e funcionais do sistema
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Uploads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Logo do Sistema</Label>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={() => handleFileUpload('logo')}
                onComplete={handleFileComplete('logo')}
                buttonClassName="w-full h-32 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/25"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload do logo</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG até 10MB</span>
                </div>
              </ObjectUploader>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Favicon</Label>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={() => handleFileUpload('favicon')}
                onComplete={handleFileComplete('favicon')}
                buttonClassName="w-full h-32 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/25"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload do favicon</span>
                  <span className="text-xs text-muted-foreground">ICO, PNG 32x32px</span>
                </div>
              </ObjectUploader>
            </div>
          </div>

          {/* Color Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="coresPrimaria">Cor Primária</Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.coresPrimaria || "#3B82F6"}
                  onChange={(e) => handleInputChange("coresPrimaria", e.target.value)}
                  className="h-10 w-16 rounded border border-input"
                />
                <Input
                  value={formData.coresPrimaria || "#3B82F6"}
                  onChange={(e) => handleInputChange("coresPrimaria", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="coresSecundaria">Cor Secundária</Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.coresSecundaria || "#6366F1"}
                  onChange={(e) => handleInputChange("coresSecundaria", e.target.value)}
                  className="h-10 w-16 rounded border border-input"
                />
                <Input
                  value={formData.coresSecundaria || "#6366F1"}
                  onChange={(e) => handleInputChange("coresSecundaria", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="coresFundo">Cor de Fundo</Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.coresFundo || "#F8FAFC"}
                  onChange={(e) => handleInputChange("coresFundo", e.target.value)}
                  className="h-10 w-16 rounded border border-input"
                />
                <Input
                  value={formData.coresFundo || "#F8FAFC"}
                  onChange={(e) => handleInputChange("coresFundo", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Text Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="nomeSistema">Nome do Sistema</Label>
              <Input
                id="nomeSistema"
                value={formData.nomeSistema || ""}
                onChange={(e) => handleInputChange("nomeSistema", e.target.value)}
                placeholder="Sistema Multi-Empresa"
              />
            </div>

            <div>
              <Label htmlFor="nomeRodape">Nome do Rodapé</Label>
              <Input
                id="nomeRodape"
                value={formData.nomeRodape || ""}
                onChange={(e) => handleInputChange("nomeRodape", e.target.value)}
                placeholder="© 2024 Multi-Empresa System"
              />
            </div>

            <div>
              <Label htmlFor="nomeAbaNavegador">Título da Aba</Label>
              <Input
                id="nomeAbaNavegador"
                value={formData.nomeAbaNavegador || ""}
                onChange={(e) => handleInputChange("nomeAbaNavegador", e.target.value)}
                placeholder="Multi-Empresa Dashboard"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
