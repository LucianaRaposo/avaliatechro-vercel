import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Award, CheckCircle2, Loader2, ExternalLink, AlertTriangle, Trophy } from "lucide-react";
import { useScope } from "@/lib/useScope";

const positionLabel = (i) => {
  if (i === 0) return "1º";
  if (i === 1) return "2º";
  if (i === 2) return "3º";
  return `${i + 1}º`;
};

export default function BulkCertificateGenerator({ connected }) {
  const { filterByScope } = useScope();
  const [templateId, setTemplateId] = useState("auto");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ["certificateTemplates"],
    queryFn: () => base44.entities.CertificateTemplate.filter({ is_active: true }),
  });

  const premiacaoTemplates = templates.filter(t => t.type === "premiacao");

  const { data: rankedProjects = [], isLoading } = useQuery({
    queryKey: ["projects-ranked-awarded"],
    queryFn: async () => {
      const all = await base44.entities.Project.filter({ status: "premiado" });
      const scoped = filterByScope(all);
      return scoped
        .filter(p => p.final_score > 0)
        .sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
    },
  });

  const handleGenerateAll = async () => {
    if (rankedProjects.length === 0) return;
    setGenerating(true);
    setProgress(0);
    setResults([]);
    setDone(false);

    const allResults = [];
    for (let i = 0; i < rankedProjects.length; i++) {
      const project = rankedProjects[i];
      try {
        const payload = { projectId: project.id };
        if (templateId !== "auto") payload.templateId = templateId;
        const res = await base44.functions.invoke("generateCertificate", payload);
        allResults.push({ project, status: "ok", data: res.data });
      } catch (err) {
        allResults.push({ project, status: "error", error: err.message });
      }
      setProgress(Math.round(((i + 1) / rankedProjects.length) * 100));
    }

    setResults(allResults);
    setDone(true);
    setGenerating(false);

    const successCount = allResults.filter(r => r.status === "ok").length;
    toast({
      title: `${successCount} de ${rankedProjects.length} projetos gerados!`,
      description: successCount < rankedProjects.length ? "Alguns projetos tiveram erro. Verifique abaixo." : "Todos os certificados foram salvos no Google Drive.",
    });
  };

  if (!connected) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-base">Geração em Lote — Projetos Premiados</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Gere certificados automaticamente para todos os projetos premiados com base no ranking final
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando projetos...
          </div>
        ) : rankedProjects.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Nenhum projeto com status "Premiado" e nota final encontrado. Avalie os projetos e marque-os como premiados.
          </div>
        ) : (
          <>
            {/* Ranked preview */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {rankedProjects.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 text-sm">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                    {positionLabel(i)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.school} · {p.category}</p>
                  </div>
                  <span className="font-bold text-primary text-sm shrink-0">{p.final_score?.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Template selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 w-full">
                <label className="text-xs text-muted-foreground mb-1 block">Template de Premiação</label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático (padrão de premiação)</SelectItem>
                    {premiacaoTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateAll}
                disabled={generating || rankedProjects.length === 0}
                className="sm:mt-5 w-full sm:w-auto"
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando ({progress}%)</>
                  : <><Award className="w-4 h-4 mr-2" /> Gerar {rankedProjects.length} Projetos</>
                }
              </Button>
            </div>

            {/* Progress bar */}
            {generating && (
              <Progress value={progress} className="h-2" />
            )}

            {/* Results */}
            {done && results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Resultado da geração:</p>
                {results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${r.status === "ok" ? "bg-primary/5 border border-primary/15" : "bg-destructive/5 border border-destructive/15"}`}>
                    {r.status === "ok"
                      ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      : <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.project.title}</p>
                      {r.status === "ok" && (
                        <p className="text-xs text-muted-foreground">{r.data.results?.length} certificado(s) — template: {r.data.templateUsed || "padrão"}</p>
                      )}
                      {r.status === "error" && <p className="text-xs text-destructive">{r.error}</p>}
                    </div>
                    {r.status === "ok" && r.data.folderUrl && (
                      <a href={r.data.folderUrl} target="_blank" rel="noreferrer" className="shrink-0">
                        <ExternalLink className="w-4 h-4 text-accent hover:text-accent/80" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}