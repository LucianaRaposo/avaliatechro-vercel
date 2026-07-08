/**
 * useScope — Hook centralizado de escopo multi-tenant.
 *
 * EXPOCITEC (admin / admin_estadual): escopo global, vê e administra tudo.
 * SERTIC    (nte_coordenador)        : escopo restrito ao seu SERTIC, mas com
 *                                      poderes administrativos COMPLETOS dentro dele.
 *
 * Regra de uso:
 *   const { isAdmin, serticId, filterByScope, scopeLabel } = useScope();
 *
 *   - isAdmin      → true para ambos os perfis administrativos
 *   - isGlobal     → true apenas para EXPOCITEC (admin / admin_estadual)
 *   - isSerticAdmin→ true apenas para NTE Coordenador
 *   - serticId     → id do SERTIC do usuário (null se global)
 *   - filterByScope(items, field?) → filtra array pelo sertic_id quando necessário
 *   - applyScope(data)  → adiciona sertic_id ao objeto ao criar/salvar (se serticAdmin)
 *   - scopeLabel    → texto descritivo do escopo atual
 */

import { useAuth } from "@/lib/AuthContext";

const ADMIN_ROLES = ["admin", "admin_estadual", "nte_coordenador"];

export function useScope() {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin      = ADMIN_ROLES.includes(role);
  const isGlobal     = role === "admin" || role === "admin_estadual";
  const isSerticAdmin = role === "nte_coordenador";
  const serticId     = isSerticAdmin ? user?.sertic_id : null;

  /**
   * Filtra um array de objetos pelo sertic_id quando o usuário é NTE Coordenador.
   * @param {Array}  items  - Array a filtrar
   * @param {string} field  - Campo que contém o sertic_id (default: "sertic_id")
   */
  const filterByScope = (items, field = "sertic_id") => {
    if (!isSerticAdmin || !serticId) return items;
    return items.filter(item => item[field] === serticId);
  };

  /**
   * Adiciona sertic_id ao objeto de dados antes de criar/atualizar uma entidade,
   * garantindo que registros do NTE Coordenador sempre ficam no seu SERTIC.
   */
  const applyScope = (data) => {
    if (isSerticAdmin && serticId) {
      return { ...data, sertic_id: serticId };
    }
    return data;
  };

  const scopeLabel = isSerticAdmin
    ? "do seu SERTIC"
    : "estadual";

  return {
    isAdmin,
    isGlobal,
    isSerticAdmin,
    serticId,
    filterByScope,
    applyScope,
    scopeLabel,
    user,
    role,
  };
}