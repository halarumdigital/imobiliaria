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
import { IconSelector } from '@/components/icon-selector';
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Amenity {
  id: string;
  companyId: string;
  name: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

// Mapa de ícones para facilitar o acesso
const iconMap: Record<string, React.ComponentType<any>> = {
  Sofa: Icons.Sofa,
  Bed: Icons.Bed,
  Bath: Icons.Bath,
  Car: Icons.Car,
  Trees: Icons.Trees,
  Waves: Icons.Waves,
  Sun: Icons.Sun,
  Coffee: Icons.Coffee,
  Wifi: Icons.Wifi,
  Tv: Icons.Tv,
  AirVent: Icons.AirVent,
  Snowflake: Icons.Snowflake,
  Flame: Icons.Flame,
  Utensils: Icons.Utensils,
  Dumbbell: Icons.Dumbbell,
  Users: Icons.Users,
  Baby: Icons.Baby,
  Dog: Icons.Dog,
  Cat: Icons.Cat,
  Shield: Icons.Shield,
  Camera: Icons.Camera,
  Lock: Icons.Lock,
  Key: Icons.Key,
  Phone: Icons.Phone,
  MapPin: Icons.MapPin,
  Home: Icons.Home,
  Building: Icons.Building,
  Building2: Icons.Building2,
  TreePine: Icons.TreePine,
  Flower: Icons.Flower,
  Mountain: Icons.Mountain,
  Umbrella: Icons.Umbrella,
  Zap: Icons.Zap,
  Droplet: Icons.Droplet,
  Wind: Icons.Wind,
  Thermometer: Icons.Thermometer,
  Music: Icons.Music,
  Volume2: Icons.Volume2,
  Gamepad2: Icons.Gamepad2,
  Book: Icons.Book,
  GraduationCap: Icons.GraduationCap,
  ShoppingBag: Icons.ShoppingBag,
  ShoppingCart: Icons.ShoppingCart,
  Package: Icons.Package,
  Briefcase: Icons.Briefcase,
  Calendar: Icons.Calendar,
  Clock: Icons.Clock,
  Timer: Icons.Timer,
  Trash2: Icons.Trash2,
  Recycle: Icons.Recycle,
  ParkingCircle: Icons.ParkingCircle,
  Bike: Icons.Bike,
  Train: Icons.Train,
  Bus: Icons.Bus,
  Plane: Icons.Plane,
  Ship: Icons.Ship,
  Anchor: Icons.Anchor,
  Compass: Icons.Compass,
  Map: Icons.Map,
  Navigation: Icons.Navigation,
  Heart: Icons.Heart,
  Star: Icons.Star,
  Award: Icons.Award,
  Trophy: Icons.Trophy,
  Medal: Icons.Medal,
  Crown: Icons.Crown,
  Gem: Icons.Gem,
  Gift: Icons.Gift,
  Cake: Icons.Cake,
  PartyPopper: Icons.PartyPopper,
  Sparkles: Icons.Sparkles,
  Palette: Icons.Palette,
  Brush: Icons.Brush,
  PaintBucket: Icons.PaintBucket,
  Ruler: Icons.Ruler,
  Hammer: Icons.Hammer,
  Wrench: Icons.Wrench,
  HardHat: Icons.HardHat,
  Lightbulb: Icons.Lightbulb,
  Lamp: Icons.Lamp,
  Flashlight: Icons.Flashlight,
  Sunrise: Icons.Sunrise,
  Sunset: Icons.Sunset,
  Moon: Icons.Moon,
  Cloud: Icons.Cloud,
  CloudRain: Icons.CloudRain,
  CloudSnow: Icons.CloudSnow,
  Fish: Icons.Fish,
  Flower2: Icons.Flower2,
  Cherry: Icons.Cherry,
  Apple: Icons.Apple,
  Pizza: Icons.Pizza,
  Sandwich: Icons.Sandwich,
  Soup: Icons.Soup,
  Cookie: Icons.Cookie,
  Milk: Icons.Milk,
  Beer: Icons.Beer,
  Wine: Icons.Wine,
  Martini: Icons.Martini,
  CupSoda: Icons.CupSoda,
  Pill: Icons.Pill,
  Stethoscope: Icons.Stethoscope,
  Activity: Icons.Activity,
  Accessibility: Icons.Accessibility,
  Archive: Icons.Archive,
  Inbox: Icons.Inbox,
  Send: Icons.Send,
  CheckCircle: Icons.CheckCircle,
  XCircle: Icons.XCircle,
  AlertCircle: Icons.AlertCircle,
  Info: Icons.Info,
  HelpCircle: Icons.HelpCircle
};

export default function Amenities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch amenities
  const { data: amenities = [], isLoading } = useQuery<Amenity[]>({
    queryKey: ['amenities'],
    queryFn: async () => {
      return await apiGet('/amenities');
    }
  });

  // Create amenity mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      return await apiPost('/amenities', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      toast({
        title: 'Sucesso',
        description: 'Comodidade criada com sucesso!',
      });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao criar comodidade',
        variant: 'destructive',
      });
    }
  });

  // Update amenity mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; icon: string } }) => {
      return await apiPut(`/amenities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      toast({
        title: 'Sucesso',
        description: 'Comodidade atualizada com sucesso!',
      });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao atualizar comodidade',
        variant: 'destructive',
      });
    }
  });

  // Delete amenity mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiDelete(`/amenities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      toast({
        title: 'Sucesso',
        description: 'Comodidade excluída com sucesso!',
      });
      setIsDeleteOpen(false);
      setSelectedAmenity(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao excluir comodidade',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', icon: '' });
    setSelectedAmenity(null);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.icon) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedAmenity || !formData.name || !formData.icon) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate({ id: selectedAmenity.id, data: formData });
  };

  const handleDelete = () => {
    if (selectedAmenity) {
      deleteMutation.mutate(selectedAmenity.id);
    }
  };

  const openEditDialog = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setFormData({ name: amenity.name, icon: amenity.icon });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setIsDeleteOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  const filteredAmenities = amenities.filter(amenity =>
    amenity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando comodidades...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comodidades</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Comodidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Comodidade</DialogTitle>
              <DialogDescription>
                Adicione uma nova comodidade para seus imóveis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Ex: Piscina, Academia, Churrasqueira..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <IconSelector
                  value={formData.icon}
                  onChange={(value) => setFormData({ ...formData, icon: value })}
                  placeholder="Selecione um ícone"
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
          placeholder="Buscar comodidade..."
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
              <TableHead className="w-20">Ícone</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAmenities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {searchTerm ? 'Nenhuma comodidade encontrada' : 'Nenhuma comodidade cadastrada'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAmenities.map((amenity) => (
                <TableRow key={amenity.id}>
                  <TableCell>
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
                      {getIconComponent(amenity.icon)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{amenity.name}</TableCell>
                  <TableCell>
                    {new Date(amenity.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(amenity)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDeleteDialog(amenity)}
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
            <DialogTitle>Editar Comodidade</DialogTitle>
            <DialogDescription>
              Atualize as informações da comodidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                placeholder="Ex: Piscina, Academia, Churrasqueira..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Ícone</Label>
              <IconSelector
                value={formData.icon}
                onChange={(value) => setFormData({ ...formData, icon: value })}
                placeholder="Selecione um ícone"
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
            <AlertDialogTitle>Excluir Comodidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a comodidade "{selectedAmenity?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAmenity(null)}>
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