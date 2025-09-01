import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  List, Upload, FileSpreadsheet, FileText, Download, 
  Trash2, Check, X, Users, Phone, AlertCircle, ChevronLeft, ChevronRight
} from "lucide-react";

interface Contact {
  name: string;
  phone: string;
  valid: boolean;
  error?: string;
}

interface ContactList {
  id: string;
  name: string;
  contacts: Contact[];
  createdAt: Date;
}

export default function WhatsAppListaTransmissao() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentContacts, setCurrentContacts] = useState<Contact[]>([]);
  const [listName, setListName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 10;

  // Query to get saved contact lists
  const { data: savedLists = [], isLoading: listsLoading } = useQuery<ContactList[]>({
    queryKey: ["/api/contact-lists"],
    queryFn: () => apiGet("/contact-lists"),
  });

  // Mutation to create contact list
  const createListMutation = useMutation({
    mutationFn: (data: { name: string; contacts: Contact[] }) => apiPost("/contact-lists", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
      setListName("");
      setCurrentContacts([]);
      toast({
        title: "Sucesso",
        description: "Lista salva com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.response?.data?.error || "Erro ao salvar lista",
        variant: "destructive"
      });
    }
  });

  // Mutation to delete contact list
  const deleteListMutation = useMutation({
    mutationFn: (listId: string) => apiDelete(`/contact-lists/${listId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-lists"] });
      toast({
        title: "Lista excluída",
        description: "Lista de contatos excluída com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.response?.data?.error || "Erro ao excluir lista",
        variant: "destructive"
      });
    }
  });

  const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 0) {
      return { valid: false, error: "Telefone vazio" };
    }
    
    if (cleanPhone.length !== 13) {
      return { valid: false, error: "Deve ter 13 dígitos (55 + DDD + número)" };
    }
    
    if (!cleanPhone.startsWith('55')) {
      return { valid: false, error: "Deve começar com 55 (código do Brasil)" };
    }
    
    const ddd = cleanPhone.substring(2, 4);
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '63', // TO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '83', // PB
      '84', // RN
      '85', '88', // CE
      '86', '89', // PI
      '91', '93', '94', // PA
      '92', '97', // AM
      '95', // RR
      '96', // AP
      '98', '99' // MA
    ];
    
    if (!validDDDs.includes(ddd)) {
      return { valid: false, error: "DDD inválido" };
    }
    
    return { valid: true };
  };

  const parseFileContent = (content: string, fileName: string): Contact[] => {
    const contacts: Contact[] = [];
    
    if (fileName.endsWith('.csv')) {
      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header if it exists
      const startIndex = lines[0]?.toLowerCase().includes('nome') || lines[0]?.toLowerCase().includes('name') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handle quotes and commas)
        const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
        
        if (columns.length >= 2) {
          const name = columns[0]?.trim();
          const phone = columns[1]?.trim();
          
          if (name && phone) {
            const validation = validatePhoneNumber(phone);
            contacts.push({
              name,
              phone: phone.replace(/\D/g, ''), // Store only digits
              valid: validation.valid,
              error: validation.error
            });
          }
        }
      }
    } else {
      // For Excel files, assume tab-separated or similar format
      // This will be enhanced when we add proper Excel parsing library
      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header if it exists
      const startIndex = lines[0]?.toLowerCase().includes('nome') || lines[0]?.toLowerCase().includes('name') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Try different separators (tab, comma, semicolon)
        let columns = [];
        if (line.includes('\t')) {
          columns = line.split('\t');
        } else if (line.includes(';')) {
          columns = line.split(';');
        } else {
          columns = line.split(',');
        }
        
        columns = columns.map(col => col.trim().replace(/^["']|["']$/g, ''));
        
        if (columns.length >= 2) {
          const name = columns[0]?.trim();
          const phone = columns[1]?.trim();
          
          if (name && phone) {
            const validation = validatePhoneNumber(phone);
            contacts.push({
              name,
              phone: phone.replace(/\D/g, ''), // Store only digits
              valid: validation.valid,
              error: validation.error
            });
          }
        }
      }
    }
    
    return contacts;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xls|xlsx)$/i)) {
      toast({
        title: "Erro",
        description: "Formato de arquivo não suportado. Use CSV ou Excel (.xls/.xlsx)",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        const contacts = parseFileContent(content, file.name);
        setCurrentContacts(contacts);
        setCurrentPage(1); // Reset to first page when loading new contacts
        
        const validCount = contacts.filter(c => c.valid).length;
        const totalCount = contacts.length;
        
        if (totalCount === 0) {
          toast({
            title: "Arquivo vazio",
            description: "Nenhum contato foi encontrado no arquivo. Verifique o formato.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Arquivo carregado!",
            description: `${totalCount} contatos encontrados, ${validCount} válidos`,
          });
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        toast({
          title: "Erro",
          description: "Erro ao processar o arquivo. Verifique o formato.",
          variant: "destructive"
        });
      } finally {
        setUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleSaveList = () => {
    if (!listName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a lista",
        variant: "destructive"
      });
      return;
    }

    if (currentContacts.length === 0) {
      toast({
        title: "Erro",
        description: "Carregue uma lista de contatos primeiro",
        variant: "destructive"
      });
      return;
    }

    createListMutation.mutate({
      name: listName,
      contacts: currentContacts
    });
  };

  const handleDeleteList = (listId: string) => {
    if (confirm("Tem certeza que deseja excluir esta lista?")) {
      deleteListMutation.mutate(listId);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'Nome,Telefone',
      'João Silva,5511999999999',
      'Maria Santos,5511988888888',
      'Carlos Oliveira,5511977777777',
      'Ana Costa,5511966666666',
      'Pedro Almeida,5511955555555'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'modelo-lista-contatos.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 13) {
      return `+${phone.substring(0, 2)} (${phone.substring(2, 4)}) ${phone.substring(4, 5)} ${phone.substring(5, 9)}-${phone.substring(9)}`;
    }
    return phone;
  };

  // Pagination functions
  const totalPages = Math.ceil(currentContacts.length / contactsPerPage);
  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContactsPage = currentContacts.slice(indexOfFirstContact, indexOfLastContact);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Carregar Lista de Contatos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Arquivo CSV ou Excel</Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: CSV, XLS, XLSX
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Formato esperado:</p>
                <div className="p-3 bg-muted rounded-lg text-xs space-y-2">
                  <div>
                    <p><strong>Excel (.xls/.xlsx):</strong></p>
                    <p>Coluna A: Nome | Coluna B: Telefone</p>
                  </div>
                  <div>
                    <p><strong>CSV:</strong></p>
                    <p>nome,telefone</p>
                  </div>
                  <div>
                    <p><strong>Exemplo de dados:</strong></p>
                    <p>João Silva | 5511999999999</p>
                    <p>Maria Santos | 5511888888888</p>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadSampleCSV}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar modelo CSV
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Instruções
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>Excel:</strong> Coluna A = Nome, Coluna B = Telefone</li>
                  <li>• <strong>CSV:</strong> Primeira coluna = nome, Segunda coluna = telefone</li>
                  <li>• Telefones devem estar no formato: 5511999999999</li>
                  <li>• Números devem incluir código do país (55) + DDD + número</li>
                  <li>• Números inválidos serão marcados para revisão</li>
                </ul>
              </div>

              {currentContacts.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="listName">Nome da Lista</Label>
                  <Input
                    id="listName"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="Ex: Clientes Ativos"
                  />
                  <Button 
                    onClick={handleSaveList} 
                    className="w-full"
                    disabled={createListMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {createListMutation.isPending ? "Salvando..." : "Salvar Lista"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Upload Preview */}
      {currentContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Visualização dos Contatos
              <Badge variant="outline">
                {currentContacts.length} contatos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentContactsPage.map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell>{contact.name}</TableCell>
                      <TableCell>{formatPhone(contact.phone)}</TableCell>
                      <TableCell>
                        {contact.valid ? (
                          <Badge variant="default" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Válido
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <X className="w-3 h-3 mr-1" />
                            {contact.error}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {indexOfFirstContact + 1} a {Math.min(indexOfLastContact, currentContacts.length)} de {currentContacts.length} contatos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Válidos: {currentContacts.filter(c => c.valid).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Inválidos: {currentContacts.filter(c => !c.valid).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Lists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="w-5 h-5" />
            Listas Salvas
            <Badge variant="outline">
              {savedLists.length} listas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedLists.length === 0 ? (
            <div className="text-center py-8">
              <List className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma lista salva ainda</p>
              <p className="text-sm text-muted-foreground">
                Carregue um arquivo para criar sua primeira lista
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedLists.map((list) => (
                <div key={list.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{list.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {list.contacts.length} contatos
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {list.contacts.filter(c => c.valid).length} válidos
                        </span>
                        <span>
                          Criada em {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      Ver detalhes
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteList(list.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}