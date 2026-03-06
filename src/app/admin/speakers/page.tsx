"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  getSpeakers,
  saveSpeaker,
  deleteSpeaker,
  getScheduleEntries,
  getTalks,
} from "@/lib/firestore";
import type { Speaker, ScheduleEntry, Talk } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { format, parseISO } from "date-fns";

const emptySpeaker: Omit<Speaker, "id"> = {
  firstName: "",
  lastName: "",
  congregation: "",
  phone: "",
  availableTalks: [],
};

/** Normalise phone to digits-only for tel: / WhatsApp links. */
function phoneDigits(phone: string) {
  return phone.replace(/[^+\d]/g, "");
}

/** A single past presentation record for a speaker. */
interface SpeakerHistory {
  date: string;
  talkId: number;
  talkTitle: string;
}

export default function AdminSpeakersPage() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [talkMap, setTalkMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Omit<Speaker, "id">>(emptySpeaker);
  const [adding, setAdding] = useState(false);
  const [newData, setNewData] = useState<Omit<Speaker, "id">>(emptySpeaker);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const addRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [sp, sch, talks] = await Promise.all([
      getSpeakers(),
      getScheduleEntries(),
      getTalks(),
    ]);
    setSpeakers(sp);
    setSchedule(sch);
    setTalkMap(new Map(talks.map((t) => [t.id, t.title])));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---- history map: speakerId → presentations (newest-first) ---- */
  const historyMap = useMemo(() => {
    const map = new Map<string, SpeakerHistory[]>();
    for (const e of schedule) {
      if (!e.speakerId || e.talkId === null || e.status !== "confirmed")
        continue;
      const list = map.get(e.speakerId) ?? [];
      list.push({
        date: e.date,
        talkId: e.talkId,
        talkTitle: talkMap.get(e.talkId) ?? `Talk #${e.talkId}`,
      });
      map.set(e.speakerId, list);
    }
    // sort each list newest-first
    for (const list of map.values()) {
      list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return map;
  }, [schedule, talkMap]);

  /* ---- search ---- */
  const filtered = useMemo(() => {
    if (!search.trim()) return speakers;
    const q = search.toLowerCase();
    return speakers.filter(
      (s) =>
        s.lastName.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.congregation.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.availableTalks.some((t) => String(t).includes(q)),
    );
  }, [speakers, search]);

  /* ---- inline edit ---- */
  const openEdit = (s: Speaker) => {
    if (editId === s.id) return;
    setAdding(false);
    setEditId(s.id);
    setEditData({
      firstName: s.firstName,
      lastName: s.lastName,
      congregation: s.congregation,
      phone: s.phone,
      availableTalks: s.availableTalks,
    });
  };

  const closeEdit = () => {
    setEditId(null);
    setDeleting(null);
  };

  const saveEdit = async () => {
    if (!editId || saving) return;
    if (!editData.lastName.trim()) {
      toast("error", "Last name is required.");
      return;
    }
    setSaving(true);
    await saveSpeaker({ id: editId, ...editData } as Speaker);
    toast("success", "Speaker updated.");
    setSaving(false);
    closeEdit();
    load();
  };

  /* ---- add new ---- */
  const openAdd = () => {
    setEditId(null);
    setDeleting(null);
    setNewData({ ...emptySpeaker });
    setAdding(true);
    setTimeout(() => addRef.current?.focus(), 50);
  };

  const closeAdd = () => setAdding(false);

  const saveNew = async () => {
    if (saving) return;
    if (!newData.lastName.trim()) {
      toast("error", "Last name is required.");
      return;
    }
    setSaving(true);
    await saveSpeaker(newData as Speaker);
    toast("success", "Speaker added.");
    setSaving(false);
    closeAdd();
    load();
  };

  /* ---- delete ---- */
  const confirmDelete = async (id: string) => {
    if (saving) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const futureRefs = schedule.filter(
      (e) => e.speakerId === id && e.date >= today,
    );
    if (futureRefs.length > 0) {
      toast(
        "error",
        `Cannot delete — assigned to ${futureRefs.length} future date(s).`,
      );
      setSaving(false);
      setDeleting(null);
      return;
    }
    await deleteSpeaker(id);
    toast("success", "Speaker deleted.");
    setSaving(false);
    setDeleting(null);
    if (editId === id) closeEdit();
    load();
  };

  /* ---- shared classes ---- */
  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-gray-700 dark:focus:border-blue-500";
  const rowCls =
    "group cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-600";
  const editRowCls =
    "rounded-xl border-2 border-blue-400 bg-blue-50/40 px-4 py-3 dark:border-blue-500 dark:bg-blue-950/30";

  /* ---- key handlers ---- */
  const handleEditKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) saveEdit();
    if (e.key === "Escape") closeEdit();
  };
  const handleAddKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) saveNew();
    if (e.key === "Escape") closeAdd();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Speakers{" "}
          <span className="text-base font-normal text-gray-400">
            {speakers.length}
          </span>
        </h1>
        <button
          onClick={openAdd}
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

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by name, congregation, phone, talk #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-blue-500"
        />
      </div>

      {/* Add row */}
      {adding && (
        <div className={editRowCls}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              New Speaker
            </span>
            <button
              onClick={closeAdd}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Esc to cancel
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2" onKeyDown={handleAddKey}>
            <input
              ref={addRef}
              placeholder="Last name *"
              value={newData.lastName}
              onChange={(e) =>
                setNewData({ ...newData, lastName: e.target.value })
              }
              className={inputCls}
            />
            <input
              placeholder="First name"
              value={newData.firstName}
              onChange={(e) =>
                setNewData({ ...newData, firstName: e.target.value })
              }
              className={inputCls}
            />
            <input
              placeholder="Congregation"
              value={newData.congregation}
              onChange={(e) =>
                setNewData({ ...newData, congregation: e.target.value })
              }
              className={inputCls}
            />
            <input
              placeholder="Phone"
              type="tel"
              value={newData.phone}
              onChange={(e) =>
                setNewData({ ...newData, phone: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div className="mt-2">
            <input
              placeholder="Available talk IDs (e.g. 1, 5, 12, 38)"
              value={(newData.availableTalks ?? []).join(", ")}
              onChange={(e) => {
                const ids = e.target.value
                  .split(",")
                  .map((s) => Number(s.trim()))
                  .filter((n) => !isNaN(n) && n > 0);
                setNewData({ ...newData, availableTalks: ids });
              }}
              onKeyDown={handleAddKey}
              className={inputCls}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={saveNew}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && !adding && (
        <p className="py-12 text-center text-sm text-gray-400">
          {search ? "No speakers match your search." : "No speakers yet."}
        </p>
      )}

      {/* List */}
      <div className="space-y-1.5">
        {filtered.map((s) => {
          const isEditing = editId === s.id;

          if (isEditing) {
            return (
              <div key={s.id} className={editRowCls}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Editing
                  </span>
                  <button
                    onClick={closeEdit}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Esc to cancel
                  </button>
                </div>
                <div
                  className="grid grid-cols-2 gap-2"
                  onKeyDown={handleEditKey}
                >
                  <input
                    autoFocus
                    placeholder="Last name *"
                    value={editData.lastName}
                    onChange={(e) =>
                      setEditData({ ...editData, lastName: e.target.value })
                    }
                    className={inputCls}
                  />
                  <input
                    placeholder="First name"
                    value={editData.firstName}
                    onChange={(e) =>
                      setEditData({ ...editData, firstName: e.target.value })
                    }
                    className={inputCls}
                  />
                  <input
                    placeholder="Congregation"
                    value={editData.congregation}
                    onChange={(e) =>
                      setEditData({ ...editData, congregation: e.target.value })
                    }
                    className={inputCls}
                  />
                  <input
                    placeholder="Phone"
                    type="tel"
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
                <div className="mt-2">
                  <input
                    placeholder="Available talk IDs (e.g. 1, 5, 12, 38)"
                    value={(editData.availableTalks ?? []).join(", ")}
                    onChange={(e) => {
                      const ids = e.target.value
                        .split(",")
                        .map((v) => Number(v.trim()))
                        .filter((n) => !isNaN(n) && n > 0);
                      setEditData({ ...editData, availableTalks: ids });
                    }}
                    onKeyDown={handleEditKey}
                    className={inputCls}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {/* Delete */}
                  {deleting === s.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">
                        Delete this speaker?
                      </span>
                      <button
                        onClick={() => confirmDelete(s.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setDeleting(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleting(s.id)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Delete speaker
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    {/* Phone actions in edit mode */}
                    {editData.phone && (
                      <>
                        <a
                          href={`tel:${phoneDigits(editData.phone)}`}
                          title="Call"
                          className="rounded-full p-1.5 text-gray-400 transition hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
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
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </a>
                        <a
                          href={`https://wa.me/${phoneDigits(editData.phone).replace(/^\+/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          className="rounded-full p-1.5 text-gray-400 transition hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      </>
                    )}
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
                {/* History in edit view */}
                {(historyMap.get(s.id)?.length ?? 0) > 0 && (
                  <div className="mt-3 border-t border-gray-200 pt-2 dark:border-gray-700">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      History ({historyMap.get(s.id)!.length})
                    </p>
                    <div className="max-h-40 space-y-0.5 overflow-y-auto">
                      {historyMap.get(s.id)!.map((h, i) => (
                        <div
                          key={`${h.date}-${i}`}
                          className="flex items-baseline gap-2 text-[11px] text-gray-500 dark:text-gray-400"
                        >
                          <span className="flex-shrink-0 font-mono text-gray-400 dark:text-gray-500">
                            {format(parseISO(h.date), "dd MMM yyyy")}
                          </span>
                          <span className="flex-shrink-0 text-gray-300 dark:text-gray-600">
                            #{h.talkId}
                          </span>
                          <span className="truncate">{h.talkTitle}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={s.id} className={rowCls} onClick={() => openEdit(s)}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">
                    {s.lastName}
                    {s.firstName && (
                      <span className="ml-1.5 font-normal text-gray-500">
                        {s.firstName}
                      </span>
                    )}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                    {s.congregation && <span>{s.congregation}</span>}
                    {s.availableTalks?.length > 0 && (
                      <span className="text-gray-300 dark:text-gray-600">
                        {s.availableTalks.length} talk
                        {s.availableTalks.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {(historyMap.get(s.id)?.length ?? 0) > 0 && (
                      <span className="text-gray-300 dark:text-gray-600">
                        {historyMap.get(s.id)!.length} presented
                      </span>
                    )}
                  </div>
                </div>
                {/* Phone action buttons */}
                {s.phone && (
                  <div
                    className="mr-2 flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={`tel:${phoneDigits(s.phone)}`}
                      title="Call"
                      className="rounded-full p-1.5 text-gray-400 transition hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
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
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </a>
                    <a
                      href={`https://wa.me/${phoneDigits(s.phone).replace(/^\+/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp"
                      className="rounded-full p-1.5 text-gray-400 transition hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  </div>
                )}
                <svg
                  className="h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:text-blue-400 dark:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              {/* Inline history toggle */}
              {(historyMap.get(s.id)?.length ?? 0) > 0 && (
                <div className="mt-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedHistory(
                        expandedHistory === s.id ? null : s.id,
                      );
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <svg
                      className={`h-3 w-3 transition-transform ${expandedHistory === s.id ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    History ({historyMap.get(s.id)!.length})
                  </button>
                  {expandedHistory === s.id && (
                    <div className="mt-1 max-h-40 space-y-0.5 overflow-y-auto pl-4">
                      {historyMap.get(s.id)!.map((h, i) => (
                        <div
                          key={`${h.date}-${i}`}
                          className="flex items-baseline gap-2 text-[11px] text-gray-500 dark:text-gray-400"
                        >
                          <span className="flex-shrink-0 font-mono text-gray-400 dark:text-gray-500">
                            {format(parseISO(h.date), "dd MMM yyyy")}
                          </span>
                          <span className="flex-shrink-0 text-gray-300 dark:text-gray-600">
                            #{h.talkId}
                          </span>
                          <span className="truncate">{h.talkTitle}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
