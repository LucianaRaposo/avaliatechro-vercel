import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Copy, Check, Building2, Users } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function EvaluatorInviteLinks() {
  const [copied, setCopied] = useState(null);

  const { data: sertics = [] } = useQuery({
    queryKey: ["sertics"],
    queryFn: () => base44.entities.SERTIC.filter({ is_active: true }),
  });

  const { data: regionalFairs = [] } = useQuery({
    queryKey: ["regionalFairs"],
    queryFn: () => base44.entities.RegionalFair.filter({ is_active: true }),
  });

  const getRegionalFairsForSertic = (serticId) =>
    regionalFairs.filter(rf => rf.sertic_id === serticId);

  const buildInviteLink = (serticId, serticAcronym) => {
    const base = window.location.origin;
    const params = new URLSearchParams({
      role: "avaliador",
      sertic: serticId,
      sertic_name: serticAcronym,
    });
    return `${base}/register?${params.toString()}`;
  };

  const handleCopy = async (serticId, serticAcronym) => {
    const link = buildInviteLink(serticId, serticAcronym);
    await navigator.clipboard.writeText(link);
    setCopied(serticId);
    toast({ title: "Link copiado!", description: `Link de convite para avaliadores do ${serticAcronym} copiado.` });
    setTimeout(() => setCopied(null), 2500);
  };

  if (sertics.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-base">Links de Convite para Avaliadores</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Compartilhe o link abaixo com os avaliadores de cada SERTIC Regional
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sertics.map(sertic => {
          const fairs = getRegionalFairsForSertic(sertic.id);
          const link = buildInviteLink(sertic.id, sertic.acronym);
          const isCopied = copied === sertic.id;

          return (
            <div key={sertic.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{sertic.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{sertic.acronym}</Badge>
                    {fairs.length > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />{fairs.length} feira(s) regional(is)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs font-mono">{link}</p>
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