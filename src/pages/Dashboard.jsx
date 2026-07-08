import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useScope } from "@/lib/useScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, ClipboardCheck, Award, Users, TrendingUp, QrCode, Building2, MapPin, School } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const COLORS = ["hsl(152,60%,36%)", "hsl(205,78%,46%)", "hsl(38,92%,50%)", "hsl(280,60%,55%)", "hsl(0,72%,51%)", "hsl(173,58%,39%)", "hsl(43,74%,66%)", "hsl(12,76%,61%)"];

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6 ${color}`} />
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
              <Icon className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
              <p className="text-3xl font-heading font-bold text-foreground">{value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
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
  const { data: sertics = [] } = useQuery({
    queryKey: ["sertics"],
    queryFn: () => base44.entities.SERTIC.list(),
  });
  const mySertic = isSerticAdmin && serticId
    ? sertics.find(s => s.id === serticId)
    : null;

  const categoryData = {};
  projects.forEach(p => {
    categoryData[p.category] = (categoryData[p.category] || 0) + 1;
  });
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  const phaseData = [
    { name: "Municipal", count: projects.filter(p => p.phase === "municipal").length },
    { name: "Estadual", count: projects.filter(p => p.phase === "estadual").length },
  ];

  const topProjects = [...projects].filter(p => p.final_score > 0).sort((a, b) => (b.final_score || 0) - (a.final_score || 0)).slice(0, 5);
  const totalStudents = projects.reduce((s, p) => s + (p.students?.length || 0), 0);

  const municipalityData = {};
  projects.forEach(p => { municipalityData[p.municipality] = (municipalityData[p.municipality] || 0) + 1; });
  const municipalityChart = Object.entries(municipalityData).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const serticData = {};
  projects.forEach(p => {
    if (p.sertic_id) {
      const s = sertics.find(x => x.id === p.sertic_id);
      const label = s ? s.acronym : p.sertic_id;
      serticData[label] = (serticData[label] || 0) + 1;
    }
  });
  const serticChart = Object.entries(serticData).map(([name, count]) => ({ name, count }));

  const schoolData = {};
  projects.forEach(p => { schoolData[p.school] = (schoolData[p.school] || 0) + 1; });
  const topSchools = Object.entries(schoolData).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  const classifiedCount = projects.filter(p => p.status === "classificado" || p.status === "premiado").length;
  const avgScore = projects.filter(p => p.final_score > 0).reduce((s, p, _, arr) => s + (p.final_score || 0) / arr.length, 0);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <img
          src={mySertic?.banner_url || "/assets/banner.svg"}
          alt="Banner"
          className="w-full object-cover h-40 sm:h-52 lg:h-64"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent flex items-center px-6 lg:px-10">
          <div className="flex items-center gap-4">
            {mySertic?.logo_url && (
              <img src={mySertic.logo_url} alt="Logo" className="w-14 h-14 rounded-xl object-cover shadow-lg hidden sm:block" />
            )}
            <div>
              <h1 className="font-heading font-bold text-2xl lg:text-3xl text-white drop-shadow">
                {mySertic ? (mySertic.fair_name || mySertic.name) : "Painel da Feira"}
              </h1>
              <p className="text-white/80 mt-1 text-sm lg:text-base drop-shadow">
                {mySertic?.fair_slogan || (mySertic ? mySertic.description || "Painel Administrativo" : "Visão geral do sistema de projetos")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen} label="Projetos" value={projects.length} color="bg-primary" delay={0} />
        <StatCard icon={ClipboardCheck} label="Avaliações" value={evaluations.length} color="bg-accent" delay={0.1} />
        <StatCard icon={Users} label="Alunos" value={totalStudents} color="bg-chart-3" delay={0.2} />
        <StatCard icon={Award} label="Premiados" value={projects.filter(p => p.status === "premiado").length} color="bg-chart-4" delay={0.3} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MapPin} label="Municípios" value={Object.keys(municipalityData).length} color="bg-chart-5" delay={0.4} />
        <StatCard icon={Building2} label="SERTICs" value={sertics.length} color="bg-chart-1" delay={0.5} />
        <StatCard icon={TrendingUp} label="Classificados" value={classifiedCount} color="bg-chart-2" delay={0.6} />
        <StatCard icon={School} label="Média Geral" value={avgScore > 0 ? avgScore.toFixed(1) : "-"} color="bg-chart-3" delay={0.7} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg">Projetos por Categoria</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-[250px] text-muted-foreground">Nenhum projeto cadastrado</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg">Projetos por Município</CardTitle></CardHeader>
          <CardContent>
            {municipalityChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={municipalityChart} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(205,78%,46%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-[250px] text-muted-foreground">Sem dados</div>}
          </CardContent>
        </Card>
      </div>

      {serticChart.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg">Projetos por SERTIC</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={serticChart}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(280,60%,55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {topSchools.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-heading text-lg">Top 5 Escolas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSchools.map((s, i) => (
                <div key={s.name} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center font-bold text-sm text-accent">{i + 1}</div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-foreground truncate">{s.name}</p></div>
                  <Badge variant="outline">{s.count} projetos</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {topProjects.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">Top 5 Projetos</CardTitle>
              <Link to="/ranking" className="text-sm text-primary hover:underline font-medium">Ver ranking completo →</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProjects.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? "bg-chart-3 text-white" : i === 1 ? "bg-muted-foreground/20 text-foreground" : i === 2 ? "bg-chart-1 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.school} - {p.municipality}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-primary">{p.final_score?.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{p.evaluation_count || 0} aval.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/projects">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold group-hover:text-primary transition-colors">Gerenciar Projetos</h3>
                <p className="text-sm text-muted-foreground">Cadastrar e editar projetos</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/qrcodes">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-heading font-semibold group-hover:text-accent transition-colors">QR Codes</h3>
                <p className="text-sm text-muted-foreground">Gerar e imprimir QR Codes</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}