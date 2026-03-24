"use client";

import { Button } from "@/components/ui/Button";

interface PendingRedOverride {
  context: "inline" | "add";
  talkId: number;
  talkTitle: string;
}

interface Props {
  pendingRedOverride: PendingRedOverride | null;
  onCancel: () => void;
  onConfirm: (context: "inline" | "add") => void;
}

export function RedTalkOverrideDialog({
  pendingRedOverride,
  onCancel,
  onConfirm,
}: Props) {
  if (!pendingRedOverride) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-lg dark:bg-red-900/40">
            ⚠️
          </span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Η ομιλία παρουσιάστηκε πολύ πρόσφατα
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>#{pendingRedOverride.talkId}</strong> &ldquo;
          {pendingRedOverride.talkTitle}&rdquo; παρουσιάστηκε πριν από λιγότερο
          από 6 μήνες. Δεν προτείνεται να προγραμματιστεί ξανά τόσο σύντομα.
        </p>
        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
          Είσαι σίγουρος/η ότι θέλεις να παρακάμψεις αυτόν τον κανόνα;
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Ακύρωση
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(pendingRedOverride.context)}
          >
            Παράκαμψη &amp; Αποθήκευση
          </Button>
        </div>
      </div>
    </div>
  );
}
