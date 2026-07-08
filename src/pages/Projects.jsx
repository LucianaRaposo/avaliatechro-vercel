import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectForm from "@/components/projects/ProjectForm";
import { useNavigate } from "react-router-dom";
import { useScope } from "@/lib/useScope";

export default function Projects() {
  const { isAdmin, isSerticAdmin, serticId, filterByScope } = useScope();
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPhase, setFilterPhase] = useState("all");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", serticId],
    queryFn: async () => {
      const all = await base44.entities.Project.list("-created_date");
      return filterByScope(all);
    },
  });

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.school?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.municipality?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    const matchPhase = filterPhase === "all" || p.phase === filterPhase;
    return matchSearch && matchCategory && matchPhase;
  });

  const handleCardClick = (project) => {
    navigate(`/project/${project.code}`);
  };

  const handleDelete = async () => {
    if (!deleteProject) return;
    await base44.entities.Project.delete(deleteProject.id);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    setDeleteProject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Projetos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} projeto(s) encontrado(s)
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditProject(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Projeto
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, escola, código ou município..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {["Iniciação Científica", "Pesquisa", "Inovação Tecnológica", "Ciências Humanas", "Ciências Exatas", "Ciências Biológicas", "Robótica", "Sustentabilidade"].map(c =>
              <SelectItem key={c} value={c}>{c}</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Select value={filterPhase} onValueChange={setFilterPhase}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Fase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Fases</SelectItem>
            <SelectItem value="municipal">Municipal</SelectItem>
            <SelectItem value="estadual">Estadual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onClick={handleCardClick} canEdit={isAdmin} onEdit={(project) => { setEditProject(project); setShowForm(true); }} onDelete={(project) => setDeleteProject(project)} />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editProject}
            onSave={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["projects"] }); }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{deleteProject?.title}"? Esta ação não pode ser desfeita e todos os dados do projeto serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}