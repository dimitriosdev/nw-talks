"use client";

import { format, parseISO } from "date-fns";
import type { Locale } from "date-fns";
import type { Speaker, TalkWithFreshness, ScheduleEntry } from "@/types";

export interface InlineEditFormProps {
  entry: ScheduleEntry;
  dateLocale: Locale;
  inputCls: string;

  /* delete/cancel/save */
  confirmDeleteId: string | null;
  onSetConfirmDeleteId: (id: string | null) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  onSave: () => void;

  /* speaker autocomplete */
  speakerQuery: string;
  setSpeakerQuery: (q: string) => void;
  selectedSpeakerId: string | null;
  setSelectedSpeakerId: (id: string | null) => void;
  showSpeakerDropdown: boolean;
  setShowSpeakerDropdown: (show: boolean) => void;
  speakerSuggestions: Speaker[];
  selectedSpeaker: Speaker | null;
  speakerInputRef: React.RefObject<HTMLInputElement | null>;
  speakerDropdownRef: React.RefObject<HTMLDivElement | null>;
  onSelectSpeaker: (s: Speaker) => void;
  onClearSpeaker: () => void;
  onStartNewSpeaker: () => void;
  goToSpeakerEditor: (speakerId: string | null, entryId: string) => void;
  normalizeTel: (phone: string) => string;
  normalizeWhatsApp: (phone: string) => string;

  /* new speaker inline creation */
  creatingNewSpeaker: boolean;
  setCreatingNewSpeaker: (b: boolean) => void;
  newFirstName: string;
  setNewFirstName: (v: string) => void;
  newLastName: string;
  setNewLastName: (v: string) => void;
  newCongregation: string;
  setNewCongregation: (v: string) => void;
  newPhone: string;
  setNewPhone: (v: string) => void;

  /* talk autocomplete */
  talkQuery: string;
  setTalkQuery: (q: string) => void;
  selectedTalkId: number | null;
  setSelectedTalkId: (id: number | null) => void;
  customTalkTitle: string;
  setCustomTalkTitle: (v: string) => void;
  showTalkDropdown: boolean;
  setShowTalkDropdown: (show: boolean) => void;
  talkSuggestions: TalkWithFreshness[];
  talkInputRef: React.RefObject<HTMLInputElement | null>;
  talkDropdownRef: React.RefObject<HTMLDivElement | null>;
  onSelectTalk: (t: TalkWithFreshness) => void;
  onClearTalk: () => void;
  onCommitCustomTalk: () => void;
  freshnessIcon: (level: string) => string;

  /* toggles and notes */
  inlineConfirmed: boolean;
  setInlineConfirmed: (v: boolean) => void;
  inlinePresentedViaZoom: boolean;
  setInlinePresentedViaZoom: (v: boolean) => void;
  inlineNotes: string;
  setInlineNotes: (v: string) => void;

  /* localized labels */
  zoomLabel: string;
  physicalLabel: string;
}

export function ScheduleEntryInlineEdit({
  entry,
  dateLocale,
  inputCls,
  confirmDeleteId,
  onSetConfirmDeleteId,
  onDelete,
  onCancel,
  onSave,
  speakerQuery,
  setSpeakerQuery,
  selectedSpeakerId,
  setSelectedSpeakerId,
  showSpeakerDropdown,
  setShowSpeakerDropdown,
  speakerSuggestions,
  selectedSpeaker,
  speakerInputRef,
  speakerDropdownRef,
  onSelectSpeaker,
  onClearSpeaker,
  onStartNewSpeaker,
  goToSpeakerEditor,
  normalizeTel,
  normalizeWhatsApp,
  creatingNewSpeaker,
  setCreatingNewSpeaker,
  newFirstName,
  setNewFirstName,
  newLastName,
  setNewLastName,
  newCongregation,
  setNewCongregation,
  newPhone,
  setNewPhone,
  talkQuery,
  setTalkQuery,
  selectedTalkId,
  setSelectedTalkId,
  customTalkTitle,
  setCustomTalkTitle,
  showTalkDropdown,
  setShowTalkDropdown,
  talkSuggestions,
  talkInputRef,
  talkDropdownRef,
  onSelectTalk,
  onClearTalk,
  onCommitCustomTalk,
  freshnessIcon,
  inlineConfirmed,
  setInlineConfirmed,
  inlinePresentedViaZoom,
  setInlinePresentedViaZoom,
  inlineNotes,
  setInlineNotes,
  zoomLabel,
  physicalLabel,
}: InlineEditFormProps) {
  return (
    <div className="rounded-xl border-2 border-blue-400 bg-blue-50/40 px-4 py-3 dark:border-blue-500 dark:bg-blue-950/30">
      <div className="space-y-3">
        {/* Header: date + clear/close actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-500">
            {format(parseISO(entry.date), "EEEE, d MMMM yyyy", {
              locale: dateLocale,
            })}
          </p>
          <div className="flex items-center gap-2">
            {confirmDeleteId === entry.id ? (
              <>
                <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline h-4 w-4 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Να καθαριστεί αυτή η εγγραφή;
                </span>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 flex items-center gap-1 transition hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                  title="Οριστική διαγραφή εγγραφής"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Καθαρισμός τώρα
                </button>
                <button
                  onClick={() => onSetConfirmDeleteId(null)}
                  className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 flex items-center gap-1 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  title="Ακύρωση διαγραφής"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Συνέχεια επεξεργασίας
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSetConfirmDeleteId(entry.id)}
                  className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 flex items-center gap-1 transition hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  title="Καθαρισμός ομιλητή, ομιλίας και σημειώσεων"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Καθαρισμός εγγραφής
                </button>
                <button
                  onClick={onCancel}
                  className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 flex items-center gap-1 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  title="Κλείσιμο επεξεργασίας"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Κλείσιμο
                </button>
              </>
            )}
          </div>
        </div>

        {/* Speaker — unified autocomplete */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Ομιλητής
          </label>
          {!creatingNewSpeaker ? (
            <div className="relative">
              <input
                ref={speakerInputRef}
                type="text"
                placeholder="Πληκτρολόγησε για αναζήτηση ομιλητών..."
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
                  onClick={onClearSpeaker}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Καθαρισμός ομιλητή"
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
                      onClick={() => onSelectSpeaker(s)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                        selectedSpeakerId === s.id
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : ""
                      }`}
                    >
                      <span>
                        <span className="font-medium">{s.lastName}</span>{" "}
                        <span className="text-gray-500">{s.firstName}</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {s.congregation}
                      </span>
                    </button>
                  ))}
                  {/* Add new speaker option */}
                  <button
                    type="button"
                    onClick={onStartNewSpeaker}
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
                      ? `Προσθήκη του "${speakerQuery.trim()}" ως νέου ομιλητή`
                      : "Προσθήκη νέου ομιλητή"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* New speaker inline form */
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-950">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Νέος ομιλητής
                </span>
                <button
                  onClick={() => {
                    setCreatingNewSpeaker(false);
                    setSpeakerQuery("");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Ακύρωση
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Επώνυμο *"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  autoFocus
                  className={inputCls}
                />
                <input
                  placeholder="Όνομα"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Εκκλησία"
                  value={newCongregation}
                  onChange={(e) => setNewCongregation(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Τηλέφωνο"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {selectedSpeaker && !creatingNewSpeaker && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Τηλέφωνο: {selectedSpeaker.phone || "Μη διαθέσιμο"}</span>

              <button
                type="button"
                onClick={() => goToSpeakerEditor(selectedSpeaker.id, entry.id)}
                className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                title="Άνοιγμα επεξεργασίας προφίλ ομιλητή"
              >
                Επεξεργασία στοιχείων
              </button>

              {normalizeTel(selectedSpeaker.phone) && (
                <a
                  href={`tel:${normalizeTel(selectedSpeaker.phone)}`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
                  aria-label="Κλήση ομιλητή"
                  title="Κλήση"
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
                  aria-label="Μήνυμα σε ομιλητή στο WhatsApp"
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
            Ομιλία
          </label>
          <div className="relative">
            <input
              ref={talkInputRef}
              type="text"
              placeholder="Αναζήτηση ομιλιών ή πληκτρολόγηση τίτλου ειδικής ομιλίας..."
              value={talkQuery}
              onChange={(e) => {
                setTalkQuery(e.target.value);
                setSelectedTalkId(null);
                setCustomTalkTitle("");
                setShowTalkDropdown(true);
              }}
              onFocus={() => setShowTalkDropdown(true)}
              onBlur={() => {
                setTimeout(() => onCommitCustomTalk(), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowTalkDropdown(false);
                }
                if (e.key === "Enter") {
                  onCommitCustomTalk();
                }
              }}
              className={inputCls}
            />
            {(selectedTalkId || customTalkTitle || talkQuery) && (
              <button
                onClick={onClearTalk}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Καθαρισμός ομιλίας"
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
                    onClick={() => onSelectTalk(t)}
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
                      <span className="font-medium text-gray-500">#{t.id}</span>{" "}
                      — {t.title}
                    </span>
                  </button>
                ))}
                {talkSuggestions.length === 0 && talkQuery.trim() && (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Δεν βρέθηκαν αντίστοιχες ομιλίες.
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
                    Χρήση του &ldquo;{talkQuery.trim()}&rdquo; ως ειδική ομιλία
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Indicator for what's selected */}
          {selectedTalkId && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              Επιλέχθηκε κανονική ομιλία
            </p>
          )}
          {!selectedTalkId && customTalkTitle && (
            <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
              ✦ Ειδική ομιλία / εκδήλωση
            </p>
          )}
        </div>

        {/* Presented via Zoom toggle */}
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            role="switch"
            aria-checked={inlinePresentedViaZoom}
            onClick={() => setInlinePresentedViaZoom(!inlinePresentedViaZoom)}
            className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${inlinePresentedViaZoom ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${inlinePresentedViaZoom ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
          <span
            className={`text-sm font-medium ${inlinePresentedViaZoom ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
          >
            {inlinePresentedViaZoom ? zoomLabel : physicalLabel}
          </span>
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
                inlineConfirmed ? "translate-x-4" : "translate-x-0"
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
            {inlineConfirmed ? "✓ Επιβεβαιωμένο" : "Δεν έχει επιβεβαιωθεί"}
          </span>
        </div>

        {/* Notes */}
        <div>
          <input
            type="text"
            value={inlineNotes}
            onChange={(e) => setInlineNotes(e.target.value)}
            placeholder="Σημειώσεις (προαιρετικά)..."
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancel();
            }}
            className={inputCls}
          />
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={onSave}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Αποθήκευση
          </button>
        </div>
      </div>
    </div>
  );
}
