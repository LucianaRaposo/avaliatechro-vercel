import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Save, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const roleLabels = {
  admin: "Admin",
  admin_estadual: "Admin Estadual",
  nte_coordenador: "NTE Coordenador",
  avaliador: "Avaliador",
  professor: "Professor",
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "", whatsapp: "" });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        phone: user.phone || "",
        whatsapp: user.whatsapp || "",
      });
    }
  }, [user]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const setPw = (field) => (e) => setPwForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: form.full_name, phone: form.phone, whatsapp: form.whatsapp });
      if (refreshUser) await refreshUser();
      toast({ title: "Perfil atualizado com sucesso!" });
    } catch (err) {
      toast({ title: "Erro ao salvar", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.next || pwForm.next !== pwForm.confirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (pwForm.next.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    try {
      await base44.auth.updateMe({ password: pwForm.next, current_password: pwForm.current });
      setPwForm({ current: "", next: "", confirm: "" });
      toast({ title: "Senha alterada com sucesso!" });
    } catch (err) {
      toast({ title: "Erro ao alterar senha", description: err?.message || "Verifique a senha atual.", variant: "destructive" });
    } finally {
      setSavingPw(false);
    }
  };

  const togglePw = (field) => setShowPw(s => ({ ...s, [field]: !s[field] }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações pessoais e acesso</p>
      </div>

      {/* Avatar + Role */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {(form.full_name || user?.full_name || "U")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">{user?.full_name || "Sem nome"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge className="mt-1 text-xs">{roleLabels[user?.role] || user?.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="full_name" placeholder="Seu nome completo" value={form.full_name} onChange={set("full_name")} className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" value={user?.email || ""} className="pl-10 bg-muted" disabled />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="phone" type="tel" placeholder="(92) 99999-9999" value={form.phone} onChange={set("phone")} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="whatsapp" type="tel" placeholder="(92) 99999-9999" value={form.whatsapp} onChange={set("whatsapp")} className="pl-10" />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : <><Save className="w-4 h-4 mr-2" />Salvar Dados</>}
          </Button>
        </CardContent>
      </Card>

      {/* Alterar senha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" /> Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: "current", label: "Senha Atual", field: "current" },
            { id: "next", label: "Nova Senha", field: "next" },
            { id: "confirm", label: "Confirmar Nova Senha", field: "confirm" },
          ].map(({ id, label, field }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id}>{label}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={id}
                  type={showPw[field] ? "text" : "password"}
                  placeholder="••••••••"
                  value={pwForm[field]}
                  onChange={setPw(field)}
                  className="pl-10 pr-10"
                />
                <button type="button" onClick={() => togglePw(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <Button onClick={handleChangePassword} disabled={savingPw} variant="outline">
            {savingPw ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Alterando...</> : <><Lock className="w-4 h-4 mr-2" />Alterar Senha</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}