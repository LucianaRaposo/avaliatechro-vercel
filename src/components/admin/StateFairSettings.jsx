import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Trash2, Upload, Image as ImageIcon, X, Award } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function StateFairSettings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["stateFairConfig"],
    queryFn: () => base44.entities.StateFairConfig.list(),
  });

  const config = configs[0] || { official_name: "FEICRO", slogan: "", logo_url: "", edition_year: new Date().getFullYear().toString(), is_active: true };
  const [form, setForm] = useState(config);

  React.useEffect(() => { if (configs.length > 0) setForm(configs[0]); }, [configs]);

  const handleSave = async () => {
    if (!form.official_name || !form.edition_year) return;
    setSaving(true);
    if (form.id) {
      await base44.entities.StateFairConfig.update(form.id, form);
    } else {
      await base44.entities.StateFairConfig.create(form);
    }
    toast({ title: "Configurações da feira salvas!" });
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ["stateFairConfig"] });
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
      <div>
        <h3 className="font-heading text-lg font-semibold">Feira Estadual</h3>
        <p className="text-sm text-muted-foreground">Configure a identidade da feira estadual</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4 p-4 bg-muted/40 rounded-xl">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary flex items-center justify-center"><Award className="w-10 h-10 text-primary-foreground" /></div>
            )}
            <div>
              <h2 className="font-heading font-bold text-xl">{form.official_name || "Feira Estadual"}</h2>
              {form.edition_year && <Badge className="mt-1">Edição {form.edition_year}</Badge>}
              {form.slogan && <p className="text-sm text-muted-foreground mt-1">{form.slogan}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome Oficial da Feira *</Label>
              <Input value={form.official_name} onChange={e => setForm(f => ({...f, official_name: e.target.value}))} placeholder="Ex: FEICRO 2027" />
            </div>
            <div>
              <Label>Edição (Ano) *</Label>
              <Input value={form.edition_year} onChange={e => setForm(f => ({...f, edition_year: e.target.value}))} placeholder="Ex: 2027" />
            </div>
            <div className="md:col-span-2">
              <Label>Slogan</Label>
              <Input value={form.slogan} onChange={e => setForm(f => ({...f, slogan: e.target.value}))} placeholder="Ex: Ciência que transforma vidas" />
            </div>
            <div className="md:col-span-2">
              <Label>Logotipo</Label>
              <div className="flex items-center gap-3 mt-1">
                <Button variant="outline" type="button" onClick={() => document.getElementById("fair-logo").click()}>
                  <Upload className="w-4 h-4 mr-2" /> Enviar Logotipo
                </Button>
                <input id="fair-logo" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                {form.logo_url && (
                  <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-1">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Logo enviada</span>
                    <button onClick={() => setForm(f => ({...f, logo_url: ""}))} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} size="lg"><Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}