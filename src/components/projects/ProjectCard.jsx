import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, MapPin, Users, Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusColors = {
  inscrito: "bg-secondary text-secondary-foreground",
  aprovado: "bg-primary/10 text-primary",
  em_avaliacao: "bg-accent/10 text-accent",
  avaliado: "bg-chart-3/10 text-chart-3",
  premiado: "bg-chart-4/10 text-chart-4",
};

const statusLabels = {
  inscrito: "Inscrito",
  aprovado: "Aprovado",
  em_avaliacao: "Em Avaliação",
  avaliado: "Avaliado",
  premiado: "Premiado",
};

export default function ProjectCard({ project, onClick, onEdit, canEdit, onDelete }) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 border-border/50"
      onClick={() => onClick?.(project)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-muted-foreground mb-1">{project.code}</p>
            <h3 className="font-heading font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {project.title}
            </h3>
          </div>
          <div className="flex items-start gap-1">
            {canEdit && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mt-0.5 text-muted-foreground hover:text-primary shrink-0"
                  onClick={(e) => { e.stopPropagation(); onEdit?.(project); }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mt-0.5 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => { e.stopPropagation(); onDelete?.(project); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Badge className={cn("text-xs shrink-0", statusColors[project.status])}>
              {statusLabels[project.status]}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">{project.category}</Badge>
          {project.knowledge_area && (
            <Badge variant="outline" className="text-xs">{project.knowledge_area}</Badge>
          )}
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <School className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{project.school}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{project.municipality}{project.nte ? ` - ${project.nte}` : ""}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{project.students?.length || 0} aluno(s)</span>
            </div>
            {project.final_score > 0 && (
              <div className="flex items-center gap-1 text-primary font-semibold">
                <Star className="w-3.5 h-3.5" />
                {project.final_score?.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}