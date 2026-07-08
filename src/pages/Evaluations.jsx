import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ClipboardCheck, MapPin, Clock, FileText, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useScope } from "@/lib/useScope";

const escapeHtml = (str) => String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

export default function Evaluations() {
  const { isSerticAdmin, serticId, filterByScope } = useScope();
  const [search, setSearch] = useState("");

  const exportCSV = () => {
    const headers = ["Avaliador", "Código Projeto", "Fase", "Nota", "Data/Hora", "Latitude", "Longitude", "Observações"];
    const csvContent = [
      headers.join(";"),
      ...filtered.map(ev => [
        `"${(ev.evaluator_name || "").replace(/"/g, '""')}"`,
        ev.project_code,
        ev.phase,
        ev.weighted_average?.toFixed(2) || "0",
        ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleString("pt-BR") : "—",
        ev.latitude || "",
        ev.longitude || "",
        `"${(ev.observations || "").replace(/"/g, '""')}"`
      ].join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `avaliacoes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado!", description: "O arquivo CSV foi baixado com sucesso." });
  };

  const exportPDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <title>Relatório de Avaliações</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #059669; font-size: 24px; margin-bottom: 10px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #059669; color: white; padding: 12px; text-align: left; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
            tr:nth-child(even) { background: #f9f9f9; }
            .score { color: #059669; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>📋 Relatório de Avaliações</h1>
          <p class="subtitle">Total: ${filtered.length} avaliação(ões) | ${new Date().toLocaleString("pt-BR")}</p>
          <table>
            <thead>
              <tr>
                <th>Avaliador</th>
                <th>Projeto</th>
                <th>Fase</th>
                <th>Nota</th>
                <th>Data/Hora</th>
                <th>Localização</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(ev => `
                <tr>
                  <td>${escapeHtml(ev.evaluator_name || "—")}</td>
                  <td>${escapeHtml(ev.project_code)}</td>
                  <td>${escapeHtml(ev.phase || "—")}</td>
                  <td class="score">${ev.weighted_average?.toFixed(2) || "0.00"}</td>
                  <td>${ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleString("pt-BR") : "—"}</td>
                  <td>${ev.latitude ? `${ev.latitude.toFixed(4)}, ${ev.longitude.toFixed(4)}` : "—"}</td>
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

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ["evaluations", serticId],
    queryFn: async () => {
      const allEvaluations = await base44.entities.Evaluation.list("-created_date");
      if (isSerticAdmin && serticId) {
        const projects = await base44.entities.Project.filter({ sertic_id: serticId });
        const projectCodes = new Set(projects.map(p => p.code));
        return allEvaluations.filter(e => projectCodes.has(e.project_code));
      }
      return allEvaluations;
    },
  });

  const filtered = evaluations.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return e.evaluator_name?.toLowerCase().includes(s) ||
      e.project_code?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Avaliações</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {evaluations.length} avaliação(ões) registrada(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={filtered.length === 0}>
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por avaliador ou código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((ev, i) => (
          <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Link to={`/project/${ev.project_code}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{ev.evaluator_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{ev.project_code}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary font-bold">{ev.weighted_average?.toFixed(2)}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleString("pt-BR") : "—"}
                    </span>
                    {ev.latitude && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> GPS
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avaliador</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Localização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(ev => (
                <TableRow key={ev.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{ev.evaluator_name}</TableCell>
                  <TableCell>
                    <Link to={`/project/${ev.project_code}`} className="text-primary hover:underline font-mono text-sm">
                      {ev.project_code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">{ev.phase}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-primary/10 text-primary font-bold">{ev.weighted_average?.toFixed(2)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    {ev.latitude ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {ev.latitude.toFixed(4)}, {ev.longitude.toFixed(4)}
                      </span>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <ClipboardCheck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma avaliação encontrada.</p>
        </div>
      )}
    </div>
  );
}