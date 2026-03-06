"use client";

import { useEffect, useState, useCallback } from "react";
import { getSettings, saveSettings, getScheduleYears } from "@/lib/firestore";
import type { Settings } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";

const currentYear = new Date().getFullYear();

const defaults: Settings = {
  activeYear: currentYear,
  meetingDay: "Sunday",
  meetingDays: {},
  localCongregation: "",
  adminEmails: [],
};

/** Get the meeting day for a given year from settings. */
function getDayForYear(
  year: number,
  settings: Settings,
): "Saturday" | "Sunday" {
  return settings.meetingDays?.[String(year)] ?? settings.meetingDay;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [dbYears, setDbYears] = useState<number[]>([]);
  const [showPastYears, setShowPastYears] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, years] = await Promise.all([getSettings(), getScheduleYears()]);
    if (s) setSettings(s);
    setDbYears(years);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings({
      ...settings,
      activeYear: new Date().getFullYear(),
      meetingDays: settings.meetingDays ?? {},
    });
    toast("success", "Settings saved.");
    setSaving(false);
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || settings.adminEmails.includes(email)) return;
    setSettings({
      ...settings,
      adminEmails: [...settings.adminEmails, email],
    });
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    setSettings({
      ...settings,
      adminEmails: settings.adminEmails.filter((e) => e !== email),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Weekend Meeting Day
            </label>
            <p className="mb-3 text-xs text-gray-500">
              Toggle the meeting day for each year. Default is Sunday.
            </p>

            {(() => {
              const nextYear = currentYear + 1;
              const pastYears = dbYears
                .filter((y) => y < currentYear)
                .sort((a, b) => b - a);

              const setDayForYear = (
                year: number,
                day: "Saturday" | "Sunday",
              ) => {
                const updated = {
                  ...settings.meetingDays,
                  [String(year)]: day,
                };
                setSettings({
                  ...settings,
                  meetingDays: updated,
                  ...(year === currentYear ? { meetingDay: day } : {}),
                });
              };

              const YearRow = ({
                year,
                badge,
              }: {
                year: number;
                badge?: string;
              }) => {
                const day = getDayForYear(year, settings);
                const isSunday = day === "Sunday";
                const isActive = year === currentYear;
                return (
                  <div
                    className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${
                      isActive
                        ? "border-2 border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                        : "border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{year}</span>
                      {isActive && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Active
                        </span>
                      )}
                      {badge && (
                        <span className="text-[10px] text-gray-400">
                          {badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium ${
                          !isSunday
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        Sat
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isSunday}
                        aria-label={`${year} meeting day`}
                        onClick={() =>
                          setDayForYear(year, isSunday ? "Saturday" : "Sunday")
                        }
                        className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                          isSunday
                            ? "bg-blue-600"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                            isSunday ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-xs font-medium ${
                          isSunday
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        Sun
                      </span>
                    </div>
                  </div>
                );
              };

              return (
                <div className="space-y-2">
                  <YearRow year={nextYear} badge="(next year)" />
                  <YearRow year={currentYear} />

                  {pastYears.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowPastYears(!showPastYears)}
                        className="mt-1 flex w-full items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <svg
                          className={`h-3.5 w-3.5 transition-transform ${
                            showPastYears ? "rotate-90" : ""
                          }`}
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
                        Past years ({pastYears.length})
                      </button>
                      {showPastYears && (
                        <div className="mt-2 space-y-2">
                          {pastYears.map((year) => (
                            <YearRow key={year} year={year} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Local Congregation
            </label>
            <input
              type="text"
              placeholder="e.g. Zürich"
              value={settings.localCongregation}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  localCongregation: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-500">
              Speakers whose congregation matches this name are considered
              local.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Admin Emails
            </label>
            <div className="mb-2 flex gap-2">
              <input
                type="email"
                placeholder="admin@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmail()}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              />
              <Button variant="secondary" onClick={addEmail}>
                Add
              </Button>
            </div>
            {settings.adminEmails.length === 0 && (
              <p className="text-xs text-gray-500">
                No admin emails configured. Add at least one to enable admin
                access.
              </p>
            )}
            <div className="space-y-1">
              {settings.adminEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm dark:bg-gray-800"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
