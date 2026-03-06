"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  getScheduleEntries,
  updateScheduleEntry,
  createScheduleEntry,
  initializeYear,
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
import { useRouter, useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function AdminSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [freshTalks, setFreshTalks] = useState<TalkWithFreshness[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

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
    const [s, sp, t, conf, sett] = await Promise.all([
      getScheduleEntries(selectedYear),
      getSpeakers(),
      getTalks(),
      getConfirmedEntries(),
      getSettings(),
    ]);
    setEntries(s);
    setSpeakers(sp);
    if (sett && !settings && !hasRequestedYear)
      setSelectedYear(sett.activeYear);
    setSettings(sett);
    setFreshTalks(computeFreshness(t, conf, sp));
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

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 320);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getFullYear();

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  );

  // Temporary test range: show years from 2020 to activeYear + 1.
  const earliestYear = 2020;

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
  const openInlineEdit = useCallback(
    (entry: ScheduleEntry) => {
      setConfirmDeleteId(null);
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
      setShowSpeakerDropdown(false);
      setShowTalkDropdown(false);
    },
    [speakers, freshTalks],
  );

  const cancelInlineEdit = () => {
    setInlineId(null);
    setConfirmDeleteId(null);
    setCreatingNewSpeaker(false);
    setShowSpeakerDropdown(false);
    setShowTalkDropdown(false);
  };

  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    if (!requestedEditId) return;
    if (loading) return;

    const target = entries.find((e) => e.id === requestedEditId);
    if (!target) return;

    openInlineEdit(target);
    deepLinkHandledRef.current = true;
    router.replace("/admin/schedule", { scroll: false });
  }, [requestedEditId, loading, entries, router, openInlineEdit]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */
  const meetingDayForYear = (year: number) =>
    settings?.meetingDays?.[String(year)] ?? settings?.meetingDay ?? "Sunday";

  const handleGenerateSchedule = async () => {
    setGenerating(true);
    const day = meetingDayForYear(selectedYear);
    const created = await initializeYear(selectedYear, day);
    toast("success", `Created ${created} ${day} entries for ${selectedYear}.`);
    setGenerating(false);
    load();
  };

  const handleInlineSave = async (skipRedCheck = false) => {
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
        toast("error", "Last name is required for a new speaker.");
        return;
      }
      speakerId = await saveSpeaker({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        congregation: newCongregation.trim(),
        phone: newPhone.trim(),
        availableTalks: selectedTalkId ? [selectedTalkId] : [],
      });
      toast("success", `Speaker ${newLastName} ${newFirstName} created.`);
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
    });
    toast("success", "Entry updated.");
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
    toast("success", `Emptied entry for ${entry?.date ?? "unknown"}.`);
    setConfirmDeleteId(null);
    if (inlineId === id) cancelInlineEdit();
    load();
  };

  const handleAddEntry = async () => {
    if (!newEntryDate) {
      toast("error", "Date is required.");
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
    toast("success", `Added ${newEntryDate}.`);
    setShowAddEntry(false);
    setNewEntryDate("");
    load();
  };

  /* ---------------------------------------------------------------- */
  /*  Shared styles                                                    */
  /* ---------------------------------------------------------------- */
  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-gray-700 dark:focus:border-blue-500";

  const selectedSpeaker = selectedSpeakerId
    ? (speakers.find((s) => s.id === selectedSpeakerId) ?? null)
    : null;
  const normalizeTel = (phone: string) => phone.replace(/[^+\d]/g, "");
  const normalizeWhatsApp = (phone: string) => phone.replace(/\D/g, "");
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        <h1 className="text-2xl font-bold">Schedule</h1>
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
              aria-label="Previous year"
              title="Previous year"
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
              aria-label="Next year"
              title="Next year"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Add entry */}
      {showAddEntry && (
        <div className="rounded-xl border-2 border-blue-400 bg-blue-50/40 px-4 py-3 dark:border-blue-500 dark:bg-blue-950/30">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              New Date
            </span>
            <button
              onClick={() => {
                setShowAddEntry(false);
                setNewEntryDate("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Cancel
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
              Add
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            No schedule for {selectedYear}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Generate all <strong>{meetingDayForYear(selectedYear)}</strong>{" "}
            dates for the year, or add individual dates above.
          </p>
          <Button
            className="mt-4"
            onClick={handleGenerateSchedule}
            disabled={generating}
          >
            {generating ? "Generating…" : `Generate ${selectedYear} Schedule`}
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
          const isConfirmed = entry.status === "confirmed";

          // Display: standard talk, custom special talk, or nothing
          const displayTitle = talk
            ? `#${talk.id} — ${talk.title}`
            : entry.customTalkTitle
              ? entry.customTalkTitle
              : "No talk assigned";
          const isSpecialTalk = !talk && !!entry.customTalkTitle;

          const isFirstFuture =
            entry.date >= today &&
            (idx === 0 || sortedEntries[idx - 1].date < today);

          return (
            <div key={entry.id}>
              {isFirstFuture && (
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-blue-400 dark:bg-blue-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Today
                  </span>
                  <div className="h-px flex-1 bg-blue-400 dark:bg-blue-600" />
                </div>
              )}

              <div className={isPast && !isEditing ? "opacity-60" : ""}>
                {isEditing ? (
                  /* ============== INLINE EDIT ============== */
                  <div className="rounded-xl border-2 border-blue-400 bg-blue-50/40 px-4 py-3 dark:border-blue-500 dark:bg-blue-950/30">
                    <div className="space-y-3">
                      {/* Header: date + clear/close actions */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-500">
                          {format(parseISO(entry.date), "EEEE, MMMM d, yyyy")}
                        </p>
                        <div className="flex items-center gap-2">
                          {confirmDeleteId === entry.id ? (
                            <>
                              <span className="text-xs text-red-500">
                                Clear this entry?
                              </span>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                              >
                                Clear now
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                Keep editing
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(entry.id)}
                              className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                              title="Clear speaker, talk and notes"
                            >
                              Clear entry
                            </button>
                          )}
                          <button
                            onClick={cancelInlineEdit}
                            className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            title="Close editor"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {/* Speaker — unified autocomplete */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Speaker
                        </label>
                        {!creatingNewSpeaker ? (
                          <div className="relative">
                            <input
                              ref={speakerInputRef}
                              type="text"
                              placeholder="Type to search speakers…"
                              value={speakerQuery}
                              onChange={(e) => {
                                setSpeakerQuery(e.target.value);
                                setSelectedSpeakerId(null);
                                setShowSpeakerDropdown(true);
                              }}
                              onFocus={() => setShowSpeakerDropdown(true)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  setShowSpeakerDropdown(false);
                                }
                              }}
                              className={inputCls}
                            />
                            {selectedSpeakerId && (
                              <button
                                onClick={clearSpeaker}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                title="Clear speaker"
                              >
                                ×
                              </button>
                            )}
                            {showSpeakerDropdown && (
                              <div
                                ref={speakerDropdownRef}
                                className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                              >
                                {speakerSuggestions.map((s) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => selectSpeaker(s)}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                                      selectedSpeakerId === s.id
                                        ? "bg-blue-50 dark:bg-blue-900/30"
                                        : ""
                                    }`}
                                  >
                                    <span>
                                      <span className="font-medium">
                                        {s.lastName}
                                      </span>{" "}
                                      <span className="text-gray-500">
                                        {s.firstName}
                                      </span>
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {s.congregation}
                                    </span>
                                  </button>
                                ))}
                                {/* Add new speaker option */}
                                <button
                                  type="button"
                                  onClick={startNewSpeaker}
                                  className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm text-blue-600 transition hover:bg-blue-50 dark:border-gray-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
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
                                  {speakerQuery.trim()
                                    ? `Add "${speakerQuery.trim()}" as new speaker`
                                    : "Add new speaker"}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* New speaker inline form */
                          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                New Speaker
                              </span>
                              <button
                                onClick={() => {
                                  setCreatingNewSpeaker(false);
                                  setSpeakerQuery("");
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                placeholder="Last name *"
                                value={newLastName}
                                onChange={(e) => setNewLastName(e.target.value)}
                                autoFocus
                                className={inputCls}
                              />
                              <input
                                placeholder="First name"
                                value={newFirstName}
                                onChange={(e) =>
                                  setNewFirstName(e.target.value)
                                }
                                className={inputCls}
                              />
                              <input
                                placeholder="Congregation"
                                value={newCongregation}
                                onChange={(e) =>
                                  setNewCongregation(e.target.value)
                                }
                                className={inputCls}
                              />
                              <input
                                placeholder="Phone"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                className={inputCls}
                              />
                            </div>
                          </div>
                        )}

                        {selectedSpeaker && !creatingNewSpeaker && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              Phone: {selectedSpeaker.phone || "Not available"}
                            </span>

                            {normalizeTel(selectedSpeaker.phone) && (
                              <a
                                href={`tel:${normalizeTel(selectedSpeaker.phone)}`}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
                                aria-label="Call speaker"
                                title="Call"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                              </a>
                            )}

                            {normalizeWhatsApp(selectedSpeaker.phone) && (
                              <a
                                href={`https://wa.me/${normalizeWhatsApp(selectedSpeaker.phone)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-700"
                                aria-label="Message speaker on WhatsApp"
                                title="WhatsApp"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M19.11 4.93A9.86 9.86 0 0 0 12.09 2a9.93 9.93 0 0 0-8.6 14.91L2 22l5.24-1.37A9.93 9.93 0 1 0 19.11 4.93zm-7.02 15.19a8.28 8.28 0 0 1-4.2-1.14l-.3-.18-3.11.81.83-3.03-.2-.31a8.3 8.3 0 1 1 6.98 3.85zm4.55-6.23c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.12-.56.12-.16.24-.64.79-.78.96-.14.16-.29.18-.54.06-.25-.12-1.06-.39-2.01-1.25-.74-.66-1.24-1.48-1.39-1.73-.14-.24-.02-.37.11-.49.11-.1.25-.27.37-.4.12-.14.16-.24.25-.4.08-.16.04-.3-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.41-.56-.42h-.48c-.16 0-.43.06-.65.3-.23.24-.87.85-.87 2.08s.89 2.41 1.01 2.58c.12.16 1.74 2.66 4.21 3.73.59.25 1.04.4 1.4.51.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.46-.28z" />
                                </svg>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Talk — unified autocomplete + custom title */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Talk
                        </label>
                        <div className="relative">
                          <input
                            ref={talkInputRef}
                            type="text"
                            placeholder="Search talks or type a special talk title…"
                            value={talkQuery}
                            onChange={(e) => {
                              setTalkQuery(e.target.value);
                              setSelectedTalkId(null);
                              setCustomTalkTitle("");
                              setShowTalkDropdown(true);
                            }}
                            onFocus={() => setShowTalkDropdown(true)}
                            onBlur={() => {
                              // Short delay so click on dropdown registers first
                              setTimeout(() => commitCustomTalk(), 150);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setShowTalkDropdown(false);
                              }
                              if (e.key === "Enter") {
                                commitCustomTalk();
                              }
                            }}
                            className={inputCls}
                          />
                          {(selectedTalkId || customTalkTitle || talkQuery) && (
                            <button
                              onClick={clearTalk}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              title="Clear talk"
                            >
                              ×
                            </button>
                          )}
                          {showTalkDropdown && (
                            <div
                              ref={talkDropdownRef}
                              className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                            >
                              {talkSuggestions.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => selectTalk(t)}
                                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                                    selectedTalkId === t.id
                                      ? "bg-blue-50 dark:bg-blue-900/30"
                                      : ""
                                  }`}
                                >
                                  <span>
                                    <span className="mr-1.5">
                                      {freshnessIcon(t.freshnessLevel)}
                                    </span>
                                    <span className="font-medium text-gray-500">
                                      #{t.id}
                                    </span>{" "}
                                    — {t.title}
                                  </span>
                                </button>
                              ))}
                              {talkSuggestions.length === 0 &&
                                talkQuery.trim() && (
                                  <div className="px-3 py-2 text-sm text-gray-400">
                                    No matching talks.
                                  </div>
                                )}
                              {/* Use as special talk option */}
                              {talkQuery.trim() && !selectedTalkId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomTalkTitle(talkQuery.trim());
                                    setSelectedTalkId(null);
                                    setShowTalkDropdown(false);
                                  }}
                                  className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm text-purple-600 transition hover:bg-purple-50 dark:border-gray-800 dark:text-purple-400 dark:hover:bg-purple-900/30"
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
                                  Use &ldquo;{talkQuery.trim()}&rdquo; as
                                  special talk
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Indicator for what's selected */}
                        {selectedTalkId && (
                          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                            Standard talk selected
                          </p>
                        )}
                        {!selectedTalkId && customTalkTitle && (
                          <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                            ✦ Special talk / event
                          </p>
                        )}
                      </div>

                      {/* Confirmed toggle */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={inlineConfirmed}
                          onClick={() => setInlineConfirmed(!inlineConfirmed)}
                          className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                            inlineConfirmed
                              ? "bg-emerald-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                              inlineConfirmed
                                ? "translate-x-4"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-sm font-medium ${
                            inlineConfirmed
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-400"
                          }`}
                        >
                          {inlineConfirmed
                            ? "✓ Confirmed"
                            : "Not yet confirmed"}
                        </span>
                      </div>

                      {/* Notes */}
                      <div>
                        <input
                          type="text"
                          value={inlineNotes}
                          onChange={(e) => setInlineNotes(e.target.value)}
                          placeholder="Notes (optional)…"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleInlineSave();
                            if (e.key === "Escape") cancelInlineEdit();
                          }}
                          className={inputCls}
                        />
                      </div>

                      {/* Save */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleInlineSave()}
                          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ============== DISPLAY MODE ============== */
                  <div
                    onClick={() => openInlineEdit(entry)}
                    className={`group rounded-xl border bg-white px-4 py-3 transition dark:bg-gray-900 ${
                      isCancelled
                        ? "cursor-pointer border-red-200 bg-red-50/40 hover:border-red-300 hover:shadow-sm dark:border-red-900 dark:bg-red-950/20 dark:hover:border-red-700"
                        : "cursor-pointer border-gray-200 hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-blue-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm text-gray-500">
                          {format(parseISO(entry.date), "EEEE, MMMM d, yyyy")}
                        </p>
                        {isCancelled ? (
                          <>
                            <p className="text-sm font-medium text-red-400 line-through">
                              {entry.notes || "Cancelled"}
                            </p>
                            <p className="text-xs text-red-500/80">
                              Click to re-enter this date
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">
                              {isSpecialTalk && (
                                <span
                                  className="mr-1.5 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
                                  title="Special talk / event"
                                >
                                  Special
                                </span>
                              )}
                              {displayTitle}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {speaker
                                ? `${speaker.lastName} ${speaker.firstName} (${speaker.congregation})`
                                : "No speaker assigned"}
                            </p>
                            {entry.notes && (
                              <p className="text-xs italic text-gray-400">
                                {entry.notes}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Right side: confirmed badge + quick actions */}
                      <div
                        className="flex shrink-0 flex-col items-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isCancelled ? (
                          <button
                            onClick={() => openInlineEdit(entry)}
                            className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600 transition hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
                            title="Re-enter this date"
                          >
                            ↺ Re-enter
                          </button>
                        ) : isConfirmed ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                            title="Confirmed"
                          >
                            ✓ Confirmed
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-400 dark:bg-gray-800"
                            title="Open"
                          >
                            ○ Open
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Red-talk override confirmation dialog */}
      {pendingRedOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-lg dark:bg-red-900/40">
                ⚠️
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Talk presented too recently
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>#{pendingRedOverride.talkId}</strong> &ldquo;
              {pendingRedOverride.talkTitle}&rdquo; was presented less than 6
              months ago. It is not recommended to schedule it again so soon.
            </p>
            <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
              Are you sure you want to override this rule?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setPendingRedOverride(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const ctx = pendingRedOverride.context;
                  setPendingRedOverride(null);
                  if (ctx === "inline") {
                    handleInlineSave(true);
                  } else {
                    handleAddEntry();
                  }
                }}
              >
                Override &amp; Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-blue-700"
          aria-label="Back to top"
          title="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
