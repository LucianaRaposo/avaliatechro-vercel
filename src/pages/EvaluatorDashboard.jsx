import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck, CheckCircle2, Clock, Search, School,
  MapPin, ChevronRight, QrCode, FolderOpen, AlertCircle, WifiOff, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import QRScanner from "@/components/qr/QRScanner";
import { useOfflineEvaluations } from "@/lib/useOfflineEvaluations";
import { toast } from "@/components/ui/use-toast";

const statusColors = {
  inscrito: "bg-secondary text-secondary-foreground",
  aprovado: "bg-primary/10 text-primary",
  em_avaliacao: "bg-accent/10 text-accent",
  avaliado: "bg-chart-3/10 text-chart-3",
  premiado: "bg-chart-4/10 text-chart-4",
  classificado: "bg-chart-2/10 text-chart-2",
};
const statusLabels = {
  inscrito: "Inscrito", aprovado: "Aprovado", em_avaliacao: "Em Avaliação",
  avaliado: "Avaliado", premiado: "Premiado", classificado: "Classificado",
};

export default function EvaluatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [tab, setTab] = useState("pending");
  const { isOnline, pendingCount, syncing, syncPending } = useOfflineEvaluations();

  const handleManualSync = async () => {
    const count = await syncPending();
    if (count > 0) {
      toast({ title: `${count} avaliação(ões) sincronizada(s) com sucesso!` });
    } else {
      toast({ title: "Nada para sincronizar." });
    }
  };

  const handleQRScan = (text) => {
    setShowScanner(false);
    try {
      const url = new URL(text);
      const pathParts = url.pathname.split("/");
      const projectCode = pathParts[pathParts.indexOf("project") + 1];
      if (projectCode) {
        navigate(`/project/${projectCode}?tab=evaluate&from_qr=true`);
        return;
      }
    } catch {
      // Not a URL
    }
    navigate(`/project/${text}?tab=evaluate&from_qr=true`);
  };

  // Load ALL projects (evaluators can evaluate any project, SERTIC scoping is admin-only)
  const { data: allProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["projects-evaluator", user?.id],
    queryFn: () => base44.entities.Project.list(),
    enabled: !!user?.id,
  });

  const { data: myEvaluations = [], isLoading: loadingEvals } = useQuery({
    queryKey: ["my-evaluations", user?.id],
    queryFn: () => base44.entities.Evaluation.filter({ evaluator_id: user?.id }),
    enabled: !!user?.id,
  });

  const evaluatedProjectIds = new Set(myEvaluations.map(e => e.project_id));

  const available = allProjects;
  const pending = available.filter(p => !evaluatedProjectIds.has(p.id));
  const done = available.filter(p => evaluatedProjectIds.has(p.id));

  const filterProjects = (list) => list.filter(p =>
    !search ||
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.school?.toLowerCase().includes(search.toLowerCase()) ||
    p.municipality?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  const loading = loadingProjects || loadingEvals;
  const displayList = tab === "pending" ? filterProjects(pending) : filterProjects(done);

  return (
    <div className="space-y-6 max-w-5xl">
      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}

      {/* Offline / Sync banner */}
      {!isOnline && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-chart-3/10 border border-chart-3/30">
          <div className="flex items-center gap-2 text-sm text-chart-3">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="font-medium">Você está offline. As avaliações serão salvas localmente.</span>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-chart-3/20 text-chart-3 shrink-0">{pendingCount} pendente(s)</Badge>
          )}
        </div>
      )}
      {isOnline && pendingCount > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 text-sm text-primary">
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span className="font-medium">{pendingCount} avaliação(ões) offline aguardando sincronização.</span>
          </div>
          <Button size="sm" onClick={handleManualSync} disabled={syncing} className="shrink-0">
            {syncing ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Sincronizar
          </Button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Meu Painel de Avaliação</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Olá, <span className="font-medium text-foreground">{user?.full_name}</span>! Gerencie suas avaliações de projetos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pendentes</p>
              <p className="text-2xl font-heading font-bold text-foreground">{loading ? "—" : pending.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Avaliados</p>
              <p className="text-2xl font-heading font-bold text-foreground">{loading ? "—" : done.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total</p>
              <p className="text-2xl font-heading font-bold text-foreground">{loading ? "—" : available.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner CTA */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-primary" />
            <div>
              <p className="font-medium text-foreground text-sm">Escanear QR Code do Projeto</p>
              <p className="text-xs text-muted-foreground">Aponte a câmera para o QR Code do projeto para acessar a ficha de avaliação</p>
            </div>
          </div>
          <Button onClick={() => setShowScanner(true)}>
            <QrCode className="w-4 h-4 mr-1" /> Escanear
          </Button>
        </CardContent>
      </Card>

      {/* Project list */}
      <div className="space-y-4">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-muted rounded-xl p-1 gap-1 w-fit">
            <button
              onClick={() => setTab("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "pending" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Pendentes {!loading && <span className="ml-1 text-xs">({pending.length})</span>}
            </button>
            <button
              onClick={() => setTab("done")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "done" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Avaliados {!loading && <span className="ml-1 text-xs">({done.length})</span>}
            </button>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projeto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {loading && <div className="text-center py-12 text-muted-foreground">Carregando projetos...</div>}

        {!loading && displayList.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center space-y-2">
              {tab === "pending"
                ? <><CheckCircle2 className="w-12 h-12 text-primary mx-auto" /><p className="font-heading font-semibold text-lg">Tudo avaliado!</p><p className="text-sm text-muted-foreground">Você já avaliou todos os projetos disponíveis.</p></>
                : <><AlertCircle className="w-12 h-12 text-muted-foreground mx-auto opacity-30" /><p className="font-heading font-semibold text-lg">Nenhuma avaliação ainda</p><p className="text-sm text-muted-foreground">Suas avaliações concluídas aparecerão aqui.</p></>
              }
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((project, i) => {
            const myEval = myEvaluations.find(e => e.project_id === project.id);
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 hover:-translate-y-0.5 border-border/50 group"
                  onClick={() => navigate(`/project/${project.code}?tab=evaluate`)}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground mb-1">{project.code}</p>
                        <h3 className="font-heading font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors text-sm">
                          {project.title}
                        </h3>
                      </div>
                      {tab === "done" && myEval
                        ? <Badge className="bg-primary/10 text-primary text-xs shrink-0 font-bold">{myEval.weighted_average?.toFixed(1)}</Badge>
                        : <Badge className={`text-xs shrink-0 ${statusColors[project.status]}`}>{statusLabels[project.status]}</Badge>
                      }
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-xs">{project.category}</Badge>
                      {project.phase && <Badge variant="outline" className="text-xs capitalize">{project.phase}</Badge>}
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><School className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{project.school}</span></div>
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{project.municipality}</span></div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">{project.students?.length || 0} aluno(s)</span>
                      {tab === "pending"
                        ? <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={e => { e.stopPropagation(); navigate(`/project/${project.code}?tab=evaluate`); }}>
                            Avaliar <ChevronRight className="w-3 h-3" />
                          </Button>
                        : <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={e => { e.stopPropagation(); navigate(`/project/${project.code}?tab=evaluate`); }}>
                            <ClipboardCheck className="w-3 h-3" /> Ver
                          </Button>
                      }
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}