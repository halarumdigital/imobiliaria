import { useState, useEffect, useRef } from "react";
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
import { Upload, Image } from "lucide-react";

export default function Configurations() {
  const { toast } = useToast();
  const { applyTheme } = useTheme();
  const [formData, setFormData] = useState<Partial<GlobalConfiguration>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (field: 'logo' | 'favicon', file: File) => {
    const formData = new FormData();
    formData.append(field, file);
    
    try {
      const response = await fetch(`/api/upload/${field}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Erro no upload');
      }
      
      const result = await response.json();
      return result.filePath;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileChange = async (field: 'logo' | 'favicon', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const filePath = await handleFileUpload(field, file);
      
      // Atualiza o formData local
      const updatedFormData = { ...formData, [field]: filePath };
      setFormData(updatedFormData);
      
      // Salva automaticamente no banco de dados
      await mutation.mutateAsync(updatedFormData);
      
      toast({
        title: "Sucesso",
        description: `${field === 'logo' ? 'Logo' : 'Favicon'} salvo com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao salvar ${field === 'logo' ? 'logo' : 'favicon'}`,
        variant: "destructive",
      });
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
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/25 cursor-pointer flex flex-col items-center justify-center space-y-2 rounded-lg transition-colors overflow-hidden"
              >
                {formData.logo ? (
                  <div className="w-full h-full relative flex flex-col items-center justify-center">
                    <img 
                      src={formData.logo} 
                      alt="Logo atual"
                      className="max-w-full max-h-24 object-contain"
                    />
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                      Clique para alterar
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload do logo</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG até 10MB</span>
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('logo', e)}
                className="hidden"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Favicon</Label>
              <div 
                onClick={() => faviconInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/25 cursor-pointer flex flex-col items-center justify-center space-y-2 rounded-lg transition-colors overflow-hidden"
              >
                {formData.favicon ? (
                  <div className="w-full h-full relative flex flex-col items-center justify-center">
                    <img 
                      src={formData.favicon} 
                      alt="Favicon atual"
                      className="max-w-16 max-h-16 object-contain"
                    />
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                      Clique para alterar
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload do favicon</span>
                    <span className="text-xs text-muted-foreground">ICO, PNG 32x32px</span>
                  </div>
                )}
              </div>
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*,.ico"
                onChange={(e) => handleFileChange('favicon', e)}
                className="hidden"
              />
            </div>
          </div>

          {/* Color Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="coresPrimaria">Cor Primária</Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.cores_primaria || "#3B82F6"}
                  onChange={(e) => handleInputChange("cores_primaria", e.target.value)}
                  className="h-10 w-16 rounded border border-input"
                />
                <Input
                  value={formData.cores_primaria || "#3B82F6"}
                  onChange={(e) => handleInputChange("cores_primaria", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="coresSecundaria">Cor Secundária</Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.cores_secundaria || "#6366F1"}
                  onChange={(e) => handleInputChange("cores_secundaria", e.target.value)}
                  className="h-10 w-16 rounded border border-input"
                />
                <Input
                  value={formData.cores_secundaria || "#6366F1"}
                  onChange={(e) => handleInputChange("cores_secundaria", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="coresFundo">Cor de Fundo</Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.cores_fundo || "#F8FAFC"}
                  onChange={(e) => handleInputChange("cores_fundo", e.target.value)}
                  className="h-10 w-16 rounded border border-input"
                />
                <Input
                  value={formData.cores_fundo || "#F8FAFC"}
                  onChange={(e) => handleInputChange("cores_fundo", e.target.value)}
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
                value={formData.nome_sistema || ""}
                onChange={(e) => handleInputChange("nome_sistema", e.target.value)}
                placeholder="Sistema Multi-Empresa"
              />
            </div>

            <div>
              <Label htmlFor="nomeRodape">Nome do Rodapé</Label>
              <Input
                id="nomeRodape"
                value={formData.nome_rodape || ""}
                onChange={(e) => handleInputChange("nome_rodape", e.target.value)}
                placeholder="© 2024 Multi-Empresa System"
              />
            </div>

            <div>
              <Label htmlFor="nomeAbaNavegador">Título da Aba</Label>
              <Input
                id="nomeAbaNavegador"
                value={formData.nome_aba_navegador || ""}
                onChange={(e) => handleInputChange("nome_aba_navegador", e.target.value)}
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
