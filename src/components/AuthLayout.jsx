import React from "react";
import { Award, Star, Trophy, Users } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex">
      {/* Painel lateral esquerdo — visível apenas em telas grandes */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 text-center text-primary-foreground max-w-md">
          <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur mx-auto mb-6">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-heading font-bold text-4xl leading-tight mb-3">
            Feira Estadual<br />de Projetos
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-10">
            Sistema integrado de gestão, avaliação e premiação de projetos estudantis
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { Icon: Star, label: "Projetos Inscritos" },
              { Icon: Users, label: "Avaliadores" },
              { Icon: Trophy, label: "Premiações" },
            ].map(({ Icon: ItemIcon, label }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <ItemIcon className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-xs text-primary-foreground/80 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 lg:hidden">
              <Award className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
          </div>
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            {children}
          </div>
          {footer && (
            <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}