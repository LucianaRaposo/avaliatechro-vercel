import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, GripVertical, Settings as SettingsIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";

// Import React for useEffect used in CriteriaDialog
const { useEffect } = React;

export default function Settings() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editCriteria, setEditCriteria] = useState(null);

  const { data: criteria = [], isLoading } = useQuery({
    queryKey: ["criteria"],
    queryFn: () => base44.entities.EvaluationCriteria.list(),
  });

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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie os critérios de avaliação da feira</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading text-lg">Critérios de Avaliação</CardTitle>
            <CardDescription>Defina os critérios, pesos e notas máximas para as avaliações</CardDescription>
          </div>
          <Button onClick={() => { setEditCriteria(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Critério
          </Button>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <SettingsIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum critério configurado.</p>
              <p className="text-xs mt-1">Adicione critérios para que os avaliadores possam avaliar os projetos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-foreground">{c.name}</h4>
                      <Badge variant="outline" className="text-xs">Peso: {c.weight}</Badge>
                      <Badge variant="outline" className="text-xs">Máx: {c.max_score || 10}</Badge>
                      {c.category !== "Todas" && (
                        <Badge className="text-xs bg-accent/10 text-accent">{c.category}</Badge>
                      )}
                      {c.phase !== "todas" && (
                        <Badge className="text-xs bg-primary/10 text-primary capitalize">{c.phase}</Badge>
                      )}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                  </div>
                  <Switch checked={c.is_active !== false} onCheckedChange={() => handleToggle(c.id, c.is_active !== false)} />
                  <Button variant="ghost" size="icon" onClick={() => { setEditCriteria(c); setShowForm(true); }} className="shrink-0">
                    <SettingsIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CriteriaDialog
        open={showForm}
        onOpenChange={setShowForm}
        criteria={editCriteria}
        onSave={() => {
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: ["criteria"] });
        }}
      />
    </div>
  );
}

function CriteriaDialog({ open, onOpenChange, criteria, onSave }) {
  const [form, setForm] = useState({
    name: "", description: "", weight: 1, max_score: 10,
    category: "Todas", phase: "todas", is_active: true, order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (criteria) {
      setForm(criteria);
    } else {
      setForm({ name: "", description: "", weight: 1, max_score: 10, category: "Todas", phase: "todas", is_active: true, order: 0 });
    }
  }, [criteria, open]);

  const handleSubmit = async () => {
    setSaving(true);
    if (criteria?.id) {
      await base44.entities.EvaluationCriteria.update(criteria.id, form);
    } else {
      await base44.entities.EvaluationCriteria.create(form);
    }
    toast({ title: "Critério salvo!", description: "Critério de avaliação atualizado com sucesso." });
    setSaving(false);
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{criteria ? "Editar" : "Novo"} Critério</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome do Critério *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Relevância científica" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o critério..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Peso</Label>
              <Input type="number" min={0.1} step={0.1} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <Label>Nota Máxima</Label>
              <Input type="number" min={1} value={form.max_score} onChange={e => setForm(f => ({ ...f, max_score: parseInt(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {["Iniciação Científica", "Pesquisa", "Inovação Tecnológica", "Ciências Humanas", "Ciências Exatas", "Ciências Biológicas", "Robótica", "Sustentabilidade"].map(c =>
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fase</Label>
              <Select value={form.phase} onValueChange={v => setForm(f => ({ ...f, phase: v }))}>
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
          <div>
            <Label>Ordem de Exibição</Label>
            <Input type="number" min={0} value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name}>
            <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}