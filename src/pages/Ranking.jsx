import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Star, School, MapPin, Download, FileSpreadsheet, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useScope } from "@/lib/useScope";

const escapeHtml = (str) => String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

export default function Ranking() {
  const { isSerticAdmin, serticId, filterByScope } = useScope();
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPhase, setFilterPhase] = useState("all");

  const exportCSV = () => {
    const headers = ["Posição", "Código", "Título", "Categoria", "Escola", "Município", "Nota Final", "Avaliações", "Fase"];
    const csvContent = [
      headers.join(";"),
      ...ranked.map((p, i) => [
        `${i + 1}º`,
        p.code,
        `"${p.title.replace(/"/g, '""')}"`,
        p.category,
        `"${p.school.replace(/"/g, '""')}"`,
        p.municipality,
        p.final_score?.toFixed(2) || "0",
        p.evaluation_count || 0,
        p.phase
      ].join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ranking_projetos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado!", description: "O arquivo CSV foi baixado com sucesso." });
  };

  const exportPDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <title>Ranking de Projetos</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #059669; font-size: 24px; margin-bottom: 10px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #059669; color: white; padding: 12px; text-align: left; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
            tr:nth-child(even) { background: #f9f9f9; }
            .rank { font-weight: bold; width: 50px; }
            .score { color: #059669; font-weight: bold; font-size: 13px; }
            .top3 { background: #fef3c7 !important; }
          </style>
        </head>
        <body>
          <h1>🏆 Ranking de Projetos</h1>
          <p class="subtitle">Classificação em tempo real - ${new Date().toLocaleString("pt-BR")}</p>
          <p class="subtitle">Total: ${ranked.length} projetos | Filtro: ${filterCategory === "all" ? "Todas categorias" : filterCategory} | ${filterPhase === "all" ? "Todas fases" : filterPhase}</p>
          <table>
            <thead>
              <tr>
                <th class="rank">Pos</th>
                <th>Código</th>
                <th>Título</th>
                <th>Categoria</th>
                <th>Escola</th>
                <th>Município</th>
                <th>Nota</th>
                <th>Aval.</th>
              </tr>
            </thead>
            <tbody>
              ${ranked.map((p, i) => `
                <tr class="${i < 3 ? "top3" : ""}">
                  <td class="rank">${i + 1}º</td>
                  <td>${escapeHtml(p.code)}</td>
                  <td>${escapeHtml(p.title)}</td>
                  <td>${escapeHtml(p.category)}</td>
                  <td>${escapeHtml(p.school)}</td>
                  <td>${escapeHtml(p.municipality)}</td>
                  <td class="score">${p.final_score?.toFixed(2) || "0.00"}</td>
                  <td>${p.evaluation_count || 0}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    toast({ title: "PDF pronto!", description: "O arquivo PDF está sendo gerado para impressão." });
  };

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", serticId],
    queryFn: async () => {
      const all = await base44.entities.Project.list();
      return filterByScope(all);
    },
  });

  const ranked = projects
    .filter(p => p.final_score > 0)
    .filter(p => filterCategory === "all" || p.category === filterCategory)
    .filter(p => filterPhase === "all" || p.phase === filterPhase)
    .sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

  const MedalIcon = ({ position }) => {
    if (position === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (position === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 2) return <Award className="w-6 h-6 text-amber-700" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Ranking de Projetos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Classificação em tempo real baseada nas avaliações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={ranked.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={ranked.length === 0}>
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-56">
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

      {/* Top 3 podium */}
      {ranked.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 lg:gap-6">
          {[1, 0, 2].map((pos) => {
            const p = ranked[pos];
            if (!p) return null;
            const isFirst = pos === 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pos * 0.15 }}
                className={cn(isFirst && "lg:-mt-4")}
              >
                <Link to={`/project/${p.code}`}>
                  <Card className={cn(
                    "text-center hover:shadow-xl transition-all",
                    isFirst && "border-yellow-300/50 bg-gradient-to-b from-yellow-50/50 to-transparent shadow-lg"
                  )}>
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex justify-center mb-2">
                        <MedalIcon position={pos} />
                      </div>
                      <div className={cn(
                        "w-10 h-10 lg:w-14 lg:h-14 rounded-full mx-auto flex items-center justify-center font-bold mb-2",
                        pos === 0 ? "bg-yellow-100 text-yellow-700 text-xl lg:text-2xl" :
                        pos === 1 ? "bg-gray-100 text-gray-600 text-lg lg:text-xl" :
                        "bg-amber-100 text-amber-700 text-lg lg:text-xl"
                      )}>
                        {pos + 1}º
                      </div>
                      <h3 className="font-heading font-bold text-xs lg:text-sm line-clamp-2 mb-1">{p.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{p.school}</p>
                      <p className="font-heading text-xl lg:text-2xl font-bold text-primary">{p.final_score?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{p.evaluation_count || 0} aval.</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full ranking list */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Classificação Geral ({ranked.length} projetos)</CardTitle>
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum projeto avaliado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ranked.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link to={`/project/${p.code}`}>
                    <div className={cn(
                      "flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors",
                      i < 3 && "bg-muted/50"
                    )}>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                        i === 0 ? "bg-yellow-100 text-yellow-700" :
                        i === 1 ? "bg-gray-100 text-gray-600" :
                        i === 2 ? "bg-amber-100 text-amber-700" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {i + 1}º
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground truncate">{p.title}</h4>
                          <Badge variant="outline" className="text-xs shrink-0">{p.category}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><School className="w-3 h-3" />{p.school}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.municipality}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-heading text-xl font-bold text-primary">{p.final_score?.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{p.evaluation_count || 0} aval.</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}