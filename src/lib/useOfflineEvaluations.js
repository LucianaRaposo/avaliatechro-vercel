import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "offline_evaluations";

function getOfflineEvaluations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveOfflineEvaluations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useOfflineEvaluations() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(() => getOfflineEvaluations().length);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(() => {
    setPendingCount(getOfflineEvaluations().length);
  }, []);

  const syncPending = useCallback(async () => {
    const pending = getOfflineEvaluations();
    if (pending.length === 0 || syncing) return;

    setSyncing(true);
    const failed = [];

    for (const item of pending) {
      try {
        const { _offlineId, _existingId, ...evaluationData } = item;
        if (_existingId) {
          await base44.entities.Evaluation.update(_existingId, evaluationData);
        } else {
          await base44.entities.Evaluation.create(evaluationData);
        }

        // Update project score
        const allEvals = await base44.entities.Evaluation.filter({ project_id: evaluationData.project_id });
        const avgScore = allEvals.reduce((s, e) => s + (e.weighted_average || 0), 0) / allEvals.length;
        await base44.entities.Project.update(evaluationData.project_id, {
          final_score: Math.round(avgScore * 100) / 100,
          evaluation_count: allEvals.length,
          status: "avaliado",
        });
      } catch {
        failed.push(item);
      }
    }

    saveOfflineEvaluations(failed);
    setPendingCount(failed.length);
    setSyncing(false);
    return pending.length - failed.length; // synced count
  }, [syncing]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPending();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPending]);

  const saveOffline = useCallback((evaluationData, existingId = null) => {
    const pending = getOfflineEvaluations();
    const offlineId = `offline_${Date.now()}`;
    // Remove any previous offline save for same project+evaluator
    const filtered = pending.filter(
      e => !(e.project_id === evaluationData.project_id && e.evaluator_id === evaluationData.evaluator_id)
    );
    filtered.push({ ...evaluationData, _offlineId: offlineId, _existingId: existingId, synced: false });
    saveOfflineEvaluations(filtered);
    setPendingCount(filtered.length);
  }, []);

  return { isOnline, pendingCount, syncing, saveOffline, syncPending, refreshCount };
}