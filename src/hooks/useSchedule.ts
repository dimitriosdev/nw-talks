"use client";

import { useEffect, useState } from "react";
import { getScheduleEntries, getConfirmedEntries } from "@/lib/firestore";
import { getTalks } from "@/lib/firestore";
import { getSpeakers } from "@/lib/firestore";
import { computeFreshness } from "@/lib/freshness";
import type {
  ScheduleEntry,
  ScheduleEntryPopulated,
  Speaker,
  Talk,
  TalkWithFreshness,
} from "@/types";

/** Fetch schedule entries for a year and join with speakers & talks. */
export function useSchedule(year?: number) {
  const [entries, setEntries] = useState<ScheduleEntryPopulated[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [schedule, speakers, talks] = await Promise.all([
        getScheduleEntries(year),
        getSpeakers(),
        getTalks(),
      ]);

      const speakerMap = new Map(speakers.map((s) => [s.id, s]));
      const talkMap = new Map(talks.map((t) => [t.id, t]));

      const populated: ScheduleEntryPopulated[] = schedule.map((e) => ({
        ...e,
        speaker: e.speakerId ? (speakerMap.get(e.speakerId) ?? null) : null,
        talk: e.talkId ? (talkMap.get(e.talkId) ?? null) : null,
      }));

      if (!cancelled) {
        setEntries(populated);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year]);

  return { entries, loading };
}

/** Fetch talks with freshness info computed against confirmed schedule. */
export function useFreshTalks() {
  const [talks, setTalks] = useState<TalkWithFreshness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [allTalks, confirmed, speakers] = await Promise.all([
        getTalks(),
        getConfirmedEntries(),
        getSpeakers(),
      ]);
      const result = computeFreshness(allTalks, confirmed, speakers);
      if (!cancelled) {
        setTalks(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { talks, loading };
}
