import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useScope } from "@/lib/useScope";

const COLORS = ["hsl(152,60%,36%)", "hsl(205,78%,46%)", "hsl(38,92%,50%)", "hsl(280,60%,55%)", "hsl(0,72%,51%)", "hsl(173,58%,39%)", "hsl(43,74%,66%)", "hsl(12,76%,61%)"];

export default function Reports() {
  const { isSerticAdmin, serticId, filterByScope } = useScope();
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", serticId],
    queryFn: async () => {
      const all = await base44.entities.Project.list();
      return filterByScope(all);
    },
  });
  const { data: evaluations = [] } = useQuery({
    queryKey: ["evaluations", serticId],
    queryFn: async () => {
      const allEvals = await base44.entities.Evaluation.list();
      if (isSerticAdmin && serticId) {
        const projectCodes = new Set(projects.map(p => p.code));
        return allEvals.filter(e => projectCodes.has(e.project_code));
      }
      return allEvals;
    },
  });
  const { data: sertics = [] } = useQuery({ queryKey: ["sertics"], queryFn: () => base44.entities.SERTIC.list() });

  // Category stats
  const categoryStats = {};
  projects.forEach(p => {
    if (!categoryStats[p.category]) categoryStats[p.category] = { count: 0, totalScore: 0, scored: 0 };
    categoryStats[p.category].count++;
    if (p.final_score > 0) {
      categoryStats[p.category].totalScore += p.final_score;
      categoryStats[p.category].scored++;
    }
  });
  const categoryData = Object.entries(categoryStats).map(([name, s]) => ({
    name: name.length > 15 ? name.slice(0, 15) + "..." : name,
    projetos: s.count,
    media: s.scored > 0 ? Math.round(s.totalScore / s.scored * 100) / 100 : 0,
  }));

  // Municipality stats
  const munStats = {};
  projects.forEach(p => { munStats[p.municipality] = (munStats[p.municipality] || 0) + 1; });
  const munData = Object.entries(munStats).sort(([,a],[,b]) => b - a).slice(0, 10).map(([name, count]) => ({ name, count }));

  // Phase distribution
  const phaseData = [
    { name: "Municipal", value: projects.filter(p => p.phase === "municipal").length },
    { name: "Estadual", value: projects.filter(p => p.phase === "estadual").length },
  ];

  // Status distribution
  const statusData = [
    { name: "Inscrito", value: projects.filter(p => p.status === "inscrito").length },
    { name: "Aprovado", value: projects.filter(p => p.status === "aprovado").length },
    { name: "Em Avaliação", value: projects.filter(p => p.status === "em_avaliacao").length },
    { name: "Avaliado", value: projects.filter(p => p.status === "avaliado").length },
    { name: "Premiado", value: projects.filter(p => p.status === "premiado").length },
  ].filter(d => d.value > 0);

  const serticStats = {};
  projects.forEach(p => {
    if (p.sertic_id) {
      const s = sertics.find(x => x.id === p.sertic_id);
      const label = s ? s.acronym : p.sertic_id;
      serticStats[label] = (serticStats[label] || 0) + 1;
    }
  });
  const serticChartData = Object.entries(serticStats).map(([name, count]) => ({ name, count }));



  const handleExportCSV = () => {
    const headers = "Código,Título,Categoria,Escola,Município,SERTIC,NTE,Fase,Status,Nota Final,Avaliações,Alunos\n";
    const rows = projects.map(p => {
      const s = sertics.find(x => x.id === p.sertic_id);
      return `"${p.code}","${p.title}","${p.category}","${p.school}","${p.municipality}","${s?.acronym || ""}","${p.nte || ""}","${p.phase}","${p.status}","${p.final_score || ""}","${p.evaluation_count || 0}","${p.students?.length || 0}"`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_feira_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast({ title: "CSV exportado!", description: "O arquivo CSV foi baixado com sucesso." });
  };

  const handleExportPDF = () => {
    const htmlContent = `
      <html>
        <head>
          <title>Relatório Geral da Feira</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #059669; font-size: 24px; margin-bottom: 10px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
            .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
            .stat-label { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #059669; color: white; padding: 12px; text-align: left; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
            tr:nth-child(even) { background: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>📊 Relatório Geral da Feira</h1>
          <p class="subtitle">${new Date().toLocaleString("pt-BR")}</p>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${projects.length}</div>
              <div class="stat-label">Projetos</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${evaluations.length}</div>
              <div class="stat-label">Avaliações</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${Object.keys(munStats).length}</div>
              <div class="stat-label">Municípios</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${sertics.length}</div>
              <div class="stat-label">SERTICs</div>
            </div>
          </div>

          <h2 style="color: #059669; font-size: 18px; margin-top: 30px;">Resumo por Categoria</h2>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Projetos</th>
                <th>Média de Notas</th>
              </tr>
            </thead>
            <tbody>
              ${categoryData.map(c => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.projetos}</td>
                  <td>${c.media > 0 ? c.media.toFixed(2) : "—"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <h2 style="color: #059669; font-size: 18px; margin-top: 30px;">Top 10 Municípios</h2>
          <table>
            <thead>
              <tr><th>Município</th><th>Projetos</th></tr>
            </thead>
            <tbody>
              ${munData.map(m => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.count}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <h2 style="color: #059669; font-size: 18px; margin-top: 30px;">Status dos Projetos</h2>
          <table>
            <thead>
              <tr><th>Status</th><th>Quantidade</th></tr>
            </thead>
            <tbody>
              ${statusData.map(s => `
                <tr>
                  <td>${s.name}</td>
                  <td>${s.value}</td>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Análise e dados da feira
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-heading font-bold text-foreground">{projects.length}</p><p className="text-xs text-muted-foreground">Total de Projetos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-heading font-bold text-foreground">{evaluations.length}</p><p className="text-xs text-muted-foreground">Avaliações</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-heading font-bold text-foreground">{Object.keys(munStats).length}</p><p className="text-xs text-muted-foreground">Municípios</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-heading font-bold text-foreground">{sertics.length}</p><p className="text-xs text-muted-foreground">SERTICs</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Projetos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="projetos" fill="hsl(152,60%,36%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Distribuição por Fase</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={phaseData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {phaseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Top 10 Municípios</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={munData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(205,78%,46%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Status dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-heading text-lg">Média de Notas por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData.filter(c => c.media > 0)}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 10]} /><Tooltip />
                <Bar dataKey="media" fill="hsl(38,92%,50%)" radius={[6, 6, 0, 0]} name="Média" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {serticChartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="font-heading text-lg">Projetos por SERTIC</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serticChartData}>
                  <XAxis dataKey="name" /><YAxis /><Tooltip />
                  <Bar dataKey="count" fill="hsl(280,60%,55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}


      </div>
    </div>
  );
}