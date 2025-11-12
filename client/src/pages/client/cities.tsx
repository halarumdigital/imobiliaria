import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, MapPin } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface City {
  id: string;
  companyId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function Cities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cities
  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: async () => {
      return await apiGet('/cities');
    }
  });

  // Create city mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return await apiPost('/cities', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast({
        title: 'Sucesso',
        description: 'Cidade criada com sucesso!',
      });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao criar cidade',
        variant: 'destructive',
      });
    }
  });

  // Update city mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string } }) => {
      return await apiPut(`/cities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast({
        title: 'Sucesso',
        description: 'Cidade atualizada com sucesso!',
      });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao atualizar cidade',
        variant: 'destructive',
      });
    }
  });

  // Delete city mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiDelete(`/cities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast({
        title: 'Sucesso',
        description: 'Cidade excluída com sucesso!',
      });
      setIsDeleteOpen(false);
      setSelectedCity(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao excluir cidade',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({ name: '' });
    setSelectedCity(null);
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, digite o nome da cidade',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedCity || !formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, digite o nome da cidade',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate({ id: selectedCity.id, data: formData });
  };

  const handleDelete = () => {
    if (selectedCity) {
      deleteMutation.mutate(selectedCity.id);
    }
  };

  const openEditDialog = (city: City) => {
    setSelectedCity(city);
    setFormData({ name: city.name });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (city: City) => {
    setSelectedCity(city);
    setIsDeleteOpen(true);
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando cidades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Cidades</h1>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Cidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Cidade</DialogTitle>
              <DialogDescription>
                Adicione uma nova cidade para cadastro de imóveis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Cidade</Label>
                <Input
                  id="name"
                  placeholder="Ex: São Paulo, Rio de Janeiro, Belo Horizonte..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreate();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {searchTerm ? 'Nenhuma cidade encontrada' : 'Nenhuma cidade cadastrada'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>
                    {new Date(city.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(city)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDeleteDialog(city)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cidade</DialogTitle>
            <DialogDescription>
              Atualize o nome da cidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Cidade</Label>
              <Input
                id="edit-name"
                placeholder="Ex: São Paulo, Rio de Janeiro, Belo Horizonte..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a cidade "{selectedCity?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCity(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}