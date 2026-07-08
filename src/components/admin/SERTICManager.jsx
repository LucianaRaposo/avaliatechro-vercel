import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, Upload, Image as ImageIcon, X, Pencil } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function SERTICManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: sertics = [], isLoading } = useQuery({
    queryKey: ["sertics"],
    queryFn: () => base44.entities.SERTIC.list(),
  });

  const resetForm = () => setForm({ name: "", acronym: "", coordinator: "", municipalities: [], email: "", logo_url: "", nte: "", description: "", is_active: true });

  const handleSave = async () => {
    if (!form.name || !form.acronym) return;
    setSaving(true);
    if (form.id) {
      await base44.entities.SERTIC.update(form.id, form);
      toast({ title: "SERTIC atualizado!" });
    } else {
      await base44.entities.SERTIC.create(form);
      toast({ title: "SERTIC criado!" });
    }
    setSaving(false);
    setShowForm(false);
    setForm(null);
    queryClient.invalidateQueries({ queryKey: ["sertics"] });
  };

  const handleToggle = async (id, active) => {
    await base44.entities.SERTIC.update(id, { is_active: !active });
    queryClient.invalidateQueries({ queryKey: ["sertics"] });
  };

  const handleDelete = async (id) => {
    await base44.entities.SERTIC.delete(id);
    queryClient.invalidateQueries({ queryKey: ["sertics"] });
    toast({ title: "SERTIC removido" });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, logo_url: file_url }));
    toast({ title: "Logo enviada!" });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">SERTICs</h3>
          <p className="text-sm text-muted-foreground">Gerencie os SERTICs e seus municípios</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" />Novo SERTIC</Button>
      </div>

      {showForm && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Nome completo do SERTIC" /></div>
              <div><Label>Sigla *</Label><Input value={form.acronym} onChange={e => setForm(f => ({...f, acronym: e.target.value}))} placeholder="Sigla" /></div>
              <div><Label>Coordenador</Label><Input value={form.coordinator} onChange={e => setForm(f => ({...f, coordinator: e.target.value}))} /></div>
              <div><Label>NTE</Label><Input value={form.nte} onChange={e => setForm(f => ({...f, nte: e.target.value}))} placeholder="Ex: NTE-01" /></div>
              <div><Label>E-mail</Label><Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} type="email" /></div>
              <div><Label>Municípios (separados por vírgula)</Label><Input value={(form.municipalities || []).join(", ")} onChange={e => setForm(f => ({...f, municipalities: e.target.value.split(",").map(m => m.trim()).filter(Boolean)}))} placeholder="Porto Velho, Ariquemes, Ji-Paraná" /></div>
              <div className="md:col-span-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Descrição institucional" /></div>
              <div className="md:col-span-2">
                <Label>Logomarca</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Button variant="outline" type="button" onClick={() => document.getElementById("sertic-logo").click()}>
                    <Upload className="w-4 h-4 mr-2" /> Enviar Logo
                  </Button>
                  <input id="sertic-logo" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  {form.logo_url && (
                    <div className="relative inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Logo enviada</span>
                      <button onClick={() => setForm(f => ({...f, logo_url: ""}))} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(null); }}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sertics.map(s => (
          <Card key={s.id} className={!s.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {s.logo_url ? <img src={s.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><span className="font-bold text-primary text-xs">{s.acronym}</span></div>}
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <CardDescription className="text-xs">{s.acronym}{s.coordinator ? ` • ${s.coordinator}` : ""}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={s.is_active !== false} onCheckedChange={() => handleToggle(s.id, s.is_active !== false)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => { setForm(s); setShowForm(true); }}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {(s.municipalities || []).slice(0, 5).map(m => <Badge key={m} variant="outline" className="text-xs">{m}</Badge>)}
                {(s.municipalities || []).length > 5 && <Badge variant="outline" className="text-xs">+{s.municipalities.length - 5}</Badge>}
                {(!s.municipalities || s.municipalities.length === 0) && <span className="text-xs text-muted-foreground">Nenhum município</span>}
              </div>
            </CardContent>
          </Card>
        ))}
        {sertics.length === 0 && <p className="text-center text-muted-foreground col-span-full py-8">Nenhum SERTIC cadastrado</p>}
      </div>
    </div>
  );
}