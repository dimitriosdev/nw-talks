import { format, parseISO } from "date-fns";
import type { ScheduleEntryPopulated } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface ScheduleCardProps {
  entry: ScheduleEntryPopulated;
  /** Apply a blue highlight (used for the next upcoming talk). */
  highlight?: boolean;
  /** Show the status badge (admin only). Defaults to false. */
  showBadge?: boolean;
  /** Optional admin-only action opened by clicking the talk title. */
  onTitleClick?: () => void;
}

export function ScheduleCard({
  entry,
  highlight,
  showBadge = false,
  onTitleClick,
}: ScheduleCardProps) {
  const dateObj = parseISO(entry.date);
  const formattedDate = format(dateObj, "EEEE, MMMM d, yyyy");

  return (
    <Card
      className={
        highlight
          ? "!border-blue-400 !bg-blue-50 dark:!border-blue-600 dark:!bg-blue-950 ring-2 ring-blue-200 dark:ring-blue-800"
          : ""
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {formattedDate}
          </p>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className="rounded-sm text-left underline decoration-dotted underline-offset-2 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-300"
                title="Open in admin schedule"
              >
                {entry.talk
                  ? `#${entry.talk.id} — ${entry.talk.title}`
                  : entry.customTalkTitle
                    ? entry.customTalkTitle
                    : "—"}
              </button>
            ) : (
              <>
                {entry.talk
                  ? `#${entry.talk.id} — ${entry.talk.title}`
                  : entry.customTalkTitle
                    ? entry.customTalkTitle
                    : "—"}
              </>
            )}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {entry.speaker
              ? `${entry.speaker.lastName} ${entry.speaker.firstName} (${entry.speaker.congregation})`
              : "No speaker assigned"}
          </p>
          {entry.notes && (
            <p className="text-xs italic text-gray-400">{entry.notes}</p>
          )}
        </div>

        {showBadge && (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge status={entry.status} />
          </div>
        )}
      </div>
    </Card>
  );
}
