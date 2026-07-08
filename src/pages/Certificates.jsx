import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Award, FolderOpen, ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Link2 } from "lucide-react";
import { useScope } from "@/lib/useScope";
import BulkCertificateGenerator from "@/components/certificates/BulkCertificateGenerator";

const CONNECTOR_ID = "6a3d66a1eba39b338bb9d21c";

export default function Certificates() {
  const { serticId, filterByScope } = useScope();
  const [connected, setConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [generating, setGenerating] = useState({});
  const [results, setResults] = useState({});

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects-awarded", serticId],
    queryFn: async () => {
      const all = await base44.entities.Project.filter({ status: "premiado" });
      return filterByScope(all);
    },
  });

  const checkConnection = async () => {
    try {
      const status = await base44.connectors.getAppUserConnectionStatus(CONNECTOR_ID);
      setConnected(status?.connected === true);
    } catch {
      setConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Rule 3: open OAuth popup and poll for close
  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setCheckingConnection(true);
        checkConnection();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
  };

  const handleGenerate = async (project) => {
    setGenerating(prev => ({ ...prev, [project.id]: true }));
    try {
      const res = await base44.functions.invoke("generateCertificate", { projectId: project.id });
      setResults(prev => ({ ...prev, [project.id]: res.data }));
      toast({ title: "Certificados gerados!", description: `${res.data.results?.length} arquivo(s) salvos no Google Drive.` });
    } catch (err) {
      toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(prev => ({ ...prev, [project.id]: false }));
    }
  };

  const handleGenerateAll = async () => {
    for (const project of projects) {
      await handleGenerate(project);
    }
  };

  if (checkingConnection) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <span className="text-muted-foreground">Verificando conexão com o Google Drive...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Certificados</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gere PDFs para projetos premiados e salve no Google Drive
          </p>
        </div>
        {connected && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <Link2 className="w-4 h-4 mr-1" /> Desconectar Drive
            </Button>
            {projects.length > 0 && (
              <Button onClick={handleGenerateAll} size="sm">
                <Award className="w-4 h-4 mr-1" /> Gerar Todos
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Drive Connection Status */}
      {!connected ? (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-8 text-center space-y-4">
            <FolderOpen className="w-14 h-14 text-accent mx-auto" />
            <div>
              <h3 className="font-heading font-bold text-lg">Conecte seu Google Drive</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Para gerar e salvar certificados em PDF, conecte sua conta Google. Os arquivos serão organizados automaticamente em pastas por edição e categoria.
              </p>
            </div>
            <Button onClick={handleConnect} size="lg">
              <FolderOpen className="w-5 h-5 mr-2" /> Conectar Google Drive
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-foreground">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>Google Drive conectado. Os certificados serão salvos em <strong>Certificados - Feira Estadual / Edição / Categoria</strong>.</span>
        </div>
      )}

      {/* Bulk generator from ranking */}
      <BulkCertificateGenerator connected={connected} />

      {/* Projects list */}
      {connected && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum projeto com status <strong>"Premiado"</strong> encontrado.</p>
                <p className="text-xs text-muted-foreground mt-1">Altere o status dos projetos para "Premiado" na seção de Projetos.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(project => {
                const result = results[project.id];
                const isGen = generating[project.id];
                return (
                  <Card key={project.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-heading text-base leading-tight">{project.title}</CardTitle>
                        <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">Premiado</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{project.category} · {project.school}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>👩‍🎓 Alunos: {(project.students || []).filter(s => s.name).length}</p>
                        <p>👨‍🏫 Orientador: {project.advisor_name || "—"}</p>
                      </div>

                      {result ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {result.results?.length} certificado(s) gerado(s)
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                              <a href={result.folderUrl} target="_blank" rel="noreferrer">
                                <FolderOpen className="w-3.5 h-3.5 mr-1" /> Ver Pasta
                              </a>
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleGenerate(project)} disabled={isGen}>
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          {result.results?.map((r, i) => (
                            <a key={i} href={r.url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs text-accent hover:underline">
                              <ExternalLink className="w-3 h-3" />
                              {r.type === "aluno" ? "Aluno" : "Professor"}: {r.name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <Button size="sm" className="w-full" onClick={() => handleGenerate(project)} disabled={isGen}>
                          {isGen ? (
                            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Gerando...</>
                          ) : (
                            <><Award className="w-4 h-4 mr-1" /> Gerar Certificados</>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}