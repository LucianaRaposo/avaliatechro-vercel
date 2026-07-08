import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  School, MapPin, Users, BookOpen, Beaker, User, Mail,
  FileText, Image, Video, ArrowLeft, Star, ClipboardCheck, AlertTriangle
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import QRCodeGenerator from "@/components/qr/QRCodeGenerator";
import EvaluationForm from "@/components/evaluation/EvaluationForm";
import { motion } from "framer-motion";

const statusLabels = {
  inscrito: "Inscrito", aprovado: "Aprovado", em_avaliacao: "Em Avaliação",
  avaliado: "Avaliado", premiado: "Premiado",
};

export default function ProjectDetail() {
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();
  const code = params.code;
  const urlParams = new URLSearchParams(window.location.search);
  const isEvaluator = user?.role === "avaliador";
  const cameFromQR = urlParams.get("from_qr") === "true";
  const defaultTab = urlParams.get("tab") || (isEvaluator ? "evaluate" : "info");
  const [activeTab, setActiveTab] = useState(defaultTab);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["project", code],
    queryFn: () => base44.entities.Project.filter({ code }),
    enabled: !!code,
  });

  const project = projects[0];

  const { data: evaluations = [] } = useQuery({
    queryKey: ["project-evaluations", project?.id],
    queryFn: () => base44.entities.Evaluation.filter({ project_id: project?.id }),
    enabled: !!project?.id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="font-heading text-xl font-bold mb-2">Projeto não encontrado</h2>
        <p className="text-muted-foreground mb-4">O código "{code}" não corresponde a nenhum projeto.</p>
        <Button onClick={() => navigate("/projects")}>Voltar</Button>
      </div>
    );
  }

  const qrUrl = `${window.location.origin}/project/${project.code}?tab=evaluate&from_qr=true`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 lg:p-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      {isEvaluator && cameFromQR && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 flex items-center gap-3">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium text-sm text-primary">Avaliação via QR Code</p>
            <p className="text-xs text-muted-foreground">Você está acessando este projeto para avaliação. Preencha o formulário na aba "Avaliar".</p>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-xs">{project.code}</Badge>
                  <Badge className="bg-primary/10 text-primary">{statusLabels[project.status]}</Badge>
                  <Badge variant="outline">{project.phase?.charAt(0).toUpperCase() + project.phase?.slice(1)}</Badge>
                </div>
                <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground mb-4">{project.title}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Beaker className="w-4 h-4 shrink-0" />
                    <span>{project.category}</span>
                  </div>
                  {project.knowledge_area && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>{project.knowledge_area}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <School className="w-4 h-4 shrink-0" />
                    <span>{project.school}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{project.municipality}{project.nte ? ` - ${project.nte}` : ""}</span>
                  </div>
                </div>
                {project.final_score > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    <span className="font-heading text-2xl font-bold text-primary">{project.final_score?.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">({project.evaluation_count || 0} avaliação(ões))</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <QRCodeGenerator value={qrUrl} size={140} />
                </div>
                <p className="text-xs text-muted-foreground">QR Code do Projeto</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isEvaluator ? "grid-cols-4" : "grid-cols-3"}`}>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="media">Mídia</TabsTrigger>
          {isEvaluator && (
            <TabsTrigger value="evaluate" className="bg-primary/10 text-primary">
              ★ Avaliar
            </TabsTrigger>
          )}
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <User className="w-5 h-5" /> Professor Orientador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{project.advisor_name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{project.advisor_email || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Users className="w-5 h-5" /> Alunos Participantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.students?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.students.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{s.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.grade}{s.age ? ` • ${s.age} anos` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum aluno registrado.</p>
              )}
            </CardContent>
          </Card>

          {project.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Resumo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{project.summary}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-4 mt-4">
          {project.photos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Image className="w-5 h-5" /> Fotos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {project.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={url} alt={`Foto ${i+1}`} className="w-full h-40 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {project.video_url && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Video className="w-5 h-5" /> Vídeo de Apresentação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <iframe
                    src={project.video_url.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allowFullScreen
                    title="Vídeo do projeto"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {project.documents?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.documents.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors text-sm font-medium text-primary">
                      <FileText className="w-4 h-4" />
                      Documento {i + 1}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!project.photos?.length && !project.video_url && !project.documents?.length && (
            <div className="text-center py-12 text-muted-foreground">Nenhuma mídia disponível.</div>
          )}
        </TabsContent>

        <TabsContent value="evaluate" className="mt-4">
          {isEvaluator ? (
            <EvaluationForm project={project} onComplete={() => setActiveTab("history")} />
          ) : (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-3" />
                <h3 className="font-heading font-bold text-lg mb-1">Acesso restrito</h3>
                <p className="text-muted-foreground text-sm">Somente usuários com perfil de avaliador podem atribuir notas.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" /> Avaliações Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhuma avaliação registrada.</p>
              ) : (
                <div className="space-y-4">
                  {evaluations.map(ev => (
                    <div key={ev.id} className="p-4 rounded-xl bg-muted/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{ev.evaluator_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleString("pt-BR") : "—"}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary font-bold">{ev.weighted_average?.toFixed(2)}</Badge>
                      </div>
                      {ev.scores?.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{s.criteria_name} (peso {s.weight})</span>
                          <span className="font-medium">{s.score}/{s.max_score}</span>
                        </div>
                      ))}
                      {ev.technical_opinion && (
                        <div className="border-t border-border pt-2 mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Parecer Técnico</p>
                          <p className="text-sm">{ev.technical_opinion}</p>
                        </div>
                      )}
                      {ev.comments && (
                        <div className="border-t border-border pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Comentários</p>
                          <p className="text-sm">{ev.comments}</p>
                        </div>
                      )}
                      {ev.suggestions && (
                        <div className="border-t border-border pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Sugestões</p>
                          <p className="text-sm">{ev.suggestions}</p>
                        </div>
                      )}
                      {ev.observations && (
                        <p className="text-sm text-muted-foreground italic border-t border-border pt-2">"{ev.observations}"</p>
                      )}
                      {ev.evidence_photos?.length > 0 && (
                        <div className="border-t border-border pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Evidências ({ev.evidence_photos.length})</p>
                          <div className="flex gap-2 flex-wrap">
                            {ev.evidence_photos.map((photo, pi) => (
                              <div key={pi} className="text-center">
                                <img src={photo.url} alt={photo.caption || `Evidência ${pi+1}`} className="w-16 h-16 object-cover rounded-lg" />
                                {photo.caption && <p className="text-xs text-muted-foreground mt-1 w-16 truncate">{photo.caption}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}