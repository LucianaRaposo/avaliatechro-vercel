import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Save, AlertTriangle, CheckCircle2, MapPin, Clock, Camera, Upload, X, Loader2, WifiOff, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { useOfflineEvaluations } from "@/lib/useOfflineEvaluations";

export default function EvaluationForm({ project, onComplete }) {
  const { user } = useAuth();
  const isAvaliador = user?.role === "avaliador";
  const fileInputRef = useRef(null);
  const { isOnline, saveOffline } = useOfflineEvaluations();

  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [observations, setObservations] = useState("");
  const [technicalOpinion, setTechnicalOpinion] = useState("");
  const [comments, setComments] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
  const [existingEvaluation, setExistingEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    loadData();
    getLocation();
  }, [project?.id]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation(null)
      );
    }
  };

  const loadData = async () => {
    setLoading(true);
    const allCriteria = await base44.entities.EvaluationCriteria.list();
    const filtered = allCriteria.filter(c =>
      c.is_active !== false &&
      (c.category === "Todas" || c.category === project?.category) &&
      (c.phase === "todas" || c.phase === project?.phase)
    ).sort((a, b) => (a.order || 0) - (b.order || 0));
    setCriteria(filtered);

    const existing = await base44.entities.Evaluation.filter({
      project_id: project?.id,
      evaluator_id: user?.id
    });

    if (existing.length > 0) {
      const ev = existing[0];
      setAlreadyEvaluated(true);
      setExistingEvaluation(ev);
      setObservations(ev.observations || "");
      setTechnicalOpinion(ev.technical_opinion || "");
      setComments(ev.comments || "");
      setSuggestions(ev.suggestions || "");
      setEvidencePhotos(ev.evidence_photos || []);
      const existingScores = {};
      filtered.forEach(c => {
        const prev = ev.scores?.find(s => s.criteria_id === c.id);
        existingScores[c.id] = prev ? prev.score : 5;
      });
      setScores(existingScores);
    } else {
      const initial = {};
      filtered.forEach(c => { initial[c.id] = 5; });
      setScores(initial);
    }
    setLoading(false);
  };

  const calculateWeightedAverage = () => {
    let totalWeight = 0;
    let weightedSum = 0;
    criteria.forEach(c => {
      const score = scores[c.id] || 0;
      const normalizedScore = (score / (c.max_score || 10)) * 10;
      weightedSum += normalizedScore * (c.weight || 1);
      totalWeight += (c.weight || 1);
    });
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingPhoto(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEvidencePhotos(prev => [...prev, { url: file_url, caption: "" }]);
    }
    setUploadingPhoto(false);
    toast({ title: "Foto(s) adicionada(s)!" });
  };

  const updateCaption = (idx, caption) => {
    setEvidencePhotos(prev => prev.map((p, i) => i === idx ? { ...p, caption } : p));
  };

  const removePhoto = (idx) => {
    setEvidencePhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setSaving(true);
    const scoresArray = criteria.map(c => ({
      criteria_id: c.id,
      criteria_name: c.name,
      weight: c.weight,
      score: scores[c.id] || 0,
      max_score: c.max_score || 10,
    }));

    const weightedAvg = calculateWeightedAverage();
    const evaluationData = {
      project_id: project.id,
      project_code: project.code,
      evaluator_id: user.id,
      evaluator_name: user.full_name,
      scores: scoresArray,
      weighted_average: Math.round(weightedAvg * 100) / 100,
      observations,
      technical_opinion: technicalOpinion,
      comments,
      suggestions,
      evidence_photos: evidencePhotos,
      evaluation_date: new Date().toISOString(),
      latitude: location?.lat,
      longitude: location?.lng,
      phase: project.phase,
      synced: isOnline,
    };

    if (!isOnline) {
      // Save locally for later sync
      saveOffline(evaluationData, alreadyEvaluated && existingEvaluation ? existingEvaluation.id : null);
      toast({
        title: "Salvo offline!",
        description: "Sua avaliação foi salva localmente e será sincronizada quando a conexão for restabelecida.",
      });
      setSaving(false);
      onComplete?.();
      return;
    }

    if (alreadyEvaluated && existingEvaluation) {
      await base44.entities.Evaluation.update(existingEvaluation.id, evaluationData);
    } else {
      await base44.entities.Evaluation.create(evaluationData);
    }

    const allEvals = await base44.entities.Evaluation.filter({ project_id: project.id });
    const avgScore = allEvals.reduce((s, e) => s + (e.weighted_average || 0), 0) / allEvals.length;
    await base44.entities.Project.update(project.id, {
      final_score: Math.round(avgScore * 100) / 100,
      evaluation_count: allEvals.length,
      status: "avaliado",
    });

    toast({ title: alreadyEvaluated ? "Avaliação atualizada!" : "Avaliação registrada!", description: `Nota média ponderada: ${weightedAvg.toFixed(2)}` });
    setSaving(false);
    onComplete?.();
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!isAvaliador) {
    return (
      <Card className="border-chart-3/30 bg-chart-3/5">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-chart-3 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-1">Acesso restrito</h3>
          <p className="text-muted-foreground text-sm">Somente usuários com perfil de avaliador podem atribuir notas.</p>
        </CardContent>
      </Card>
    );
  }

  if (criteria.length === 0) {
    return (
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-accent mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-1">Sem critérios configurados</h3>
          <p className="text-muted-foreground text-sm">Nenhum critério de avaliação foi configurado para esta categoria/fase.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-chart-3/10 border border-chart-3/30 text-sm">
          <WifiOff className="w-4 h-4 text-chart-3 shrink-0" />
          <span className="text-chart-3 font-medium">Modo offline — sua avaliação será salva localmente e sincronizada ao reconectar.</span>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg">
              {alreadyEvaluated ? "Editar Avaliação" : "Ficha de Avaliação"}
            </CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date().toLocaleString("pt-BR")}</span>
              {location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />GPS ativo</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {alreadyEvaluated && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-chart-3/10 border border-chart-3/20 text-sm">
              <AlertTriangle className="w-4 h-4 text-chart-3 shrink-0" />
              <span>Você está editando sua avaliação anterior.</span>
            </div>
          )}

          {/* Critérios de Pontuação */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Pontuação por Critério</h4>
            <div className="space-y-4">
              {criteria.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="space-y-3 p-4 rounded-xl bg-muted/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{c.name}</h4>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Peso: {c.weight}</Badge>
                      <Badge className="bg-primary/10 text-primary text-sm font-bold min-w-[3rem] justify-center">
                        {scores[c.id] || 0}
                      </Badge>
                    </div>
                  </div>
                  <Slider
                    value={[scores[c.id] || 0]}
                    onValueChange={([v]) => setScores(prev => ({ ...prev, [c.id]: v }))}
                    max={c.max_score || 10}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span><span>{c.max_score || 10}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Parecer Técnico */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Parecer e Comentários</h4>
            <div className="space-y-4">
              <div>
                <Label>Parecer Técnico</Label>
                <Textarea
                  value={technicalOpinion}
                  onChange={e => setTechnicalOpinion(e.target.value)}
                  placeholder="Descreva o parecer técnico sobre o projeto..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Comentários</Label>
                <Textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="Comentários sobre o trabalho apresentado..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Sugestões de Melhoria</Label>
                <Textarea
                  value={suggestions}
                  onChange={e => setSuggestions(e.target.value)}
                  placeholder="Sugestões para aprimoramento do projeto..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Observações Gerais</Label>
                <Textarea
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Evidências fotográficas */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Evidências Fotográficas</h4>
            <div className="space-y-3">
              {evidencePhotos.map((photo, idx) => (
                <div key={idx} className="flex gap-3 p-3 rounded-xl bg-muted/40">
                  <img src={photo.url} alt={`Evidência ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={photo.caption}
                      onChange={e => updateCaption(idx, e.target.value)}
                      placeholder="Legenda da foto..."
                      className="w-full text-sm bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <button onClick={() => removePhoto(idx)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute("capture");
                    fileInputRef.current.click();
                  }
                }} disabled={uploadingPhoto}>
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                  Galeria
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute("capture", "environment");
                    fileInputRef.current.click();
                  }
                }} disabled={uploadingPhoto}>
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Camera className="w-4 h-4 mr-1" />}
                  Câmera
                </Button>
              </div>
            </div>
          </div>

          {/* Nota final e envio */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div>
              <p className="text-sm text-muted-foreground">Média Ponderada</p>
              <p className="font-heading text-3xl font-bold text-primary">{calculateWeightedAverage().toFixed(2)}</p>
            </div>
            <Button onClick={handleSubmit} disabled={saving} size="lg" className="px-8">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {saving ? "Salvando..." : alreadyEvaluated ? "Atualizar Avaliação" : "Confirmar Avaliação"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}