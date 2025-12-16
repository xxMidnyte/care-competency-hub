// app/dashboard/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type NotificationPrefs = {
  overdueAlerts: boolean;
  dueSoonAlerts: boolean;
  newAssignmentAlerts: boolean;
  weeklySummary: boolean;
};

type AiPrefs = {
  aiSuggestionsEnabled: boolean;
  hidePhiInPrompts: boolean;
  showAiExplanationsToStaff: boolean;
  labsEnabled: boolean;
};

const card = "rounded-2xl border border-border bg-card shadow-card p-4";
const label =
  "block text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60";
const helper = "mt-1 text-xs text-foreground/60";
const input =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:border-transparent";
const inputReadOnly =
  "mt-1 w-full cursor-not-allowed rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground/60";
const primaryBtn =
  "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background";

export default function SettingsPage() {
  const [loadingUser, setLoadingUser] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [roleTitle, setRoleTitle] = useState("Manager");

  const [defaultFacility, setDefaultFacility] = useState("Auto-select");
  const [defaultDiscipline, setDefaultDiscipline] = useState("All disciplines");
  const [timezone, setTimezone] = useState("America/Chicago");

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    overdueAlerts: true,
    dueSoonAlerts: true,
    newAssignmentAlerts: true,
    weeklySummary: false,
  });

  const [aiPrefs, setAiPrefs] = useState<AiPrefs>({
    aiSuggestionsEnabled: true,
    hidePhiInPrompts: true,
    showAiExplanationsToStaff: false,
    labsEnabled: true,
  });

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email ?? null);
        const meta = (user.user_metadata || {}) as any;
        setDisplayName(
          meta.full_name || meta.name || user.email?.split("@")[0] || "Manager"
        );
        setRoleTitle(meta.role_title || "Manager");
      }

      setLoadingUser(false);
    }

    loadUser();
  }, []);

  const handleSave = () => {
    alert("Settings UI wired — persistence coming later 😎");
  };

  const toggleNotification = (key: keyof NotificationPrefs) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAiPref = (key: keyof AiPrefs) => {
    if (key === "hidePhiInPrompts" && aiPrefs.hidePhiInPrompts) {
      alert("For the MVP, PHI protection is always on. We can revisit this later.");
      return;
    }
    setAiPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="px-6 py-4 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Manage your account, defaults, and notification preferences for
            CareCompetencyHub.
          </p>
        </div>

        <button onClick={handleSave} className={primaryBtn}>
          Save changes
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1.2fr]">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Account */}
          <section className={card}>
            <h2 className="text-sm font-semibold text-foreground">
              Account &amp; identity
            </h2>
            <p className={helper}>
              These settings apply to you as a manager, regardless of which
              facility you&apos;re viewing.
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <label className={label}>Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={input}
                  placeholder="How your name appears in the app"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={label}>Role / title</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className={input}
                    placeholder="Ex: Clinical Manager, Rehab Director"
                  />
                </div>

                <div>
                  <label className={label}>Login email</label>
                  <input
                    type="text"
                    value={loadingUser ? "Loading…" : email ?? "Not available"}
                    readOnly
                    className={inputReadOnly}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Defaults */}
          <section className={card}>
            <h2 className="text-sm font-semibold text-foreground">
              Dashboard defaults
            </h2>
            <p className={helper}>
              Choose what you see by default when you open the manager
              dashboard.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
              <div>
                <label className={label}>Default facility</label>
                <select
                  value={defaultFacility}
                  onChange={(e) => setDefaultFacility(e.target.value)}
                  className={input}
                >
                  <option>Auto-select</option>
                  <option>CareCompetencyHub Demo – Home Health</option>
                  <option>CareCompetencyHub Demo – SNF</option>
                  <option>Last used facility</option>
                </select>
                <p className="mt-1 text-[11px] text-foreground/60">
                  Once we hook this to your real facilities list, this will
                  control which location loads first.
                </p>
              </div>

              <div>
                <label className={label}>Default discipline</label>
                <select
                  value={defaultDiscipline}
                  onChange={(e) => setDefaultDiscipline(e.target.value)}
                  className={input}
                >
                  <option>All disciplines</option>
                  <option>Nursing only</option>
                  <option>Therapy only</option>
                  <option>Speech only</option>
                </select>
              </div>

              <div>
                <label className={label}>Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={input}
                >
                  <option value="America/Chicago">Central (US)</option>
                  <option value="America/New_York">Eastern (US)</option>
                  <option value="America/Denver">Mountain (US)</option>
                  <option value="America/Los_Angeles">Pacific (US)</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Notifications */}
          <section className={card}>
            <h2 className="text-sm font-semibold text-foreground">
              Email notifications
            </h2>
            <p className={helper}>
              We&apos;ll never spam you — just the things that actually matter
              for your team.
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <ToggleRow
                label="Overdue competencies"
                description="Alert me when staff assigned to my facilities have overdue competencies."
                checked={notifications.overdueAlerts}
                onChange={() => toggleNotification("overdueAlerts")}
              />
              <ToggleRow
                label="Due this month"
                description="Alert me when items are coming due in the next 7 days."
                checked={notifications.dueSoonAlerts}
                onChange={() => toggleNotification("dueSoonAlerts")}
              />
              <ToggleRow
                label="New assignments"
                description="Notify me when new competencies or tracks are assigned to staff."
                checked={notifications.newAssignmentAlerts}
                onChange={() => toggleNotification("newAssignmentAlerts")}
              />
              <ToggleRow
                label="Weekly summary"
                description="Send a Monday morning summary of overdue and upcoming items."
                checked={notifications.weeklySummary}
                onChange={() => toggleNotification("weeklySummary")}
              />
            </div>
          </section>

          {/* AI & Labs */}
          <section className={card}>
            <h2 className="text-sm font-semibold text-foreground">
              AI &amp; privacy
            </h2>
            <p className={helper}>
              Control how AI features are used for your account. We never use
              these settings to override your organization&apos;s policies.
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <ToggleRow
                label="AI suggestions"
                description="Allow AI to suggest competencies, tracks, and learning objectives."
                checked={aiPrefs.aiSuggestionsEnabled}
                onChange={() => toggleAiPref("aiSuggestionsEnabled")}
              />
              <ToggleRow
                label="Hide PHI in prompts"
                description="Automatically strip names, MRNs, and obvious identifiers from AI prompts."
                checked={aiPrefs.hidePhiInPrompts}
                onChange={() => toggleAiPref("hidePhiInPrompts")}
              />
              <ToggleRow
                label="Show AI explanations to staff"
                description="Allow clinicians to see short AI explanations next to their assignments."
                checked={aiPrefs.showAiExplanationsToStaff}
                onChange={() => toggleAiPref("showAiExplanationsToStaff")}
              />
              <ToggleRow
                label="Enable labs / beta features"
                description="Early access to things we&apos;re still testing, like advanced tracks."
                checked={aiPrefs.labsEnabled}
                onChange={() => toggleAiPref("labsEnabled")}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/** Small toggle row component for cleanliness */
function ToggleRow(props: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  const { label, description, checked, onChange } = props;

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-foreground/60">{description}</p>
      </div>

      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border border-border transition ${
          checked ? "bg-primary/80" : "bg-muted"
        } focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ring)] focus:ring-offset-2 focus:ring-offset-background`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
