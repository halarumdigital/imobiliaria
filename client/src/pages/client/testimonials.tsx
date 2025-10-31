import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Plus, Edit, Trash2, Star, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompanyTestimonial {
  id: string;
  companyId: string;
  clientName: string;
  clientAvatar: string | null;
  rating: number;
  comment: string;
  propertyType: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TestimonialFormData {
  clientName: string;
  clientAvatar: string;
  rating: number;
  comment: string;
  propertyType: string;
  isActive: boolean;
}

const EMPTY_FORM: TestimonialFormData = {
  clientName: "",
  clientAvatar: "",
  rating: 5,
  comment: "",
  propertyType: "",
  isActive: true,
};

export default function Testimonials() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<CompanyTestimonial | null>(null);
  const [formData, setFormData] = useState<TestimonialFormData>(EMPTY_FORM);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch testimonials
  const { data: testimonials = [], isLoading } = useQuery<CompanyTestimonial[]>({
    queryKey: ["/api/client/testimonials"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: TestimonialFormData) => {
      const response = await fetch("/api/client/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar depoimento");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Depoimento criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client/testimonials"] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TestimonialFormData> }) => {
      const response = await fetch(`/api/client/testimonials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar depoimento");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Depoimento atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client/testimonials"] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/client/testimonials/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar depoimento");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Depoimento deletado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/client/testimonials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (testimonial?: CompanyTestimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        clientName: testimonial.clientName,
        clientAvatar: testimonial.clientAvatar || "",
        rating: testimonial.rating,
        comment: testimonial.comment,
        propertyType: testimonial.propertyType || "",
        isActive: testimonial.isActive,
      });
    } else {
      setEditingTestimonial(null);
      setFormData(EMPTY_FORM);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTestimonial(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName.trim()) {
      toast({
        title: "Atenção",
        description: "O nome do cliente é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.comment.trim()) {
      toast({
        title: "Atenção",
        description: "O comentário é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (editingTestimonial) {
      updateMutation.mutate({ id: editingTestimonial.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (testimonial: CompanyTestimonial) => {
    if (confirm(`Tem certeza que deseja deletar o depoimento de ${testimonial.clientName}?`)) {
      deleteMutation.mutate(testimonial.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : "0.0";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-8 h-8" />
              Depoimentos
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os depoimentos de clientes satisfeitos
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Novo Depoimento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Depoimentos</CardDescription>
              <CardTitle className="text-3xl">{testimonials.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Depoimentos Ativos</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {testimonials.filter((t) => t.isActive).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avaliação Média</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {avgRating}
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Tipo de Imóvel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum depoimento cadastrado. Clique em "Novo Depoimento" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  testimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={testimonial.clientAvatar || undefined}
                              alt={testimonial.clientName}
                            />
                            <AvatarFallback>{getInitials(testimonial.clientName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{testimonial.clientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(testimonial.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{renderStars(testimonial.rating)}</TableCell>
                      <TableCell>
                        <p className="max-w-md line-clamp-2 text-sm">{testimonial.comment}</p>
                      </TableCell>
                      <TableCell>
                        {testimonial.propertyType ? (
                          <Badge variant="outline">{testimonial.propertyType}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {testimonial.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(testimonial)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(testimonial)}
                            disabled={deleteMutation.isPending}
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
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? "Editar Depoimento" : "Novo Depoimento"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do depoimento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">
                  Nome do Cliente <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Maria Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientAvatar">Foto do Cliente (URL) - Opcional</Label>
                <Input
                  id="clientAvatar"
                  value={formData.clientAvatar}
                  onChange={(e) => setFormData({ ...formData, clientAvatar: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Avaliação</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 cursor-pointer transition-all ${
                          star <= formData.rating
                            ? "fill-yellow-400 text-yellow-400 scale-110"
                            : "text-gray-300 hover:text-yellow-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {formData.rating} de 5
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">
                  Comentário <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="O atendimento foi excepcional e encontrei o imóvel perfeito para minha família..."
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo de 50 caracteres recomendado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType">Tipo de Imóvel - Opcional</Label>
                <Input
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  placeholder="Ex: Apartamento, Casa, Comercial"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="isActive">Status Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Depoimento aparecerá no website público
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingTestimonial ? "Salvar Alterações" : "Criar Depoimento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
