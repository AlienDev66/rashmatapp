import { ASSESSMENT_TOTAL } from "@/src/data/assessment";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/providers/AuthProvider";
import type { AssessmentAnswers } from "@/src/types/auth";
import type { Json } from "@/src/types/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const LOCAL_KEY = "rashmat.assessment.draft";

type Draft = {
  answers: AssessmentAnswers;
  currentStep: number;
};

function clampStep(step: number) {
  return Math.max(0, Math.min(step, ASSESSMENT_TOTAL - 1));
}

/**
 * Persists assessment progress locally always; syncs to Supabase when signed in.
 */
export function useAssessmentPersistence() {
  const { user, refreshProfile } = useAuth();
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [currentStep, setCurrentStep] = useState(0);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        if (user && isSupabaseConfigured) {
          const { data } = await supabase
            .from("assessment_responses")
            .select("answers, current_step, completed_at")
            .eq("user_id", user.id)
            .maybeSingle();

          if (data && !cancelled) {
            setAnswers((data.answers as AssessmentAnswers) ?? {});
            setCurrentStep(clampStep(data.current_step ?? 0));
            hydrated.current = true;
            setReady(true);
            return;
          }
        }

        const raw = await AsyncStorage.getItem(LOCAL_KEY);
        if (raw && !cancelled) {
          const draft = JSON.parse(raw) as Draft;
          setAnswers(draft.answers ?? {});
          setCurrentStep(clampStep(draft.currentStep ?? 0));
        }
      } finally {
        if (!cancelled) {
          hydrated.current = true;
          setReady(true);
        }
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const persist = useCallback(
    async (nextAnswers: AssessmentAnswers, nextStep: number, completed = false) => {
      const draft: Draft = { answers: nextAnswers, currentStep: nextStep };
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(draft));

      if (!user || !isSupabaseConfigured) return;

      await supabase.from("assessment_responses").upsert({
        user_id: user.id,
        answers: nextAnswers as Json,
        current_step: nextStep,
        completed_at: completed ? new Date().toISOString() : null,
      });

      if (completed) {
        await supabase
          .from("profiles")
          .update({ assessment_completed: true })
          .eq("id", user.id);
        await refreshProfile();
        await AsyncStorage.removeItem(LOCAL_KEY);
      }
    },
    [refreshProfile, user],
  );

  const updateAnswers = useCallback(
    (updater: (prev: AssessmentAnswers) => AssessmentAnswers) => {
      setAnswers((prev) => {
        const next = updater(prev);
        if (hydrated.current) void persist(next, currentStep);
        return next;
      });
    },
    [currentStep, persist],
  );

  const goToStep = useCallback(
    (step: number) => {
      const next = clampStep(step);
      setCurrentStep(next);
      if (hydrated.current) void persist(answers, next);
    },
    [answers, persist],
  );

  const complete = useCallback(async () => {
    await persist(answers, currentStep, true);
  }, [answers, currentStep, persist]);

  return {
    ready,
    answers,
    currentStep,
    setAnswers: updateAnswers,
    setCurrentStep: goToStep,
    complete,
  };
}
