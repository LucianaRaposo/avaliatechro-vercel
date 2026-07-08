import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useScope } from "@/lib/useScope";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Building2, Layers, ClipboardCheck, FileText } from "lucide-react";
import StateFairSettings from "@/components/admin/StateFairSettings";
import RegionalSettings from "@/components/admin/RegionalSettings";
import SERTICManager from "@/components/admin/SERTICManager";
import CategoryManager from "@/components/admin/CategoryManager";
import CriteriaManager from "@/components/admin/CriteriaManager";
import CertificateManager from "@/components/admin/CertificateManager";

export default function Admin() {
  const { isAdmin, isSerticAdmin } = useScope();
  const isNTE = isSerticAdmin;

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">
          {isNTE ? "Administração da Feira Regional" : "Painel Administrativo"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isNTE ? "Configure e gerencie todos os aspectos da sua Feira Regional" : "Gerenciamento do evento"}
        </p>
      </div>

      <Tabs defaultValue={isNTE ? "regional" : "state-fair"} className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50 p-1 rounded-xl mb-6">
          {isNTE ? (
            <TabsTrigger value="regional" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
              <Building2 className="w-4 h-4" /> Minha Regional
            </TabsTrigger>
          ) : (
            <>
              <TabsTrigger value="state-fair" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                <Award className="w-4 h-4" /> Feira Estadual
              </TabsTrigger>
              <TabsTrigger value="sertics" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                <Building2 className="w-4 h-4" /> SERTICs
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <Layers className="w-4 h-4" /> Categorias
          </TabsTrigger>
          <TabsTrigger value="criteria" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <ClipboardCheck className="w-4 h-4" /> Critérios
          </TabsTrigger>
          <TabsTrigger value="certificates" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
            <FileText className="w-4 h-4" /> Certificados
          </TabsTrigger>
        </TabsList>

        {!isNTE && <TabsContent value="state-fair"><StateFairSettings /></TabsContent>}
        <TabsContent value="regional"><RegionalSettings /></TabsContent>
        {!isNTE && <TabsContent value="sertics"><SERTICManager /></TabsContent>}
        <TabsContent value="categories"><CategoryManager /></TabsContent>
        <TabsContent value="criteria"><CriteriaManager /></TabsContent>
        <TabsContent value="certificates"><CertificateManager /></TabsContent>
      </Tabs>
    </div>
  );
}