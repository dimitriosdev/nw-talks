"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { getTalks, saveTalk, deleteTalk, importTalks } from "@/lib/firestore";
import type { Talk } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";

export default function AdminTalksPage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [newId, setNewId] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setTalks(await getTalks());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---- search ---- */
  const filtered = useMemo(() => {
    if (!search.trim()) return talks;
    const q = search.toLowerCase();
    const numQ = Number(search);
    return talks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        String(t.id).startsWith(search.trim()) ||
        (!isNaN(numQ) && t.id === numQ),
    );
  }, [talks, search]);

  /* ---- inline edit ---- */
  const openEdit = (t: Talk) => {
    if (editId === t.id) return;
    setAdding(false);
    setEditId(t.id);
    setEditTitle(t.title);
  };

  const closeEdit = () => {
    setEditId(null);
    setDeleting(null);
    setEditTitle("");
  };

  const saveEdit = async () => {
    if (editId === null || saving) return;
    if (!editTitle.trim()) {
      toast("error", "Title is required.");
      return;
    }
    setSaving(true);
    await saveTalk({ id: editId, title: editTitle.trim() });
    toast("success", "Talk updated.");
    setSaving(false);
    closeEdit();
    load();
  };

  /* ---- add new ---- */
  const openAdd = () => {
    setEditId(null);
    setDeleting(null);
    setNewId((talks.at(-1)?.id ?? 0) + 1);
    setNewTitle("");
    setAdding(true);
    setTimeout(() => addRef.current?.focus(), 50);
  };

  const closeAdd = () => setAdding(false);

  const saveNew = async () => {
    if (saving) return;
    if (!newTitle.trim()) {
      toast("error", "Title is required.");
      return;
    }
    if (talks.some((t) => t.id === newId)) {
      toast("error", `Talk #${newId} already exists.`);
      return;
    }
    setSaving(true);
    await saveTalk({ id: newId, title: newTitle.trim() });
    toast("success", "Talk added.");
    setSaving(false);
    closeAdd();
    load();
  };

  /* ---- delete ---- */
  const confirmDelete = async (id: number) => {
    if (saving) return;
    setSaving(true);
    await deleteTalk(id);
    toast("success", "Talk deleted.");
    setSaving(false);
    setDeleting(null);
    if (editId === id) closeEdit();
    load();
  };

  /* ---- import ---- */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let data: Talk[];

      if (file.name.endsWith(".json")) {
        data = JSON.parse(text);
      } else {
        const lines = text.split("\n").filter((l) => l.trim());
        const hasHeader =
          lines[0]?.toLowerCase().includes("id") &&
          lines[0]?.toLowerCase().includes("title");
        const start = hasHeader ? 1 : 0;
        data = lines.slice(start).map((line) => {
          const firstComma = line.indexOf(",");
          return {
            id: Number(line.slice(0, firstComma).trim()),
            title: line
              .slice(firstComma + 1)
              .trim()
              .replace(/^"|"$/g, ""),
          };
        });
      }

      if (!Array.isArray(data) || data.length === 0) {
        toast("error", "File is empty or invalid.");
        return;
      }

      await importTalks(data);
      toast("success", `Imported ${data.length} talks.`);
      load();
    } catch {
      toast("error", "Failed to parse file. Check format.");
    }

    if (fileRef.current) fileRef.current.value = "";
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
          Talks{" "}
          <span className="text-base font-normal text-gray-400">
            {talks.length}
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={handleImport}
          />
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
          placeholder="Search by number or title…"
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
              New Talk
            </span>
            <button
              onClick={closeAdd}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Esc to cancel
            </button>
          </div>
          <div className="flex gap-2" onKeyDown={handleAddKey}>
            <input
              type="number"
              value={newId}
              onChange={(e) => setNewId(Number(e.target.value))}
              className={`${inputCls} w-20 flex-shrink-0`}
              placeholder="#"
            />
            <input
              ref={addRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Talk title…"
              className={`${inputCls} flex-1`}
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
          {search ? "No talks match your search." : "No talks yet."}
        </p>
      )}

      {/* List */}
      <div className="space-y-1.5">
        {filtered.map((t) => {
          const isEditing = editId === t.id;

          if (isEditing) {
            return (
              <div key={t.id} className={editRowCls}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Editing #{t.id}
                  </span>
                  <button
                    onClick={closeEdit}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Esc to cancel
                  </button>
                </div>
                <div onKeyDown={handleEditKey}>
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Talk title…"
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {/* Delete */}
                  {deleting === t.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">
                        Delete this talk?
                      </span>
                      <button
                        onClick={() => confirmDelete(t.id)}
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
                      onClick={() => setDeleting(t.id)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Delete talk
                    </button>
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
            );
          }

          return (
            <div key={t.id} className={rowCls} onClick={() => openEdit(t)}>
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="flex-shrink-0 text-xs font-bold text-gray-300 dark:text-gray-600">
                    #{t.id}
                  </span>
                  <span className="truncate text-sm font-medium">
                    {t.title}
                  </span>
                </div>
                <svg
                  className="ml-2 h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:text-blue-400 dark:text-gray-600"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
