import type { Language } from "@/lib/localization";

export interface TalkRetirementNotice {
  id: string;
  effectiveDate: string;
  talkIds: number[];
  summary: Record<Language, string>;
}

export const TALK_RETIREMENT_NOTICES: TalkRetirementNotice[] = [
  {
    id: "retired-public-talks-2026-09-01",
    effectiveDate: "2026-09-01",
    talkIds: [
      84, 85, 87, 92, 94, 97, 105, 106, 109, 117, 119, 120, 124, 126, 139, 141,
      144, 145, 148, 149, 151, 154, 155, 157, 158, 163, 164, 165, 167, 168,
    ],
    summary: {
      el: "Τα ακόλουθα 45λεπτα σχέδια δημόσιων ομιλιών έχουν καταργηθεί και δεν πρέπει να χρησιμοποιούνται μετά την",
      en: "The following 45-minute public talk outlines have been retired and must not be used after",
    },
  },
];

export function getTalkRetirementNotice(
  talkId: number,
): TalkRetirementNotice | null {
  let match: TalkRetirementNotice | null = null;

  for (const notice of TALK_RETIREMENT_NOTICES) {
    if (!notice.talkIds.includes(talkId)) {
      continue;
    }

    if (match === null || notice.effectiveDate < match.effectiveDate) {
      match = notice;
    }
  }

  return match;
}

export function isTalkRetiredForDate(talkId: number, date: string): boolean {
  const notice = getTalkRetirementNotice(talkId);
  return notice !== null && date >= notice.effectiveDate;
}
