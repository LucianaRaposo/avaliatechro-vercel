import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Mail, Shield, MapPin, Building2, UserX, Edit } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import InviteLinks from "@/components/users/InviteLinks";

const roleLabels = { admin: "Admin", admin_estadual: "Admin Estadual", nte_coordenador: "NTE Coordenador", avaliador: "Avaliador", professor: "Professor" };
const roleColors = { admin: "bg-destructive/10 text-destructive", admin_estadual: "bg-accent/10 text-accent", nte_coordenador: "bg-primary/10 text-primary", avaliador: "bg-chart-3/10 text-chart-3", professor: "bg-muted text-muted-foreground" };

export default function Users() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = ["admin", "admin_estadual", "nte_coordenador"].includes(user?.role);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "professor" });
  const [inviting, setInviting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ sertic_id: "", municipality: "", role: "" });

  const isNTECoordinator = user?.role === "nte_coordenador";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", user?.sertic_id, user?.role],
    queryFn: async () => {
      const all = await base44.entities.User.list();
      // NTE Coordenador só vê e gerencia usuários do seu próprio SERTIC
      if (isNTECoordinator && user?.sertic_id) {
        return all.filter(u => u.sertic_id === user.sertic_id);
      }
      return all;
    },
    enabled: isAdmin,
  });

  const { data: sertics = [] } = useQuery({
    queryKey: ["sertics"],
    queryFn: () => base44.entities.SERTIC.list(),
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  const roleToBaseRole = (role) => {
    const adminRoles = ["admin", "admin_estadual", "nte_coordenador"];
    return adminRoles.includes(role) ? "admin" : "user";
  };

  const handleInvite = async () => {
    if (!inviteForm.email) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteForm.email, "user");
      // Se NTE Coordenador convida, já vincula automaticamente ao SERTIC dele
      if (isNTECoordinator && user?.sertic_id) {
        const all = await base44.entities.User.list();
        const newUser = all.find(u => u.email === inviteForm.email);
        if (newUser) {
          await base44.entities.User.update(newUser.id, {
            sertic_id: user.sertic_id,
            role: inviteForm.role,
          });
        }
      }
      setShowInvite(false);
      setInviteForm({ email: "", role: "professor" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Convite enviado!", description: `Convite enviado para ${inviteForm.email}.` });
    } catch (err) {
      toast({ title: "Erro ao enviar convite", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    // NTE Coordenador só pode editar usuários do seu próprio SERTIC
    if (isNTECoordinator && editingUser.sertic_id !== user.sertic_id) {
      toast({ title: "Acesso negado", description: "Você só pode editar usuários do seu SERTIC.", variant: "destructive" });
      return;
    }
    try {
      const updateData = {
        municipality: editForm.municipality || null,
        role: editForm.role || editingUser.role,
      };
      // NTE Coordenador não pode alterar o SERTIC — fica sempre fixo no seu
      if (isNTECoordinator) {
        updateData.sertic_id = user.sertic_id;
      } else {
        updateData.sertic_id = editForm.sertic_id || null;
      }
      await base44.entities.User.update(editingUser.id, updateData);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Usuário atualizado!", description: "Vínculos do usuário atualizados com sucesso." });
    } catch (err) {
      toast({ title: "Erro ao atualizar", description: err?.message || "Tente novamente.", variant: "destructive" });
    }
  };

  const openEditDialog = (u) => {
    setEditingUser(u);
    setEditForm({ sertic_id: u.sertic_id || "", municipality: u.municipality || "", role: u.role || "professor" });
  };

  // Roles que cada papel pode atribuir a outros usuários
  const editableRoles = () => {
    if (user?.role === "admin") return ["professor", "avaliador", "nte_coordenador", "admin_estadual", "admin"];
    if (user?.role === "admin_estadual") return ["professor", "avaliador", "nte_coordenador"];
    if (user?.role === "nte_coordenador") return ["professor", "avaliador"];
    return [];
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isNTECoordinator ? "Professores e avaliadores do seu SERTIC" : "Gerencie todos os usuários do sistema"}
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}><Plus className="w-4 h-4 mr-2" />Convidar Usuário</Button>
      </div>

      <InviteLinks />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const sertic = sertics.find(s => s.id === u.sertic_id);
          return (
            <Card key={u.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{(u.full_name || "U")[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{u.full_name || "Sem nome"}</CardTitle>
                      <CardDescription className="text-xs">{u.email}</CardDescription>
                    </div>
                  </div>
                  <Badge className={`text-xs ${roleColors[u.role] || "bg-muted"}`}>{roleLabels[u.role] || u.role}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                  {u.municipality && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{u.municipality}</span>}
                  {sertic && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{sertic.acronym}</span>}
                  {!u.municipality && !u.sertic_id && <span>Sem vínculos definidos</span>}
                </div>
                {["admin", "admin_estadual", "nte_coordenador"].includes(user?.role) && (
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => openEditDialog(u)}>
                    <Edit className="w-3 h-3 mr-1" /> Editar Vínculos
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {users.length === 0 && <p className="text-center text-muted-foreground col-span-full py-8">Nenhum usuário encontrado</p>}
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Convidar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isNTECoordinator && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                O usuário será vinculado automaticamente ao seu SERTIC.
              </p>
            )}
            <div>
              <Label>E-mail *</Label>
              <Input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({...f, email: e.target.value}))} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Perfil</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({...f, role: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="avaliador">Avaliador</SelectItem>
                  {!isNTECoordinator && <SelectItem value="nte_coordenador">NTE Coordenador</SelectItem>}
                  {!isNTECoordinator && <SelectItem value="admin_estadual">Admin Estadual</SelectItem>}
                  {user?.role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteForm.email}>
              <Mail className="w-4 h-4 mr-2" />{inviting ? "Enviando..." : "Enviar Convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Editar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Editando: <strong>{editingUser?.full_name}</strong> ({editingUser?.email})
            </p>
            <div>
              <Label>Papel (Role)</Label>
              <Select value={editForm.role || ""} onValueChange={v => setEditForm(f => ({...f, role: v}))}>
                <SelectTrigger><SelectValue placeholder="Selecione o papel" /></SelectTrigger>
                <SelectContent>
                  {editableRoles().map(r => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isNTECoordinator && (
              <div>
                <Label>SERTIC</Label>
                <Select value={editForm.sertic_id || ""} onValueChange={v => setEditForm(f => ({...f, sertic_id: v === "null" ? null : v}))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o SERTIC" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Sem vínculo</SelectItem>
                    {sertics.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.acronym} - {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Município</Label>
              <Input value={editForm.municipality || ""} onChange={e => setEditForm(f => ({...f, municipality: e.target.value}))} placeholder="Município" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleEditUser}>
              <Shield className="w-4 h-4 mr-2" /> Salvar Vínculos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}