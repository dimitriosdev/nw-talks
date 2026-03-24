"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import {
  getTalks,
  saveTalk,
  deleteTalk,
  getScheduleEntries,
  getSpeakers,
} from "@/lib/firestore";
import { computeFreshness } from "@/lib/freshness";
import type { Talk, TalkWithFreshness, FreshnessLevel } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { TalkList } from "@/components/schedule/TalkList";

type TalkFilter = FreshnessLevel | "scheduled" | null;

export default function TalksPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { texts } = usePreferences();

  const [loading, setLoading] = useState(true);

  /* ---- admin state ---- */
  const [talks, setTalks] = useState<Talk[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPresentedViaZoom, setEditPresentedViaZoom] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newIdInput, setNewIdInput] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPresentedViaZoom, setNewPresentedViaZoom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const addRef = useRef<HTMLInputElement>(null);

  /* ---- public state ---- */
  const [freshTalks, setFreshTalks] = useState<TalkWithFreshness[]>([]);
  const [filter, setFilter] = useState<TalkFilter>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  /* ---- load ---- */
  const load = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    const [rawTalks, schedule, speakers] = await Promise.all([
      getTalks(),
      getScheduleEntries(),
      getSpeakers(),
    ]);
    setTalks(rawTalks);
    setFreshTalks(computeFreshness(rawTalks, schedule, speakers));
    setLoading(false);
  }, [authLoading]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---- admin: categories ---- */
  const adminCategories = useMemo(
    () => Array.from(new Set(talks.map((t) => t.category).filter(Boolean))),
    [talks],
  );

  /* ---- admin: edit ---- */
  const openEdit = (t: TalkWithFreshness) => {
    setEditPresentedViaZoom(t.presentedViaZoom ?? false);
    setAdding(false);
    setEditId(t.id);
    setEditTitle(t.title);
    setEditCategory(t.category ?? "");
  };

  const closeEdit = () => {
    setEditPresentedViaZoom(false);
    setEditId(null);
    setDeleting(null);
    setEditTitle("");
    setEditCategory("");
  };

  const saveEdit = async () => {
    if (editId === null || saving) return;
    if (!editTitle.trim()) {
      toast("error", "Ο τίτλος είναι υποχρεωτικός.");
      return;
    }
    setSaving(true);
    await saveTalk({
      id: editId,
      title: editTitle.trim(),
      category: editCategory.trim(),
      presentedViaZoom: editPresentedViaZoom,
    });
    toast("success", "Η ομιλία ενημερώθηκε.");
    setSaving(false);
    closeEdit();
    load();
  };

  /* ---- admin: add new ---- */
  const openAdd = () => {
    setNewPresentedViaZoom(false);
    setEditId(null);
    setDeleting(null);
    setNewIdInput("");
    setNewTitle("");
    setAdding(true);
    setTimeout(() => addRef.current?.focus(), 50);
  };

  const closeAdd = () => {
    setAdding(false);
    setNewPresentedViaZoom(false);
  };

  const normalizeTitle = (title: string) =>
    title.trim().replace(/\s+/g, " ").toLowerCase();

  const getNextAutoEventTalkId = () => {
    const used = new Set(talks.map((t) => t.id));
    for (let next = 999; next >= 1; next -= 1) {
      if (!used.has(next)) return next;
    }
    return null;
  };

  const saveNew = async () => {
    if (saving) return;
    if (!newTitle.trim()) {
      toast("error", "Ο τίτλος είναι υποχρεωτικός.");
      return;
    }
    const trimmedTitle = newTitle.trim();
    const normalizedNewTitle = normalizeTitle(trimmedTitle);
    if (talks.some((t) => normalizeTitle(t.title) === normalizedNewTitle)) {
      toast("error", `Ο τίτλος "${trimmedTitle}" υπάρχει ήδη.`);
      return;
    }
    const trimmedId = newIdInput.trim();
    let resolvedId: number;
    if (!trimmedId) {
      const autoId = getNextAutoEventTalkId();
      if (autoId === null) {
        toast("error", "Δεν υπάρχουν διαθέσιμα αυτόματα IDs (999 έως 1).");
        return;
      }
      resolvedId = autoId;
    } else {
      const parsedId = Number(trimmedId);
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        toast("error", "Το ID ομιλίας πρέπει να είναι θετικός ακέραιος.");
        return;
      }
      resolvedId = parsedId;
    }
    if (talks.some((t) => t.id === resolvedId)) {
      toast("error", `Η ομιλία #${resolvedId} υπάρχει ήδη.`);
      return;
    }
    setSaving(true);
    await saveTalk({
      id: resolvedId,
      title: trimmedTitle,
      category: newCategory.trim(),
      presentedViaZoom: newPresentedViaZoom,
    });
    toast("success", `Η ομιλία #${resolvedId} προστέθηκε.`);
    setSaving(false);
    closeAdd();
    load();
  };

  /* ---- admin: delete ---- */
  const confirmDelete = async (id: number) => {
    if (saving) return;
    setSaving(true);
    await deleteTalk(id);
    toast("success", "Η ομιλία διαγράφηκε.");
    setSaving(false);
    setDeleting(null);
    if (editId === id) closeEdit();
    load();
  };

  /* ---- admin: key handlers ---- */
  const handleEditKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) saveEdit();
    if (e.key === "Escape") closeEdit();
  };
  const handleAddKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) saveNew();
    if (e.key === "Escape") closeAdd();
  };

  /* ---- public: derived data ---- */
  const regularTalks = freshTalks.filter((t) => t.id < 900 || t.id > 999);
  const publicCategories = Array.from(
    new Set(regularTalks.map((t) => t.category)),
  ).filter(Boolean);
  const greenCount = regularTalks.filter(
    (t) => t.freshnessLevel === "green" && !t.isScheduledForFuture,
  ).length;
  const orangeCount = regularTalks.filter(
    (t) => t.freshnessLevel === "orange" && !t.isScheduledForFuture,
  ).length;
  const redCount = regularTalks.filter(
    (t) => t.freshnessLevel === "red" && !t.isScheduledForFuture,
  ).length;
  const scheduledCount = regularTalks.filter(
    (t) => t.isScheduledForFuture,
  ).length;
  const activeFilterLabel =
    filter === "green"
      ? texts.talks.freshness.greenLabel
      : filter === "orange"
        ? texts.talks.freshness.orangeLabel
        : filter === "red"
          ? texts.talks.freshness.redLabel
          : filter === "scheduled"
            ? texts.talks.scheduledLabel
            : texts.talks.allTalks;

  /* ---- public: pill button ---- */
  const pillBtn = (
    level: TalkFilter,
    label: string,
    count: number,
    dotCls: string,
    bgCls: string,
    activeBgCls: string,
  ) => {
    const isActive = level === null ? filter === null : filter === level;
    return (
      <button
        onClick={() =>
          setFilter(level === null ? null : isActive ? null : level)
        }
        className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold backdrop-blur transition-all ${
          isActive
            ? `${activeBgCls} ring-2 ring-white/60 shadow-lg scale-105`
            : `${bgCls} hover:scale-105 hover:brightness-125`
        }`}
        style={{ minHeight: "22px" }}
      >
        {dotCls && <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />}
        <span className="font-bold">{count}</span> {label}
      </button>
    );
  };

  /* ---- shared CSS ---- */
  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-gray-700 dark:focus:border-blue-500";
  const editRowCls =
    "rounded-xl border-2 border-blue-400 bg-blue-50/40 px-4 py-3 dark:border-blue-500 dark:bg-blue-950/30";

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const publicCategoryDropdown = (
    <select
      value={categoryFilter || ""}
      onChange={(e) => setCategoryFilter(e.target.value || null)}
      className="ml-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-400/20 text-blue-900 border border-blue-400/30 shadow-sm backdrop-blur transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 hover:bg-blue-400/30 hover:border-blue-400/50"
      style={{
        minHeight: "28px",
        minWidth: "120px",
        appearance: "none",
        boxShadow: "0 1px 4px 0 rgb(30 64 175 / 0.08)",
      }}
    >
      <option value="" className="bg-white text-blue-900">
        {texts.talks.allCategories || "All categories"}
      </option>
      {publicCategories.map((category) => (
        <option
          key={category}
          value={category}
          className="bg-white text-blue-900 font-semibold"
        >
          {category}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 py-6 text-white shadow-lg sm:px-8 sm:py-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {texts.talks.title}
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-blue-50 backdrop-blur transition hover:bg-white/25"
              aria-expanded={showGuide}
              aria-controls="talk-gallery-guide"
            >
              {showGuide ? texts.talks.hideGuide : texts.talks.showGuide}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={openAdd}
                className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-blue-50 backdrop-blur transition hover:bg-white/30"
                title="Προσθήκη νέας ομιλίας"
              >
                <svg
                  className="h-3.5 w-3.5"
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
                Νέα
              </button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="relative mt-2 flex flex-wrap items-center gap-0.5 text-xs">
          {pillBtn(
            null,
            texts.talks.talks,
            regularTalks.length,
            "",
            "bg-white/15 px-2 py-0.5",
            "bg-white/30 px-2 py-0.5",
          )}
          {pillBtn(
            "green",
            texts.talks.available,
            greenCount,
            "bg-emerald-400",
            "bg-emerald-400/20 px-2 py-0.5",
            "bg-emerald-400/40 px-2 py-0.5",
          )}
          {pillBtn(
            "orange",
            texts.talks.notRecommended,
            orangeCount,
            "bg-amber-400",
            "bg-amber-400/20 px-2 py-0.5",
            "bg-amber-400/40 px-2 py-0.5",
          )}
          {pillBtn(
            "red",
            texts.talks.tooRecent,
            redCount,
            "bg-red-400",
            "bg-red-400/20 px-2 py-0.5",
            "bg-red-400/40 px-2 py-0.5",
          )}
          {pillBtn(
            "scheduled",
            texts.talks.scheduled,
            scheduledCount,
            "bg-purple-400",
            "bg-purple-400/20 px-2 py-0.5",
            "bg-purple-400/40 px-2 py-0.5",
          )}
          {publicCategories.length > 0 && (
            <span className="text-xs text-blue-100 ml-2">
              {texts.talks.filterByCategory}
            </span>
          )}
          {publicCategories.length > 0 && publicCategoryDropdown}
        </div>

        <div className="relative mt-2 flex flex-wrap items-center gap-1 text-xs">
          <p className="rounded-full bg-white/10 px-2 py-0.5 text-blue-100">
            {texts.talks.showing}{" "}
            <span className="font-semibold text-white">
              {activeFilterLabel}
            </span>
            {categoryFilter && (
              <span className="ml-2 text-xs text-blue-200">
                · {categoryFilter}
              </span>
            )}
          </p>
        </div>

        {showGuide && (
          <div
            id="talk-gallery-guide"
            className="relative mt-3 rounded-xl bg-black/15 p-3 text-xs text-blue-100"
          >
            <p className="mb-2 text-blue-50">{texts.talks.clickGuide}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-blue-100">
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {texts.talks.greenGuide}
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                {texts.talks.orangeGuide}
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400" />
                {texts.talks.redGuide}
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-purple-400" />
                  {texts.talks.scheduledGuide}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Admin: add new talk form */}
      {isAdmin && adding && (
        <div className={editRowCls}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Νέα ομιλία
            </span>
            <button
              onClick={closeAdd}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Esc για ακύρωση
            </button>
          </div>
          <div
            className="grid grid-cols-[92px_minmax(0,1fr)_minmax(0,1fr)] gap-2"
            onKeyDown={handleAddKey}
          >
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                ID (προαιρετικό)
              </label>
              <input
                type="number"
                value={newIdInput}
                onChange={(e) => setNewIdInput(e.target.value)}
                className={inputCls}
                min={1}
                placeholder="Αυτόματο"
                title="Προαιρετικό. Αφήστε κενό για ειδικές καταχωρήσεις."
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Κατηγορία
              </label>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Κατηγορία ομιλίας"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Τίτλος (υποχρεωτικό)
              </label>
              <input
                ref={addRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Συνέλευση / Συνάθροιση / Τίτλος ομιλίας"
                className={inputCls}
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Το ID ομιλίας είναι προαιρετικό. Αφήστε το κενό για ειδικές
            καταχωρήσεις ώστε να δοθεί αυτόματα από το 999 προς τα κάτω.
          </p>
          <div className="mt-3 flex justify-end">
            <button
              onClick={saveNew}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Αποθήκευση..." : "Αποθήκευση"}
            </button>
          </div>
        </div>
      )}

      <TalkList
        talks={regularTalks}
        filter={filter}
        categoryFilter={categoryFilter}
        isAdmin={isAdmin}
        onEdit={openEdit}
      />

      {/* Admin: edit modal */}
      {isAdmin && editId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Επεξεργασία ομιλίας #{editId}
              </span>
              <button
                onClick={closeEdit}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                title="Κλείσιμο"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-3" onKeyDown={handleEditKey}>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Τίτλος
                </label>
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Τίτλος ομιλίας..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  Κατηγορία
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Επιλέξτε κατηγορία...</option>
                  {adminCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {deleting === editId ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500">
                    Διαγραφή αυτής της ομιλίας;
                  </span>
                  <button
                    onClick={() => confirmDelete(editId)}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Ναι, διαγραφή
                  </button>
                  <button
                    onClick={() => setDeleting(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Όχι
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleting(editId)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Διαγραφή ομιλίας"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Διαγραφή
                </button>
              )}
              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Αποθήκευση..." : "Αποθήκευση"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
