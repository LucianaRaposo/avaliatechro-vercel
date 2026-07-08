import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Printer, Search, QrCode, Download } from "lucide-react";
import QRCodeGenerator from "@/components/qr/QRCodeGenerator";
import { motion } from "framer-motion";
import { useScope } from "@/lib/useScope";

export default function QRCodes() {
  const { serticId, filterByScope } = useScope();
  const [search, setSearch] = useState("");
  const [filterPhase, setFilterPhase] = useState("all");
  const printRef = useRef(null);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", serticId],
    queryFn: async () => {
      const all = await base44.entities.Project.list("-created_date");
      return filterByScope(all);
    },
  });

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.school?.toLowerCase().includes(search.toLowerCase());
    const matchPhase = filterPhase === "all" || p.phase === filterPhase;
    return matchSearch && matchPhase;
  });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const content = filtered.map(p => {
      const url = `${window.location.origin}/project/${p.code}?tab=evaluate&from_qr=true`;
      return `
        <div style="page-break-inside:avoid;border:1px solid #ddd;border-radius:12px;padding:20px;margin:10px;display:inline-block;width:280px;text-align:center;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${p.title}</div>
          <div style="font-size:11px;color:#666;margin-bottom:8px;">${p.code}</div>
          <div style="font-size:11px;color:#999;margin-bottom:4px;">${p.school} - ${p.municipality}</div>
          <div style="margin-top:8px;padding:8px;background:#f5f5f5;border-radius:8px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}" width="160" height="160" />
          </div>
          <div style="font-size:9px;color:#aaa;margin-top:6px;">${url}</div>
        </div>
      `;
    }).join("");
    
    printWindow.document.write(`
      <html><head><title>QR Codes - Feira de Projetos</title>
      <style>body{font-family:sans-serif;padding:20px;}@media print{body{padding:0;}}</style></head>
      <body><div style="display:flex;flex-wrap:wrap;justify-content:center;">${content}</div>
      <script>setTimeout(()=>window.print(),500)</script></body></html>
    `);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">QR Codes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cada projeto possui um QR Code único e permanente
          </p>
        </div>
        <Button onClick={handlePrint} disabled={filtered.length === 0}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir QR Codes ({filtered.length})
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar projeto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
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

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <QrCode className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
        </div>
      ) : (
        <div ref={printRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p, i) => {
            const url = `${window.location.origin}/project/${p.code}?tab=evaluate&from_qr=true`;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="text-center hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <h3 className="font-heading font-semibold text-sm line-clamp-2 mb-1">{p.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground mb-1">{p.code}</p>
                    <p className="text-xs text-muted-foreground mb-3">{p.school}</p>
                    <div className="flex justify-center mb-3">
                      <div className="bg-white p-2 rounded-xl shadow-sm inline-block">
                        <QRCodeGenerator value={url} size={150} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Badge variant="outline" className="text-xs">{p.phase?.charAt(0).toUpperCase() + p.phase?.slice(1)}</Badge>
                      <Badge variant="outline" className="text-xs">{p.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}