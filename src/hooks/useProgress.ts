import { fetchResumeItems, type Enrollment, type ResumeItem } from "@/src/data/progress";
import type { Program, WorkoutSession } from "@/src/types";
import { useAuth } from "@/src/providers/AuthProvider";
import { useCallback, useEffect, useState } from "react";

export function useProgress() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [nextSession, setNextSession] = useState<WorkoutSession | null>(null);
  const [weeklyDone, setWeeklyDone] = useState(0);
  const [completedSessionIds, setCompletedSessionIds] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResumeItems(user?.id);
      setResume(data.resume);
      setEnrollments(data.enrollments);
      setCurrentProgram(data.currentProgram);
      setNextSession(data.nextSession);
      setWeeklyDone(data.weeklyDone);
      setCompletedSessionIds(data.completedSessionIds);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    loading,
    error,
    resume,
    enrollments,
    currentProgram,
    nextSession,
    weeklyDone,
    completedSessionIds,
    reload,
  };
}
