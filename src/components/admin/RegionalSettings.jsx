import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, Building2, Globe, Phone, MapPin, Palette, Flag, Image as ImageIcon, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

function Section({ icon: Icon, title, children }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function UploadField({ label, value, onUpload, onClear, inputId, accept = "image/*" }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3 mt-1">
        {value && <img src={value} alt={label} className="w-14 h-14 rounded-lg object-cover border" />}
        <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById(inputId).click()}>
          <Upload className="w-4 h-4 mr-2" /> {value ? "Alterar" : "Enviar"}
        </Button>
        <input id={inputId} type="file" accept={accept} className="hidden" onChange={onUpload} />
        {value && (
          <button onClick={onClear} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function RegionalSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  const { data: sertics = [], isLoading } = useQuery({
    queryKey: ["sertics"],
    queryFn: () => base44.entities.SERTIC.list(),
  });

  const mySertic = sertics.find(s => s.id === user?.sertic_id);

  useEffect(() => {
    if (mySertic) setForm({ ...mySertic });
  }, [mySertic?.id]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set(field, file_url);
    toast({ title: "Arquivo enviado!" });
  };

  const handleSave = async () => {
    if (!form?.id) return;
    setSaving(true);
    await base44.entities.SERTIC.update(form.id, form);
    toast({ title: "Configurações salvas com sucesso!" });
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ["sertics"] });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  if (!mySertic && !isLoading) return (
    <div className="p-12 text-center text-muted-foreground">
      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p className="font-medium">Conta não vinculada a nenhum SERTIC.</p>
      <p className="text-sm mt-1">Peça ao administrador estadual para fazer o vínculo na página de Usuários.</p>
    </div>
  );

  if (!form) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header preview */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border">
        {form.logo_url
          ? <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
          : <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">{form.acronym}</div>
        }
        <div>
          <h2 className="font-heading font-bold text-xl">{form.fair_name || form.name}</h2>
          <Badge className="mt-1">{form.acronym}</Badge>
          {form.fair_slogan && <p className="text-sm text-muted-foreground mt-1 italic">"{form.fair_slogan}"</p>}
        </div>
      </div>

      <Section icon={Flag} title="Identidade da Feira Regional">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome oficial do SERTIC *</Label>
            <Input value={form.name || ""} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Sigla *</Label>
            <Input value={form.acronym || ""} onChange={e => set("acronym", e.target.value)} />
          </div>
          <div>
            <Label>Nome da Feira Regional</Label>
            <Input value={form.fair_name || ""} onChange={e => set("fair_name", e.target.value)} placeholder="Ex: SERTIC Vale do Jamari" />
          </div>
          <div>
            <Label>Tema da Edição</Label>
            <Input value={form.fair_theme || ""} onChange={e => set("fair_theme", e.target.value)} placeholder="Tema da edição atual" />
          </div>
          <div className="md:col-span-2">
            <Label>Slogan</Label>
            <Input value={form.fair_slogan || ""} onChange={e => set("fair_slogan", e.target.value)} placeholder="Slogan da feira" />
          </div>
          <div className="md:col-span-2">
            <Label>Descrição institucional</Label>
            <Textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={3} placeholder="Descrição do SERTIC" />
          </div>
          <div className="md:col-span-2">
            <Label>Texto de apresentação da Feira</Label>
            <Textarea value={form.presentation_text || ""} onChange={e => set("presentation_text", e.target.value)} rows={3} placeholder="Texto exibido na página inicial da feira" />
          </div>
        </div>
      </Section>

      <Section icon={ImageIcon} title="Identidade Visual">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UploadField
            label="Logomarca"
            value={form.logo_url}
            onUpload={e => handleUpload(e, "logo_url")}
            onClear={() => set("logo_url", "")}
            inputId="upload-logo"
          />
          <UploadField
            label="Banner principal"
            value={form.banner_url}
            onUpload={e => handleUpload(e, "banner_url")}
            onClear={() => set("banner_url", "")}
            inputId="upload-banner"
          />
          <div>
            <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Cor primária da identidade</Label>
            <div className="flex items-center gap-3 mt-1">
              <input type="color" value={form.primary_color || "#16a34a"} onChange={e => set("primary_color", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border" />
              <Input value={form.primary_color || ""} onChange={e => set("primary_color", e.target.value)} placeholder="#16a34a" className="w-32" />
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Building2} title="Organização">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Coordenador(a)</Label>
            <Input value={form.coordinator || ""} onChange={e => set("coordinator", e.target.value)} />
          </div>
          <div>
            <Label>NTE</Label>
            <Input value={form.nte || ""} onChange={e => set("nte", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Municípios atendidos (separados por vírgula)</Label>
            <Input
              value={(form.municipalities || []).join(", ")}
              onChange={e => set("municipalities", e.target.value.split(",").map(m => m.trim()).filter(Boolean))}
              placeholder="Cidade A, Cidade B, Cidade C"
            />
          </div>
        </div>
      </Section>

      <Section icon={MapPin} title="Localização e Contato">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Município sede</Label>
            <Input value={form.city || ""} onChange={e => set("city", e.target.value)} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={form.address || ""} onChange={e => set("address", e.target.value)} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} placeholder="(69) 99999-9999" />
          </div>
        </div>
      </Section>

      <Section icon={Globe} title="Redes Sociais e Site">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Site oficial</Label>
            <Input value={form.site_url || ""} onChange={e => set("site_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={form.instagram || ""} onChange={e => set("instagram", e.target.value)} placeholder="@usuario" />
          </div>
          <div>
            <Label>Facebook</Label>
            <Input value={form.facebook || ""} onChange={e => set("facebook", e.target.value)} placeholder="facebook.com/pagina" />
          </div>
          <div>
            <Label>YouTube</Label>
            <Input value={form.youtube || ""} onChange={e => set("youtube", e.target.value)} placeholder="youtube.com/@canal" />
          </div>
        </div>
      </Section>

      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}