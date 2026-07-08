import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Plus, FolderOpen, LogOut, User } from "lucide-react";
import ProjectForm from "@/components/projects/ProjectForm";
import { useNavigate } from "react-router-dom";

const statusLabels = {
  inscrito: { label: "Inscrito", color: "bg-blue-100 text-blue-700" },
  aprovado: { label: "Aprovado", color: "bg-green-100 text-green-700" },
  em_avaliacao: { label: "Em Avaliação", color: "bg-yellow-100 text-yellow-700" },
  avaliado: { label: "Avaliado", color: "bg-purple-100 text-purple-700" },
  premiado: { label: "Premiado", color: "bg-orange-100 text-orange-700" },
  classificado: { label: "Classificado", color: "bg-emerald-100 text-emerald-700" },
};

export default function ProfessorPortal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const { data: fairConfig } = useQuery({
    queryKey: ["stateFairConfig"],
    queryFn: () => base44.entities.StateFairConfig.list(),
    select: (data) => data[0],
  });

  const { data: myProjects = [], isLoading } = useQuery({
    queryKey: ["myProjects", user?.id],
    queryFn: () => base44.entities.Project.filter({ advisor_email: user?.email }),
    enabled: !!user?.email,
  });

  const handleSave = () => {
    setShowForm(false);
    setEditProject(null);
    queryClient.invalidateQueries({ queryKey: ["myProjects", user?.id] });
  };

  const handleLogout = () => {
    import("@/api/base44Client").then(({ base44: b }) => b.auth.logout());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Award className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">
              {fairConfig?.official_name || "Feira Estadual de Projetos"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {user?.full_name?.[0]?.toUpperCase() || "P"}
                </span>
              </div>
              <span className="hidden sm:block">{user?.full_name || "Perfil"}</span>
            </button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Boas-vindas */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">
                {fairConfig?.official_name || "Feira Estadual de Projetos"}
                {fairConfig?.edition_year ? ` — ${fairConfig.edition_year}` : ""}
              </h1>
              {fairConfig?.slogan && (
                <p className="text-muted-foreground mt-1 italic">"{fairConfig.slogan}"</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Professor, cadastre seu Projeto!</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Ação principal */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Meus Projetos
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {myProjects.length === 0 ? "Nenhum projeto cadastrado ainda." : `${myProjects.length} projeto(s) cadastrado(s)`}
            </p>
          </div>
          <Button onClick={() => { setEditProject(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Cadastrar Projeto
          </Button>
        </div>

        {/* Lista de projetos do professor */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : myProjects.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum projeto cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">Clique em "Cadastrar Projeto" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myProjects.map(p => {
              const st = statusLabels[p.status] || { label: p.status, color: "bg-muted text-muted-foreground" };
              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{p.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {p.school} • {p.municipality}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Categoria: {p.category} {p.code && `• Código: ${p.code}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                        <Button variant="outline" size="sm" onClick={() => { setEditProject(p); setShowForm(true); }}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info sobre o processo */}
        <Card className="bg-muted/50 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>1. Cadastre seu(s) projeto(s) clicando no botão acima.</p>
            <p>2. Após o cadastro, a equipe organizadora irá analisar e aprovar sua inscrição.</p>
            <p>3. Você será notificado pelo e-mail cadastrado sobre o andamento.</p>
          </CardContent>
        </Card>
      </main>

      {/* Modal de cadastro */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editProject ? "Editar Projeto" : "Cadastrar Projeto"}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editProject}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditProject(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}