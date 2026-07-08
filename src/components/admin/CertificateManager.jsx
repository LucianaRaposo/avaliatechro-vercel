import React, { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Save, FileText, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const TIPOS = [
  { value: "participacao", label: "Participação" },
  { value: "orientacao", label: "Orientação" },
  { value: "avaliacao", label: "Avaliação" },
  { value: "premiacao", label: "Premiação" },
];

export default function CertificateManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTpl, setEditTpl] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["certificateTemplates"],
    queryFn: () => base44.entities.CertificateTemplate.list(),
  });

  const handleDelete = async (id) => {
    await base44.entities.CertificateTemplate.delete(id);
    queryClient.invalidateQueries({ queryKey: ["certificateTemplates"] });
    toast({ title: "Modelo removido!" });
  };

  const handleToggle = async (id, active) => {
    await base44.entities.CertificateTemplate.update(id, { is_active: !active });
    queryClient.invalidateQueries({ queryKey: ["certificateTemplates"] });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Modelos de Certificados</h3>
          <p className="text-sm text-muted-foreground">Personalize os certificados com dados automáticos e QR Code</p>
        </div>
        <Button onClick={() => { setEditTpl(null); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" />Novo Modelo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => (
          <Card key={t.id} className={!t.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><FileText className="w-5 h-5 text-accent" /></div>
                  <div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <CardDescription className="text-xs">{t.title}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={t.is_active !== false} onCheckedChange={() => handleToggle(t.id, t.is_active !== false)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditTpl(t); setShowForm(true); }}><Save className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">{TIPOS.find(tp => tp.value === t.type)?.label || t.type}</Badge>
                {t.include_sertic && <Badge variant="outline" className="text-xs">SERTIC</Badge>}
                {t.include_regional && <Badge variant="outline" className="text-xs">Regional</Badge>}
                {t.include_qrcode && <Badge variant="outline" className="text-xs">QR Code</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && <p className="text-center text-muted-foreground col-span-full py-8">Nenhum modelo de certificado</p>}
      </div>

      <CertificateDialog open={showForm} onOpenChange={setShowForm} template={editTpl} onSave={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["certificateTemplates"] }); }} />
    </div>
  );
}

function CertificateDialog({ open, onOpenChange, template, onSave }) {
  const [form, setForm] = useState({ name: "", type: "participacao", title: "", subtitle: "", include_sertic: true, include_regional: true, include_qrcode: true, background_url: "", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) setForm(template);
    else setForm({ name: "", type: "participacao", title: "", subtitle: "", include_sertic: true, include_regional: true, include_qrcode: true, background_url: "", is_active: true });
  }, [template, open]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, background_url: file_url }));
    toast({ title: "Fundo enviado!" });
  };

  const handleSubmit = async () => {
    setSaving(true);
    if (template?.id) {
      await base44.entities.CertificateTemplate.update(template.id, form);
    } else {
      await base44.entities.CertificateTemplate.create(form);
    }
    toast({ title: "Modelo salvo!" });
    setSaving(false);
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">{template ? "Editar" : "Novo"} Modelo</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome do Modelo *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex: Certificado de Participação" /></div>
          <div>
            <Label>Tipo *</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Título no Certificado *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Ex: Certificamos que..." /></div>
          <div><Label>Subtítulo / Texto</Label><Textarea value={form.subtitle} onChange={e => setForm(f => ({...f, subtitle: e.target.value}))} rows={3} /></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><Label>Incluir nome do SERTIC</Label><Switch checked={form.include_sertic} onCheckedChange={v => setForm(f => ({...f, include_sertic: v}))} /></div>
            <div className="flex items-center justify-between"><Label>Incluir nome da Regional</Label><Switch checked={form.include_regional} onCheckedChange={v => setForm(f => ({...f, include_regional: v}))} /></div>
            <div className="flex items-center justify-between"><Label>Incluir QR Code de validação</Label><Switch checked={form.include_qrcode} onCheckedChange={v => setForm(f => ({...f, include_qrcode: v}))} /></div>
          </div>
          <div>
            <Label>Imagem de Fundo</Label>
            <div className="flex items-center gap-3 mt-1">
              <Button variant="outline" type="button" onClick={() => document.getElementById("cert-bg").click()}><Upload className="w-4 h-4 mr-2" />Enviar Fundo</Button>
              <input id="cert-bg" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              {form.background_url && (
                <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">Fundo enviado</span>
                  <button onClick={() => setForm(f => ({...f, background_url: ""}))}><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name || !form.title}><Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}