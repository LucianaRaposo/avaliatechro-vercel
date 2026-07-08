import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload, Save, X, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";

const CATEGORIAS_PADRAO = ["Ciências da Natureza", "Ciências Humanas", "Matemática", "Linguagens", "Robótica", "Inteligência Artificial", "Sustentabilidade", "Inovação Tecnológica", "Pesquisa", "Iniciação Científica"];
const areas = ["Linguagens", "Matemática", "Ciências da Natureza", "Ciências Humanas", "Ensino Religioso", "Tecnologia", "Multidisciplinar"];
const phases = ["municipal", "estadual"];

export default function ProjectForm({ project, onSave, onCancel }) {
  const { user } = useAuth();

  const isNTE = user?.role === "nte_coordenador" || user?.role === "admin" || user?.role === "admin_estadual";
  const isNTEOnly = user?.role === "nte_coordenador";

  const { data: configList = [] } = useQuery({
    queryKey: ["categoryConfig", user?.sertic_id, user?.role],
    queryFn: () => base44.entities.CategoryConfig.list(),
  });

  const activeConfig = isNTEOnly && user?.sertic_id
    ? configList.find(c => c.sertic_id === user.sertic_id) || configList.find(c => !c.sertic_id)
    : configList.find(c => !c.sertic_id);
  const categories = activeConfig?.categories?.length ? activeConfig.categories : CATEGORIAS_PADRAO;
  const isEditing = !!project?.id;
  const canEdit = !isEditing || isNTE;

  const [form, setForm] = useState(project || {
    title: "", category: "", knowledge_area: "", school: "", municipality: "",
    nte: "", advisor_name: "", advisor_email: "", students: [{ name: "", grade: "", age: "" }],
    summary: "", video_url: "", status: "inscrito", phase: "municipal"
  });
  const [saving, setSaving] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addStudent = () => {
    setForm(prev => ({ ...prev, students: [...(prev.students || []), { name: "", grade: "", age: "" }] }));
  };

  const removeStudent = (index) => {
    setForm(prev => ({ ...prev, students: prev.students.filter((_, i) => i !== index) }));
  };

  const updateStudent = (index, field, value) => {
    setForm(prev => {
      const students = [...prev.students];
      students[index] = { ...students[index], [field]: value };
      return { ...prev, students };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing && !isNTE) {
      toast({ title: "Ação não permitida", description: "Somente o coordenador NTE pode alterar dados de inscrição.", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Upload photos
    let photos = form.photos || [];
    for (const file of photoFiles) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      photos.push(file_url);
    }

    // Upload docs
    let documents = form.documents || [];
    for (const file of docFiles) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      documents.push(file_url);
    }

    const code = form.code || `PROJ-${Date.now().toString(36).toUpperCase()}`;
    const data = { ...form, photos, documents, code };

    if (project?.id) {
      await base44.entities.Project.update(project.id, data);
    } else {
      await base44.entities.Project.create(data);
    }

    toast({ title: "Projeto salvo com sucesso!" });
    setSaving(false);
    onSave?.();
  };

  if (isEditing && !isNTE) {
    return (
      <Card className="border-chart-3/30 bg-chart-3/5">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-chart-3 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-1">Edição restrita</h3>
          <p className="text-muted-foreground text-sm mb-4">Somente o coordenador NTE pode alterar os dados de inscrição do professor.</p>
          <Button variant="outline" onClick={onCancel}>Voltar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título do Projeto *</Label>
            <Input value={form.title} onChange={e => updateField("title", e.target.value)} required placeholder="Digite o título" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Categoria *</Label>
              <Select value={form.category} onValueChange={v => updateField("category", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Área do Conhecimento</Label>
              <Select value={form.knowledge_area} onValueChange={v => updateField("knowledge_area", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Escola *</Label>
              <Input value={form.school} onChange={e => updateField("school", e.target.value)} required placeholder="Nome da escola" />
            </div>
            <div>
              <Label>Município *</Label>
              <Input value={form.municipality} onChange={e => updateField("municipality", e.target.value)} required placeholder="Município" />
            </div>
            <div>
              <Label>NTE</Label>
              <Input value={form.nte} onChange={e => updateField("nte", e.target.value)} placeholder="Núcleo Territorial" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fase</Label>
              <Select value={form.phase} onValueChange={v => updateField("phase", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{phases.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => updateField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inscrito">Inscrito</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_avaliacao">Em Avaliação</SelectItem>
                  <SelectItem value="avaliado">Avaliado</SelectItem>
                  <SelectItem value="premiado">Premiado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Professor Orientador</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome</Label>
            <Input value={form.advisor_name} onChange={e => updateField("advisor_name", e.target.value)} placeholder="Nome completo" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.advisor_email} onChange={e => updateField("advisor_email", e.target.value)} placeholder="email@escola.edu.br" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">Alunos Participantes</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addStudent}>
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.students?.map((s, i) => (
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>Nome</Label>
                <Input value={s.name} onChange={e => updateStudent(i, "name", e.target.value)} placeholder="Nome do aluno" />
              </div>
              <div className="w-24">
                <Label>Série</Label>
                <Input value={s.grade} onChange={e => updateStudent(i, "grade", e.target.value)} placeholder="9º Ano" />
              </div>
              <div className="w-20">
                <Label>Idade</Label>
                <Input type="number" value={s.age} onChange={e => updateStudent(i, "age", e.target.value)} placeholder="14" />
              </div>
              {form.students.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeStudent(i)} className="text-destructive mb-0.5">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Detalhes do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Resumo</Label>
            <Textarea value={form.summary} onChange={e => updateField("summary", e.target.value)} placeholder="Descreva o projeto..." rows={5} />
          </div>
          <div>
            <Label>URL do Vídeo de Apresentação</Label>
            <Input value={form.video_url} onChange={e => updateField("video_url", e.target.value)} placeholder="https://youtube.com/..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fotos do Projeto</Label>
              <Input type="file" accept="image/*" multiple onChange={e => setPhotoFiles(Array.from(e.target.files))} />
            </div>
            <div>
              <Label>Documentos Anexos</Label>
              <Input type="file" multiple onChange={e => setDocFiles(Array.from(e.target.files))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" /> Cancelar
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar Projeto"}
        </Button>
      </div>
    </form>
  );
}