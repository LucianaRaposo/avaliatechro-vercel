import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Copy, Check, Building2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

function buildEvaluatorLink(serticId, serticAcronym) {
  const base = window.location.origin;
  const params = new URLSearchParams({ role: "avaliador", sertic: serticId, sertic_name: serticAcronym });
  return `${base}/register?${params.toString()}`;
}

export default function InviteLinks() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(null);

  const { data: sertics = [] } = useQuery({
    queryKey: ["sertics"],
    queryFn: () => base44.entities.SERTIC.filter({ is_active: true }),
  });

  // Only admins can generate invite links for evaluators
  const canInvite = ["admin", "admin_estadual", "nte_coordenador"].includes(user?.role);
  if (!canInvite) return null;

  // NTE Coordinators only see their own SERTIC
  const visibleSertics = user?.role === "nte_coordenador" && user?.sertic_id
    ? sertics.filter(s => s.id === user.sertic_id)
    : sertics;

  if (visibleSertics.length === 0) return null;

  const handleCopy = async (serticId, serticAcronym) => {
    const link = buildEvaluatorLink(serticId, serticAcronym);
    await navigator.clipboard.writeText(link);
    setCopied(serticId);
    toast({ title: "Link copiado!", description: `Link de convite para avaliadores do ${serticAcronym} copiado.` });
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-base">Links de Convite para Avaliadores</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Compartilhe estes links com os avaliadores de cada SERTIC para que se cadastrem no sistema
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleSertics.map(sertic => {
          const link = buildEvaluatorLink(sertic.id, sertic.acronym);
          const isCopied = copied === sertic.id;
          return (
            <div key={sertic.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm truncate">{sertic.name}</p>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">{sertic.acronym}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">{link}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={isCopied ? "default" : "outline"}
                className="flex-shrink-0"
                onClick={() => handleCopy(sertic.id, sertic.acronym)}
              >
                {isCopied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {isCopied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}