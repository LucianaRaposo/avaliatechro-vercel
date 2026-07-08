import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const CATEGORIAS_PADRAO = ["Ciências da Natureza", "Ciências Humanas", "Matemática", "Linguagens", "Robótica", "Inteligência Artificial", "Sustentabilidade", "Inovação Tecnológica", "Pesquisa", "Iniciação Científica"];

export default function CategoryManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isNTE = user?.role === "nte_coordenador";
  const scopeKey = isNTE ? user?.sertic_id : "global";
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  const { data: configList = [], isLoading } = useQuery({
    queryKey: ["categoryConfig", scopeKey],
    queryFn: () => base44.entities.CategoryConfig.list(),
  });

  // For NTE: find config for their sertic; for admin: find the global config (no sertic_id)
  const config = isNTE
    ? configList.find(c => c.sertic_id === user?.sertic_id)
    : configList.find(c => !c.sertic_id);

  useEffect(() => {
    if (config) {
      setCategories(config.categories || CATEGORIAS_PADRAO);
    } else if (!isLoading) {
      setCategories(CATEGORIAS_PADRAO);
    }
  }, [config, isLoading]);

  const persist = async (updated) => {
    setSaving(true);
    try {
      if (config) {
        await base44.entities.CategoryConfig.update(config.id, { categories: updated });
      } else {
        await base44.entities.CategoryConfig.create({
          categories: updated,
          ...(isNTE && user?.sertic_id ? { sertic_id: user.sertic_id } : {}),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["categoryConfig", scopeKey] });
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const updated = [...categories, trimmed];
    setCategories(updated);
    setNewCat("");
    await persist(updated);
    toast({ title: "Categoria adicionada!" });
  };

  const handleDelete = async (idx) => {
    const updated = categories.filter((_, i) => i !== idx);
    setCategories(updated);
    await persist(updated);
    toast({ title: "Categoria removida" });
  };

  if (isLoading) {
    return <div className="flex items-center gap-2 text-muted-foreground p-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando categorias...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold">Categorias de Projetos</h3>
        <p className="text-sm text-muted-foreground">Personalize as categorias disponíveis para os projetos</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="Nova categoria..."
            />
            <Button onClick={handleAdd} disabled={saving || !newCat.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Adicionar
            </Button>
          </div>

          <div className="space-y-1">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors">
                <span className="flex-1 font-medium text-sm">{cat}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(idx)}
                  disabled={saving}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {categories.length} categoria(s) — as alterações são salvas automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}