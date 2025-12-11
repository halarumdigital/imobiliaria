import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { Globe, Search, Wifi, WifiOff, Copy, RefreshCw } from "lucide-react";

interface Proxy {
  id: string;
  username: string;
  password: string;
  proxy_address: string;
  port: number;
  valid: boolean;
  country_code: string;
  city_name: string;
}

interface ProxyResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Proxy[];
}

export default function WhatsAppProxy() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [mode, setMode] = useState("direct");
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const { data: proxiesData, isLoading, error, refetch } = useQuery<ProxyResponse>({
    queryKey: ["whatsapp-proxy-list", { page: currentPage, pageSize, mode, search, countryFilter }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
        mode,
      });

      if (search) params.append("search", search);
      if (countryFilter) params.append("country_code__in", countryFilter);

      return apiGet(`/whatsapp/proxy/list?${params.toString()}`);
    },
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: `${label} copiado para a área de transferência`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência",
        variant: "destructive",
      });
    }
  };

  const formatProxyUrl = (proxy: Proxy) => {
    return `http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.port}`;
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const totalPages = proxiesData ? Math.ceil(proxiesData.count / pageSize) : 0;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Globe className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Proxies WebShare</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-red-500 text-lg font-medium">
                Erro ao carregar proxies
              </div>
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "Verifique se o token WebShare está configurado no painel administrativo"}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Proxies WebShare</h1>
        </div>

        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Modo</label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="backbone">Backbone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">País</label>
              <Input
                placeholder="Ex: US, BR, FR"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Buscar proxies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Por Página</label>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Proxies */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Proxies
            {proxiesData && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({proxiesData.count} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Carregando proxies...</p>
            </div>
          ) : proxiesData?.results?.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Porta</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proxiesData.results.map((proxy) => (
                    <TableRow key={proxy.id}>
                      <TableCell>
                        <Badge variant={proxy.valid ? "default" : "destructive"}>
                          {proxy.valid ? (
                            <Wifi className="w-3 h-3 mr-1" />
                          ) : (
                            <WifiOff className="w-3 h-3 mr-1" />
                          )}
                          {proxy.valid ? "Online" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {proxy.proxy_address}
                      </TableCell>
                      <TableCell>{proxy.port}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{proxy.country_code}</Badge>
                      </TableCell>
                      <TableCell>{proxy.city_name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {proxy.username}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center space-x-2">
                          <span>{proxy.password}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(proxy.password, "Password")}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(proxy.proxy_address, "Endereço")}
                          title="Copiar Endereço"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} ({proxiesData.count} proxies)
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum proxy encontrado</h3>
              <p className="text-muted-foreground">
                Ajuste os filtros ou verifique sua configuração WebShare.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}