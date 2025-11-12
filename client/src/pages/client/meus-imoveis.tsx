import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import * as Icons from "lucide-react";
import { Home, Plus, MoreVertical, Edit, Power, MapPin, Car, Bath, Bed, Search, Upload, X, Image as ImageIcon } from "lucide-react";

interface Property {
  id: string;
  companyId: string;
  code: string;
  name: string;
  street: string;
  number: string;
  proximity?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  privateArea: number;
  parkingSpaces: number;
  bathrooms: number;
  bedrooms: number;
  description?: string;
  mapLocation?: string;
  transactionType: string;
  status: string;
  images: string[];
  youtubeVideoUrl?: string;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

interface City {
  id: string;
  companyId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Amenity {
  id: string;
  companyId: string;
  name: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

interface PropertyFormData {
  code: string;
  name: string;
  street: string;
  number: string;
  proximity?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  privateArea: string;
  parkingSpaces: string;
  bathrooms: string;
  bedrooms: string;
  description?: string;
  mapLocation?: string;
  transactionType: string;
  images: string[];
  youtubeVideoUrl?: string;
  amenities: string[]; // Array of amenity IDs
}

const brazilianStates = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" }
];

export default function MeusImoveis() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<PropertyFormData>({
    code: "",
    name: "",
    street: "",
    number: "",
    proximity: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    privateArea: "",
    parkingSpaces: "0",
    bathrooms: "1",
    bedrooms: "0",
    description: "",
    mapLocation: "",
    transactionType: "venda",
    images: [],
    youtubeVideoUrl: "",
    amenities: []
  });

  // Fetch properties
  const { data: properties = [], isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch cities
  const { data: cities = [], isLoading: isLoadingCities, error: citiesError } = useQuery<City[]>({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });

  // Fetch amenities
  const { data: amenities = [], isLoading: isLoadingAmenities } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
    queryFn: async () => {
      const response = await fetch("/api/amenities", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch amenities');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });

  // Filter properties based on search term
  const filteredProperties = properties.filter((property) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      property.name.toLowerCase().includes(searchLower) ||
      property.code.toLowerCase().includes(searchLower)
    );
  });

  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(propertyData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar imóvel');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ description: "Imóvel criado com sucesso!" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Create property error:', error);
      toast({ 
        variant: "destructive",
        description: error.message || "Erro ao criar imóvel. Tente novamente." 
      });
    }
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => fetch(`/api/properties/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ description: "Imóvel atualizado com sucesso!" });
      setEditingProperty(null);
      resetForm();
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Erro ao atualizar imóvel. Tente novamente." 
      });
    }
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/properties/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ description: "Imóvel excluído com sucesso!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Erro ao excluir imóvel. Tente novamente." 
      });
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => fetch(`/api/properties/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ status: status === "active" ? "inactive" : "active" })
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ description: "Status do imóvel alterado com sucesso!" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Erro ao alterar status do imóvel. Tente novamente." 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      street: "",
      number: "",
      proximity: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      privateArea: "",
      parkingSpaces: "0",
      bathrooms: "1",
      bedrooms: "0",
      description: "",
      mapLocation: "",
      transactionType: "venda",
      images: [],
      youtubeVideoUrl: "",
      amenities: []
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de campos obrigatórios
    if (!formData.code.trim()) {
      toast({
        variant: "destructive",
        description: "Por favor, preencha o código do imóvel."
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        description: "Por favor, preencha o nome do imóvel."
      });
      return;
    }

    if (!formData.street.trim()) {
      toast({
        variant: "destructive",
        description: "Por favor, preencha o endereço (rua)."
      });
      return;
    }

    if (!formData.number.trim()) {
      toast({
        variant: "destructive",
        description: "Por favor, preencha o número do endereço."
      });
      return;
    }

    if (!formData.neighborhood.trim()) {
      toast({
        variant: "destructive",
        description: "Por favor, preencha o bairro."
      });
      return;
    }

    if (!formData.city) {
      toast({
        variant: "destructive",
        description: "Por favor, selecione uma cidade. Caso não haja cidades disponíveis, cadastre-as em Imóveis → Cidades."
      });
      return;
    }

    if (!formData.state) {
      toast({
        variant: "destructive",
        description: "Por favor, selecione um estado."
      });
      return;
    }

    if (!formData.privateArea || parseFloat(formData.privateArea) <= 0) {
      toast({
        variant: "destructive",
        description: "Por favor, preencha a área privativa com um valor válido."
      });
      return;
    }

    const propertyData = {
      ...formData,
      // Convert empty strings to null for optional fields
      proximity: formData.proximity || null,
      zipCode: formData.zipCode || null,
      description: formData.description || null,
      mapLocation: formData.mapLocation || null,
      youtubeVideoUrl: formData.youtubeVideoUrl || null,
      // Required fields - keep as is
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      // Convert numeric fields
      privateArea: parseFloat(formData.privateArea),
      parkingSpaces: parseInt(formData.parkingSpaces),
      bathrooms: parseInt(formData.bathrooms),
      bedrooms: parseInt(formData.bedrooms),
      // Include selected amenities
      amenities: formData.amenities,
    };

    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data: propertyData });
    } else {
      createPropertyMutation.mutate(propertyData);
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      code: property.code,
      name: property.name,
      street: property.street,
      number: property.number,
      proximity: property.proximity || "",
      neighborhood: property.neighborhood,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      privateArea: property.privateArea.toString(),
      parkingSpaces: property.parkingSpaces.toString(),
      bathrooms: property.bathrooms.toString(),
      bedrooms: property.bedrooms.toString(),
      description: property.description || "",
      mapLocation: property.mapLocation || "",
      transactionType: property.transactionType || "venda",
      images: property.images || [],
      youtubeVideoUrl: property.youtubeVideoUrl || "",
      amenities: property.amenities || []
    });
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingProperty(null);
    resetForm();
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    if (formData.images.length + files.length > 5) {
      toast({
        variant: "destructive",
        description: "Máximo de 5 imagens permitidas por imóvel."
      });
      return;
    }

    setUploadingImages(true);
    
    try {
      const formDataUpload = new FormData();
      Array.from(files).forEach(file => {
        formDataUpload.append('images', file);
      });

      const response = await fetch('/api/properties/upload-images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: formDataUpload
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const result = await response.json();
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...result.images]
      }));

      toast({
        description: "Imagens enviadas com sucesso!"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        description: "Erro ao fazer upload das imagens. Tente novamente."
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (imageToRemove: string) => {
    try {
      await fetch('/api/properties/images', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ imagePath: imageToRemove })
      });

      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== imageToRemove)
      }));

      toast({
        description: "Imagem removida com sucesso!"
      });
    } catch (error) {
      console.error('Remove image error:', error);
      toast({
        variant: "destructive",
        description: "Erro ao remover imagem."
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Home className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Meus Imóveis</h1>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? "Editar Imóvel" : "Adicionar Novo Imóvel"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Imóvel *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ex: IMV001"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Imóvel *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Apartamento Centro"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionType">Tipo de Transação *</Label>
                  <Select value={formData.transactionType} onValueChange={(value) => setFormData({...formData, transactionType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({...formData, street: e.target.value})}
                    placeholder="Ex: Rua das Flores"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({...formData, number: e.target.value})}
                    placeholder="Ex: 123"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="proximity">Proximidade</Label>
                  <Input
                    id="proximity"
                    value={formData.proximity}
                    onChange={(e) => setFormData({...formData, proximity: e.target.value})}
                    placeholder="Ex: Próximo ao shopping"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                    placeholder="Ex: Centro"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  {isLoadingCities ? (
                    <Select disabled value="">
                      <SelectTrigger>
                        <SelectValue placeholder="Carregando cidades..." />
                      </SelectTrigger>
                    </Select>
                  ) : citiesError ? (
                    <div className="space-y-2">
                      <Select disabled value="">
                        <SelectTrigger className="border-destructive">
                          <SelectValue placeholder="Erro ao carregar cidades" />
                        </SelectTrigger>
                      </Select>
                      <p className="text-sm text-destructive">
                        Não foi possível carregar as cidades. Tente novamente.
                      </p>
                    </div>
                  ) : cities.length === 0 ? (
                    <div className="space-y-2">
                      <Select disabled value="">
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhuma cidade cadastrada" />
                        </SelectTrigger>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Cadastre cidades em <span className="font-medium">Imóveis → Cidades</span>
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({...formData, city: value})}
                      required
                    >
                      <SelectTrigger className={!formData.city ? "border-muted-foreground" : ""}>
                        <SelectValue placeholder="Selecione uma cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData({...formData, state: value})}
                    required
                  >
                    <SelectTrigger className={!formData.state ? "border-muted-foreground" : ""}>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                    placeholder="Ex: 01234-567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="privateArea">Área Privativa (m²) *</Label>
                  <Input
                    id="privateArea"
                    type="number"
                    step="0.01"
                    value={formData.privateArea}
                    onChange={(e) => setFormData({...formData, privateArea: e.target.value})}
                    placeholder="Ex: 85.50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parkingSpaces">Vagas de Garagem</Label>
                  <Input
                    id="parkingSpaces"
                    type="number"
                    min="0"
                    value={formData.parkingSpaces}
                    onChange={(e) => setFormData({...formData, parkingSpaces: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Banheiros</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="1"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Quartos</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o imóvel..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapLocation">Localização no Mapa</Label>
                <Input
                  id="mapLocation"
                  value={formData.mapLocation}
                  onChange={(e) => setFormData({...formData, mapLocation: e.target.value})}
                  placeholder="Ex: https://maps.google.com/... ou coordenadas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtubeVideoUrl">Vídeo do YouTube</Label>
                <Input
                  id="youtubeVideoUrl"
                  value={formData.youtubeVideoUrl}
                  onChange={(e) => setFormData({...formData, youtubeVideoUrl: e.target.value})}
                  placeholder="Ex: https://www.youtube.com/watch?v=..."
                />
              </div>

              {/* Seção de Comodidades */}
              <div className="space-y-2">
                <Label>Comodidades</Label>
                {isLoadingAmenities ? (
                  <div className="text-sm text-muted-foreground">Carregando comodidades...</div>
                ) : amenities.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Nenhuma comodidade cadastrada. Cadastre em <span className="font-medium">Imóveis → Comodidades</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border rounded-md">
                    {amenities.map((amenity) => {
                      const IconComponent = (Icons as any)[amenity.icon];
                      return (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`amenity-${amenity.id}`}
                            checked={formData.amenities.includes(amenity.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  amenities: [...formData.amenities, amenity.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  amenities: formData.amenities.filter(id => id !== amenity.id)
                                });
                              }
                            }}
                          />
                          <Label
                            htmlFor={`amenity-${amenity.id}`}
                            className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                          >
                            {IconComponent && <IconComponent className="w-4 h-4" />}
                            {amenity.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>


              {/* Seção de Upload de Imagens */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Imagens do Imóvel (Máximo 5)</Label>
                  <span className="text-sm text-muted-foreground">
                    {formData.images.length}/5
                  </span>
                </div>
                
                {/* Upload Area */}
                {formData.images.length < 5 && (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImages}
                    />
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                      {uploadingImages ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span>Enviando imagens...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="text-sm">
                            Clique aqui ou arraste imagens para fazer upload
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPEG, PNG, GIF, WebP (máx. 5MB por imagem)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={image}
                            alt={`Imóvel ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(image)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}
                >
                  {editingProperty ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Section */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou código do imóvel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTerm("")}
          >
            Limpar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Imóveis</CardTitle>
            {properties.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {searchTerm ? (
                  <>Mostrando {filteredProperties.length} de {properties.length} imóveis</>
                ) : (
                  <>{properties.length} {properties.length === 1 ? 'imóvel' : 'imóveis'}</>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando imóveis...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Erro ao carregar imóveis. Tente novamente.
            </div>
          ) : !Array.isArray(properties) || properties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum imóvel cadastrado. Clique em "Adicionar Novo" para começar.
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum imóvel encontrado com o termo "{searchTerm}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.code}</TableCell>
                      <TableCell>{property.name}</TableCell>
                      <TableCell>
                        <Badge variant={property.transactionType === "venda" ? "default" : "outline"}>
                          {property.transactionType === "venda" ? "Venda" : "Locação"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{property.street}, {property.number}</div>
                          <div className="text-muted-foreground">
                            {property.neighborhood}, {property.city}/{property.state}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="flex items-center">
                            <Bed className="w-3 h-3 mr-1" />
                            {property.bedrooms}
                          </div>
                          <div className="flex items-center">
                            <Bath className="w-3 h-3 mr-1" />
                            {property.bathrooms}
                          </div>
                          <div className="flex items-center">
                            <Car className="w-3 h-3 mr-1" />
                            {property.parkingSpaces}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{property.privateArea}m²</TableCell>
                      <TableCell>
                        <Badge 
                          variant={property.status === "active" ? "default" : "secondary"}
                          className={property.status === "active" 
                            ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200" 
                            : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200"
                          }
                        >
                          {property.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(property)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toggleStatusMutation.mutate({ id: property.id, status: property.status })}
                            >
                              <Power className="w-4 h-4 mr-2" />
                              {property.status === "active" ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            {property.mapLocation && (
                              <DropdownMenuItem 
                                onClick={() => window.open(property.mapLocation, '_blank')}
                              >
                                <MapPin className="w-4 h-4 mr-2" />
                                Ver Localização
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}