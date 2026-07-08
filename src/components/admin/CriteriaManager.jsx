import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const CATEGORIAS = ["Todas", "Ciências da Natureza", "Ciências Humanas", "Matemática", "Linguagens", "Robótica", "Inteligência Artificial", "Sustentabilidade", "Inovação Tecnológica", "Pesquisa", "Iniciação Científica"];

export default function CriteriaManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editCriteria, setEditCriteria] = useState(null);
  const { user } = useAuth();
  const isNTE = user?.role === "nte_coordenador";

  const { data: allCriteria = [], isLoading } = useQuery({
    queryKey: ["criteria", user?.sertic_id, user?.role],
    queryFn: () => base44.entities.EvaluationCriteria.list(),
  });

  // NTE sees only their SERTIC criteria + global (no sertic_id) criteria
  const criteria = isNTE && user?.sertic_id
    ? allCriteria.filter(c => !c.sertic_id || c.sertic_id === user.sertic_id)
    : allCriteria;

  const sorted = [...criteria].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleDelete = async (id) => {
    await base44.entities.EvaluationCriteria.delete(id);
    queryClient.invalidateQueries({ queryKey: ["criteria"] });
    toast({ title: "Critério removido!" });
  };

  const handleToggle = async (id, isActive) => {
    await base44.entities.EvaluationCriteria.update(id, { is_active: !isActive });
    queryClient.invalidateQueries({ queryKey: ["criteria"] });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Critérios de Avaliação</h3>
          <p className="text-sm text-muted-foreground">Defina critérios, pesos e notas máximas por categoria</p>
        </div>
        <Button onClick={() => { setEditCriteria(null); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" />Novo Critério</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {sorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <SettingsIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum critério configurado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-sm">{c.name}</h4>
                      <Badge variant="outline" className="text-xs">Peso: {c.weight}</Badge>
                      <Badge variant="outline" className="text-xs">Máx: {c.max_score || 10}</Badge>
                      {c.category !== "Todas" && <Badge className="text-xs bg-accent/10 text-accent">{c.category}</Badge>}
                      {c.phase !== "todas" && <Badge className="text-xs bg-primary/10 text-primary capitalize">{c.phase}</Badge>}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                  </div>
                  <Switch checked={c.is_active !== false} onCheckedChange={() => handleToggle(c.id, c.is_active !== false)} />
                  <Button variant="ghost" size="icon" onClick={() => { setEditCriteria(c); setShowForm(true); }} className="shrink-0"><SettingsIcon className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive shrink-0"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CriteriaDialog open={showForm} onOpenChange={setShowForm} criteria={editCriteria} serticId={isNTE ? user?.sertic_id : null} onSave={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["criteria", user?.sertic_id, user?.role] }); }} />
    </div>
  );
}

function CriteriaDialog({ open, onOpenChange, criteria, serticId, onSave }) {
  const [form, setForm] = useState({ name: "", description: "", weight: 1, max_score: 10, category: "Todas", phase: "todas", is_active: true, order: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (criteria) setForm(criteria);
    else setForm({ name: "", description: "", weight: 1, max_score: 10, category: "Todas", phase: "todas", is_active: true, order: 0 });
  }, [criteria, open]);

  const handleSubmit = async () => {
    setSaving(true);
    if (criteria?.id) {
      await base44.entities.EvaluationCriteria.update(criteria.id, form);
    } else {
      await base44.entities.EvaluationCriteria.create({
        ...form,
        ...(serticId ? { sertic_id: serticId } : {}),
      });
    }
    toast({ title: "Critério salvo!" });
    setSaving(false);
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-heading">{criteria ? "Editar" : "Novo"} Critério</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex: Originalidade" /></div>
          <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Peso</Label><Input type="number" min={0.1} step={0.1} value={form.weight} onChange={e => setForm(f => ({...f, weight: parseFloat(e.target.value)}))} /></div>
            <div><Label>Nota Máxima</Label><Input type="number" min={1} value={form.max_score} onChange={e => setForm(f => ({...f, max_score: parseInt(e.target.value)}))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fase</Label>
              <Select value={form.phase} onValueChange={v => setForm(f => ({...f, phase: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="estadual">Estadual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Ordem</Label><Input type="number" min={0} value={form.order} onChange={e => setForm(f => ({...f, order: parseInt(e.target.value)}))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name}><Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}