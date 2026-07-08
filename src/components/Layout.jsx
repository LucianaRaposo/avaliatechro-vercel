import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, FolderOpen, QrCode, ClipboardCheck, 
  BarChart3, Settings, Menu, LogOut, Award, ChevronRight, Users as UsersIcon, Shield, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Painel" },
  { path: "/projects", icon: FolderOpen, label: "Projetos" },
  { path: "/qrcodes", icon: QrCode, label: "QR Codes" },
  { path: "/evaluations", icon: ClipboardCheck, label: "Avaliações" },
  { path: "/ranking", icon: Award, label: "Classificação" },
  { path: "/reports", icon: BarChart3, label: "Relatórios" },
  { path: "/evaluator", icon: ClipboardCheck, label: "Minha Avaliação", evaluatorOnly: true },
  { path: "/admin", icon: Settings, label: "Configurações", adminOnly: true },
  { path: "/users", icon: UsersIcon, label: "Usuários", adminOnly: true },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNTE = user?.role === "nte_coordenador";

  const { data: sertics = [] } = useQuery({
    queryKey: ["sertics"],
    queryFn: () => base44.entities.SERTIC.list(),
    enabled: isNTE && !!user?.sertic_id,
  });
  const mySertic = sertics.find(s => s.id === user?.sertic_id);



  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {mySertic?.logo_url ? (
              <img src={mySertic.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <img
                src="/assets/logo.svg"
                alt="AvaliaTech"
                className="w-12 h-12 rounded-xl object-contain"
              />
            )}
            <div>
              <h1 className="font-heading font-bold text-base text-foreground leading-tight truncate max-w-[160px]">
                {isNTE && mySertic ? (mySertic.fair_name || mySertic.name) : "AvaliaTech"}
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                {isNTE && mySertic ? mySertic.acronym : "Sistema de Avaliação"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => {
            if (item.adminOnly) return ["admin", "admin_estadual", "nte_coordenador"].includes(user?.role);
            if (item.evaluatorOnly) return user?.role === "avaliador";
            return true;
          }).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <button onClick={() => { navigate("/profile"); setSidebarOpen(false); }} className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <span className="text-sm font-bold text-primary">
                {user?.full_name?.[0]?.toUpperCase() || "U"}
              </span>
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { navigate("/profile"); setSidebarOpen(false); }}>
              <p className="text-sm font-medium text-foreground truncate">{user?.full_name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role || "professor"}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
              import("@/api/base44Client").then(({ base44 }) => base44.auth.logout());
            }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden lg:block">
              <h2 className="font-heading font-semibold text-foreground">
                {navItems.find(i => i.path === location.pathname)?.label || "Página"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {isNTE && mySertic
                  ? (mySertic.fair_name || mySertic.name)
                  : "AvaliaTech — Sistema de Avaliação"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}