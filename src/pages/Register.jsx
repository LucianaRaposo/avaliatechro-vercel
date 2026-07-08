import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, User, Phone } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const urlParams = new URLSearchParams(window.location.search);
  const inviteSerticName = urlParams.get("sertic_name") || "";

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.full_name.trim()) { setError("Nome completo é obrigatório"); return; }
    if (form.password !== form.confirmPassword) { setError("As senhas não coincidem"); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: form.email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Salvar apenas dados pessoais — role e sertic_id são atribuídos pelo backend via convite
      const profileData = {
        full_name: form.full_name,
        phone: form.phone,
        whatsapp: form.whatsapp,
      };
      await base44.auth.updateMe(profileData);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Código de verificação inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(form.email);
      toast({ title: "Código enviado", description: "Verifique seu email para o novo código." });
    } catch (err) {
      setError(err.message || "Falha ao reenviar código");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verifique seu email"
        subtitle={`Enviamos um código para ${form.email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : "Verificar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Não recebeu o código?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">Reenviar</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Crie sua conta"
      subtitle={inviteSerticName ? `Cadastro — ${inviteSerticName}` : "Preencha seus dados para se cadastrar"}
      footer={
        <>
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
        </>
      }
    >
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continuar com Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome Completo */}
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="full_name" type="text" autoFocus placeholder="Seu nome completo"
              value={form.full_name} onChange={set("full_name")} className="pl-10 h-12" required />
          </div>
        </div>

        {/* E-mail */}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com"
              value={form.email} onChange={set("email")} className="pl-10 h-12" required />
          </div>
        </div>

        {/* Telefone e WhatsApp */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="(92) 99999-9999"
                value={form.phone} onChange={set("phone")} className="pl-10 h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="whatsapp" type="tel" placeholder="(92) 99999-9999"
                value={form.whatsapp} onChange={set("whatsapp")} className="pl-10 h-12" />
            </div>
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <Label htmlFor="password">Senha *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••"
              value={form.password} onChange={set("password")} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar Senha *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••"
              value={form.confirmPassword} onChange={set("confirmPassword")} className="pl-10 h-12" required />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</> : "Criar conta"}
        </Button>
      </form>
    </AuthLayout>
  );
}