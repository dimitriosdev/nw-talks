"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import {
  getScheduleEntries,
  updateScheduleEntry,
  createScheduleEntry,
  initializeYear,
  getScheduleYears,
  getSpeakers,
  getTalks,
  getSettings,
  getConfirmedEntries,
  saveSpeaker,
} from "@/lib/firestore";
import { computeFreshness } from "@/lib/freshness";
import type {
  ScheduleEntry,
  Speaker,
  TalkWithFreshness,
  Settings,
  ScheduleStatus,
} from "@/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { format, parseISO } from "date-fns";
import { el, enUS } from "date-fns/locale";
import { useRouter, useSearchParams } from "next/navigation";
import { usePreferences } from "@/hooks/usePreferences";
import { getTranslations } from "@/lib/localization";
import { ScheduleEntryInlineEdit } from "./_components/ScheduleEntryInlineEdit";
import { ScheduleEntryCard } from "./_components/ScheduleEntryCard";
import { RedTalkOverrideDialog } from "./_components/RedTalkOverrideDialog";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function AdminSchedulePage() {
  // Scroll position preservation
  const scroll = useScrollPosition("adminScheduleScrollY");
  const { language } = usePreferences();
  const t = getTranslations(language);
  const [inlinePresentedViaZoom, setInlinePresentedViaZoom] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [freshTalks, setFreshTalks] = useState<TalkWithFreshness[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  /* --- inline edit state --- */
  const [inlineId, setInlineId] = useState<string | null>(null);

  // Speaker auto-suggest
  const [speakerQuery, setSpeakerQuery] = useState("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(
    null,
  );
  const [showSpeakerDropdown, setShowSpeakerDropdown] = useState(false);

  // New speaker inline creation
  const [creatingNewSpeaker, setCreatingNewSpeaker] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newCongregation, setNewCongregation] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Talk auto-suggest (standard + special)
  const [talkQuery, setTalkQuery] = useState("");
  const [selectedTalkId, setSelectedTalkId] = useState<number | null>(null);
  const [customTalkTitle, setCustomTalkTitle] = useState("");
  const [showTalkDropdown, setShowTalkDropdown] = useState(false);

  const [inlineConfirmed, setInlineConfirmed] = useState(false);
  const [inlineNotes, setInlineNotes] = useState("");

  /* --- year navigation --- */
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  /* --- add entry --- */
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState("");

  /* --- red-talk override --- */
  const [pendingRedOverride, setPendingRedOverride] = useState<{
    context: "inline" | "add";
    talkId: number;
    talkTitle: string;
  } | null>(null);

  /* --- delete confirm --- */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const speakerInputRef = useRef<HTMLInputElement>(null);
  const speakerDropdownRef = useRef<HTMLDivElement>(null);
  const talkInputRef = useRef<HTMLInputElement>(null);
  const talkDropdownRef = useRef<HTMLDivElement>(null);
  const deepLinkHandledRef = useRef(false);
  const pendingDeepLinkScrollIdRef = useRef<string | null>(null);
  const yearSwipeStartXRef = useRef<number | null>(null);

  const requestedEditId = searchParams.get("edit");
  const requestedYearParam = searchParams.get("year");
  const requestedYear = requestedYearParam ? Number(requestedYearParam) : null;
  const hasRequestedYear =
    Number.isInteger(requestedYear) && requestedYear !== null;

  /* ---------------------------------------------------------------- */
  /*  Data loading                                                     */
  /* ---------------------------------------------------------------- */
  const load = useCallback(async () => {
    setLoading(true);
    const [s, sp, t, conf, sett, years] = await Promise.all([
      getScheduleEntries(selectedYear),
      getSpeakers(),
      getTalks(),
      getConfirmedEntries(),
      getSettings(),
      getScheduleYears(),
    ]);
    setEntries(s);
    setSpeakers(sp);
    if (sett && !settings && !hasRequestedYear)
      setSelectedYear(sett.activeYear);
    setSettings(sett);
    setFreshTalks(computeFreshness(t, conf, sp));
    setAvailableYears(years);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, hasRequestedYear]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (hasRequestedYear && requestedYear !== selectedYear) {
      setSelectedYear(requestedYear as number);
    }
  }, [hasRequestedYear, requestedYear, selectedYear]);

  const today = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear();

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );
  const hasTodayMarker = sortedEntries.some((entry) => entry.date >= today);

  // Hide years before 2023 unless data actually starts later.
  const earliestYear = useMemo(() => {
    const BASE_YEAR = 2023;
    const yearsFromData = availableYears.filter((year) => year >= BASE_YEAR);
    if (yearsFromData.length > 0) {
      return Math.min(...yearsFromData);
    }
    return BASE_YEAR;
  }, [availableYears]);

  const maxAllowedYear = (settings?.activeYear ?? currentYear) + 1;
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = earliestYear; year <= maxAllowedYear; year += 1) {
      years.push(year);
    }
    return years;
  }, [earliestYear, maxAllowedYear]);
  const canNavigateBack = selectedYear > earliestYear;
  const canNavigateForward = selectedYear < maxAllowedYear;

  const visibleYearOptions = useMemo(() => {
    if (yearOptions.length <= 3) return yearOptions;
    const selectedIdx = yearOptions.indexOf(selectedYear);
    if (selectedIdx <= 0) return yearOptions.slice(0, 3);
    if (selectedIdx >= yearOptions.length - 1)
      return yearOptions.slice(yearOptions.length - 3);
    return yearOptions.slice(selectedIdx - 1, selectedIdx + 2);
  }, [yearOptions, selectedYear]);

  useEffect(() => {
    if (selectedYear < earliestYear) {
      setSelectedYear(earliestYear);
      return;
    }
    if (selectedYear > maxAllowedYear) {
      setSelectedYear(maxAllowedYear);
    }
  }, [selectedYear, earliestYear, maxAllowedYear]);

  /* ---------------------------------------------------------------- */
  /*  Speaker autocomplete                                             */
  /* ---------------------------------------------------------------- */
  const speakerSuggestions = useMemo(() => {
    if (!speakerQuery.trim()) return speakers;
    const q = speakerQuery.toLowerCase();
    return speakers.filter(
      (s) =>
        s.lastName.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.congregation.toLowerCase().includes(q),
    );
  }, [speakers, speakerQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        speakerDropdownRef.current &&
        !speakerDropdownRef.current.contains(e.target as Node) &&
        speakerInputRef.current &&
        !speakerInputRef.current.contains(e.target as Node)
      ) {
        setShowSpeakerDropdown(false);
      }
      if (
        talkDropdownRef.current &&
        !talkDropdownRef.current.contains(e.target as Node) &&
        talkInputRef.current &&
        !talkInputRef.current.contains(e.target as Node)
      ) {
        setShowTalkDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectSpeaker = (s: Speaker) => {
    setSelectedSpeakerId(s.id);
    setSpeakerQuery(`${s.lastName} ${s.firstName}`);
    setShowSpeakerDropdown(false);
    setCreatingNewSpeaker(false);
  };

  const clearSpeaker = () => {
    setSelectedSpeakerId(null);
    setSpeakerQuery("");
    setCreatingNewSpeaker(false);
  };

  const startNewSpeaker = () => {
    setSelectedSpeakerId(null);
    setCreatingNewSpeaker(true);
    setShowSpeakerDropdown(false);
    const parts = speakerQuery.trim().split(/\s+/);
    setNewLastName(parts[0] ?? "");
    setNewFirstName(parts.slice(1).join(" ") ?? "");
    setNewCongregation("");
    setNewPhone("");
  };

  /* ---------------------------------------------------------------- */
  /*  Talk autocomplete                                                */
  /* ---------------------------------------------------------------- */
  const freshnessIcon = (level: string) =>
    level === "red" ? "🔴" : level === "orange" ? "🟠" : "🟢";

  const talkSuggestions = useMemo(() => {
    if (!talkQuery.trim()) return freshTalks.slice(0, 30);
    const q = talkQuery.toLowerCase();
    return freshTalks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        String(t.id).startsWith(q.replace("#", "")),
    );
  }, [freshTalks, talkQuery]);

  const selectTalk = (t: TalkWithFreshness) => {
    setSelectedTalkId(t.id);
    setCustomTalkTitle("");
    setTalkQuery(`#${t.id} — ${t.title}`);
    setShowTalkDropdown(false);
  };

  const clearTalk = () => {
    setSelectedTalkId(null);
    setCustomTalkTitle("");
    setTalkQuery("");
  };

  /** User commits a custom title (no standard talk selected) */
  const commitCustomTalk = () => {
    const trimmed = talkQuery.trim();
    if (trimmed && !selectedTalkId) {
      setCustomTalkTitle(trimmed);
    }
    setShowTalkDropdown(false);
  };

  /* ---------------------------------------------------------------- */
  /*  Inline edit helpers                                              */
  /* ---------------------------------------------------------------- */
  const [scrollAfterSaveId, setScrollAfterSaveId] = useState<string | null>(
    null,
  );
  const entryRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  const openInlineEdit = useCallback(
    (entry: ScheduleEntry) => {
      setConfirmDeleteId(null);
      scroll.save();
      setInlineId(entry.id);

      // Speaker
      const speaker = speakers.find((s) => s.id === entry.speakerId);
      setSelectedSpeakerId(entry.speakerId);
      setSpeakerQuery(
        speaker ? `${speaker.lastName} ${speaker.firstName}` : "",
      );
      setCreatingNewSpeaker(false);
      setNewFirstName("");
      setNewLastName("");
      setNewCongregation("");
      setNewPhone("");

      // Talk — restore from standard or custom
      const talk = freshTalks.find((t) => t.id === entry.talkId);
      setSelectedTalkId(entry.talkId);
      if (talk) {
        setTalkQuery(`#${talk.id} — ${talk.title}`);
        setCustomTalkTitle("");
      } else if (entry.customTalkTitle) {
        setTalkQuery(entry.customTalkTitle);
        setCustomTalkTitle(entry.customTalkTitle);
      } else {
        setTalkQuery("");
        setCustomTalkTitle("");
      }

      setInlineConfirmed(entry.status === "confirmed");
      setInlineNotes(entry.notes);
      setInlinePresentedViaZoom(entry.presentedViaZoom ?? false);
      setShowSpeakerDropdown(false);
      setShowTalkDropdown(false);

      // Scroll to the entry element
      setTimeout(() => {
        const el =
          entryRefs.current[entry.id] ||
          document.getElementById(`schedule-entry-${entry.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 80);
    },
    [speakers, freshTalks, scroll],
  );

  const cancelInlineEdit = () => {
    setInlineId(null);
    setConfirmDeleteId(null);
    setCreatingNewSpeaker(false);
    setShowSpeakerDropdown(false);
    setShowTalkDropdown(false);
    scroll.restore();
  };

  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    if (!requestedEditId) return;
    if (loading) return;

    const target = entries.find((e) => e.id === requestedEditId);
    if (!target) return;

    pendingDeepLinkScrollIdRef.current = target.id;
    openInlineEdit(target);
    deepLinkHandledRef.current = true;
    router.replace("/admin/schedule", { scroll: false });
  }, [requestedEditId, loading, entries, router, openInlineEdit]);

  useEffect(() => {
    // Deep link scroll
    const targetId = pendingDeepLinkScrollIdRef.current;
    if (targetId && !loading) {
      const timeoutId = window.setTimeout(() => {
        const row = document.getElementById(`schedule-entry-${targetId}`);
        row?.scrollIntoView({ behavior: "smooth", block: "start" });
        pendingDeepLinkScrollIdRef.current = null;
      }, 80);
      return () => window.clearTimeout(timeoutId);
    }
    // Robust scroll to edited entry after save
    if (scrollAfterSaveId && !loading) {
      let attempts = 0;
      const maxAttempts = 20;
      const interval = 50;
      const scrollToEntry = () => {
        const ref = entryRefs.current[scrollAfterSaveId];
        if (ref) {
          ref.scrollIntoView({ behavior: "smooth", block: "center" });
          setScrollAfterSaveId(null);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(scrollToEntry, interval);
        } else {
          setScrollAfterSaveId(null);
        }
      };
      scrollToEntry();
    }
  }, [loading, entries, inlineId, scrollAfterSaveId]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */
  const meetingDayForYear = (year: number) =>
    settings?.meetingDays?.[String(year)] ?? settings?.meetingDay ?? "Sunday";

  const handleGenerateSchedule = async () => {
    setGenerating(true);
    const day = meetingDayForYear(selectedYear);
    const created = await initializeYear(selectedYear, day);
    toast(
      "success",
      `Δημιουργήθηκαν ${created} εγγραφές ${day} για το ${selectedYear}.`,
    );
    setGenerating(false);
    load();
  };

  const handleInlineSave = async (skipRedCheck = false) => {
    // Save scroll position before update (handled by scroll hook if needed)
    if (!inlineId) return;

    // Red-talk check on standard talks only
    if (!skipRedCheck && selectedTalkId) {
      const selTalk = freshTalks.find((t) => t.id === selectedTalkId);
      if (selTalk?.freshnessLevel === "red") {
        setPendingRedOverride({
          context: "inline",
          talkId: selTalk.id,
          talkTitle: selTalk.title,
        });
        return;
      }
    }

    let speakerId: string | null = selectedSpeakerId;

    // Create new speaker if needed
    if (creatingNewSpeaker) {
      if (!newLastName.trim()) {
        toast("error", "Το επώνυμο είναι υποχρεωτικό για νέο ομιλητή.");
        return;
      }
      speakerId = await saveSpeaker({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        congregation: newCongregation.trim(),
        phone: newPhone.trim(),
        availableTalks: selectedTalkId ? [selectedTalkId] : [],
      });
      toast(
        "success",
        `Δημιουργήθηκε ο ομιλητής ${newLastName} ${newFirstName}.`,
      );
    }

    const status: ScheduleStatus = inlineConfirmed ? "confirmed" : "open";

    // Standard talk or custom special talk
    const finalTalkId = selectedTalkId;
    const finalCustomTitle =
      !selectedTalkId && customTalkTitle ? customTalkTitle : "";

    await updateScheduleEntry(inlineId, {
      speakerId,
      talkId: finalTalkId,
      customTalkTitle: finalCustomTitle,
      status,
      notes: inlineNotes,
      presentedViaZoom: inlinePresentedViaZoom,
    });
    toast("success", "Η εγγραφή ενημερώθηκε.");
    setScrollAfterSaveId(inlineId);
    cancelInlineEdit();
    load();
  };

  const handleDeleteEntry = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    await updateScheduleEntry(id, {
      status: "open",
      notes: "",
      talkId: null,
      customTalkTitle: "",
      speakerId: null,
    });
    toast(
      "success",
      `Η εγγραφή για ${entry?.date ?? "άγνωστη ημερομηνία"} καθαρίστηκε.`,
    );
    setConfirmDeleteId(null);
    if (inlineId === id) cancelInlineEdit();
    load();
  };

  const handleAddEntry = async () => {
    if (!newEntryDate) {
      toast("error", "Η ημερομηνία είναι υποχρεωτική.");
      return;
    }
    await createScheduleEntry({
      date: newEntryDate,
      speakerId: null,
      talkId: null,
      customTalkTitle: "",
      status: "open",
      notes: "",
    });
    toast("success", `Προστέθηκε η ημερομηνία ${newEntryDate}.`);
    setShowAddEntry(false);
    setNewEntryDate("");
    load();
  };

  const goToSpeakerEditor = (speakerId: string | null, entryId: string) => {
    if (!speakerId) return;
    const params = new URLSearchParams();
    params.set("edit", speakerId);
    params.set("from", "schedule");
    params.set("entry", entryId);
    params.set("year", String(selectedYear));
    router.push(`/admin/speakers?${params.toString()}`);
  };

  /* ---------------------------------------------------------------- */
  /*  Shared styles                                                    */
  /* ---------------------------------------------------------------- */
  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-gray-700 dark:focus:border-blue-500";

  const selectedSpeaker = selectedSpeakerId
    ? (speakers.find((s) => s.id === selectedSpeakerId) ?? null)
    : null;
  const dateLocale = language === "el" ? el : enUS;
  const normalizeTel = (phone: string) => phone.replace(/[^+\d]/g, "");
  const normalizeWhatsApp = (phone: string) => phone.replace(/\D/g, "");

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Πρόγραμμα</h1>
        <button
          onClick={() => setShowAddEntry(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Year navigation */}
      <div className="space-y-2">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => canNavigateBack && setSelectedYear((y) => y - 1)}
              disabled={!canNavigateBack}
              className="rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Προηγούμενο έτος"
              title="Προηγούμενο έτος"
            >
              ←
            </button>

            <div
              className="flex w-[210px] items-center justify-center gap-1 overflow-hidden rounded-lg border border-gray-200 bg-white px-2 py-1 select-none dark:border-gray-700 dark:bg-gray-900"
              onTouchStart={(e) => {
                yearSwipeStartXRef.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                const startX = yearSwipeStartXRef.current;
                yearSwipeStartXRef.current = null;
                if (startX === null) return;

                const endX = e.changedTouches[0]?.clientX ?? startX;
                const deltaX = endX - startX;

                if (Math.abs(deltaX) < 40) return;
                if (deltaX > 0 && canNavigateBack) {
                  setSelectedYear((y) => y - 1);
                } else if (deltaX < 0 && canNavigateForward) {
                  setSelectedYear((y) => y + 1);
                }
              }}
            >
              {visibleYearOptions.map((year) => {
                const isActive = year === selectedYear;
                const isConfiguredActive = settings?.activeYear === year;

                return (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isConfiguredActive
                          ? "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                canNavigateForward && setSelectedYear((y) => y + 1)
              }
              disabled={!canNavigateForward}
              className="rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Επόμενο έτος"
              title="Επόμενο έτος"
            >
              →
            </button>
          </div>
        </div>
        {hasTodayMarker && (
          <div className="flex justify-center">
            <a
              href="#today-marker"
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm transition hover:border-blue-400 hover:bg-blue-100 hover:shadow-md active:scale-95 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/50"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              Σήμερα
            </a>
          </div>
        )}
      </div>

      {/* Add entry */}
      {showAddEntry && (
        <div className="rounded-xl border-2 border-blue-400 bg-blue-50/40 px-4 py-3 dark:border-blue-500 dark:bg-blue-950/30">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Νέα ημερομηνία
            </span>
            <button
              onClick={() => {
                setShowAddEntry(false);
                setNewEntryDate("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Ακύρωση
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newEntryDate}
              onChange={(e) => setNewEntryDate(e.target.value)}
              className={inputCls}
              autoFocus
            />
            <button
              onClick={() => handleAddEntry()}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Προσθήκη
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            Δεν υπάρχει πρόγραμμα για το {selectedYear}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Δημιούργησε όλες τις ημερομηνίες{" "}
            <strong>{meetingDayForYear(selectedYear)}</strong> για το έτος, ή
            πρόσθεσε μεμονωμένες ημερομηνίες πιο πάνω.
          </p>
          <Button
            className="mt-4"
            onClick={handleGenerateSchedule}
            disabled={generating}
          >
            {generating
              ? "Δημιουργία..."
              : `Δημιουργία προγράμματος ${selectedYear}`}
          </Button>
        </div>
      )}

      {/* Schedule list */}
      <div className="space-y-1.5">
        {sortedEntries.map((entry, idx) => {
          const isPast = entry.date < today;
          const speaker = speakers.find((s) => s.id === entry.speakerId);
          const talk = freshTalks.find((t) => t.id === entry.talkId);
          const isEditing = inlineId === entry.id;
          const isCancelled = entry.status === "cancelled";

          const isFirstFuture =
            entry.date >= today &&
            (idx === 0 || sortedEntries[idx - 1].date < today);

          return (
            <div
              key={entry.id}
              ref={(el) => {
                entryRefs.current[entry.id] = el;
              }}
              className="scroll-mt-24"
            >
              {isFirstFuture && (
                <div
                  id="today-marker"
                  className="my-4 flex scroll-mt-24 items-center gap-3"
                >
                  <div className="h-px flex-1 bg-blue-400 dark:bg-blue-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Σήμερα
                  </span>
                  <div className="h-px flex-1 bg-blue-400 dark:bg-blue-600" />
                </div>
              )}

              <div className={isPast && !isEditing ? "opacity-85" : ""}>
                {isEditing ? (
                  <ScheduleEntryInlineEdit
                    entry={entry}
                    dateLocale={dateLocale}
                    inputCls={inputCls}
                    confirmDeleteId={confirmDeleteId}
                    onSetConfirmDeleteId={setConfirmDeleteId}
                    onDelete={handleDeleteEntry}
                    onCancel={cancelInlineEdit}
                    onSave={handleInlineSave}
                    speakerQuery={speakerQuery}
                    setSpeakerQuery={setSpeakerQuery}
                    selectedSpeakerId={selectedSpeakerId}
                    setSelectedSpeakerId={setSelectedSpeakerId}
                    showSpeakerDropdown={showSpeakerDropdown}
                    setShowSpeakerDropdown={setShowSpeakerDropdown}
                    speakerSuggestions={speakerSuggestions}
                    selectedSpeaker={selectedSpeaker}
                    speakerInputRef={speakerInputRef}
                    speakerDropdownRef={speakerDropdownRef}
                    onSelectSpeaker={selectSpeaker}
                    onClearSpeaker={clearSpeaker}
                    onStartNewSpeaker={startNewSpeaker}
                    goToSpeakerEditor={goToSpeakerEditor}
                    normalizeTel={normalizeTel}
                    normalizeWhatsApp={normalizeWhatsApp}
                    creatingNewSpeaker={creatingNewSpeaker}
                    setCreatingNewSpeaker={setCreatingNewSpeaker}
                    newFirstName={newFirstName}
                    setNewFirstName={setNewFirstName}
                    newLastName={newLastName}
                    setNewLastName={setNewLastName}
                    newCongregation={newCongregation}
                    setNewCongregation={setNewCongregation}
                    newPhone={newPhone}
                    setNewPhone={setNewPhone}
                    talkQuery={talkQuery}
                    setTalkQuery={setTalkQuery}
                    selectedTalkId={selectedTalkId}
                    setSelectedTalkId={setSelectedTalkId}
                    customTalkTitle={customTalkTitle}
                    setCustomTalkTitle={setCustomTalkTitle}
                    showTalkDropdown={showTalkDropdown}
                    setShowTalkDropdown={setShowTalkDropdown}
                    talkSuggestions={talkSuggestions}
                    talkInputRef={talkInputRef}
                    talkDropdownRef={talkDropdownRef}
                    onSelectTalk={selectTalk}
                    onClearTalk={clearTalk}
                    onCommitCustomTalk={commitCustomTalk}
                    freshnessIcon={freshnessIcon}
                    inlineConfirmed={inlineConfirmed}
                    setInlineConfirmed={setInlineConfirmed}
                    inlinePresentedViaZoom={inlinePresentedViaZoom}
                    setInlinePresentedViaZoom={setInlinePresentedViaZoom}
                    inlineNotes={inlineNotes}
                    setInlineNotes={setInlineNotes}
                    zoomLabel={t.status.zoom}
                    physicalLabel={t.status.physical}
                  />
                ) : (
                  <ScheduleEntryCard
                    entry={entry}
                    speaker={speaker}
                    talk={talk}
                    isCancelled={isCancelled}
                    isFirstFuture={isFirstFuture}
                    dateLocale={dateLocale}
                    zoomLabel={t.status.zoom}
                    physicalLabel={t.status.physical}
                    onEdit={() => openInlineEdit(entry)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <RedTalkOverrideDialog
        pendingRedOverride={pendingRedOverride}
        onCancel={() => setPendingRedOverride(null)}
        onConfirm={(ctx) => {
          setPendingRedOverride(null);
          if (ctx === "inline") {
            handleInlineSave(true);
          } else {
            handleAddEntry();
          }
        }}
      />
    </div>
  );
}
