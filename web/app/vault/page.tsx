"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type StatusTone = "success" | "error" | "info";
type VaultCategory = "login" | "email" | "credit_card" | "id" | "medical";

interface StatusMessage {
  tone: StatusTone;
  message: string;
}

interface VaultEntry {
  id: number;
  name: string;
  username: string;
  category: VaultCategory;
  created_at: string;
}

interface VaultEntryDetail {
  id: number;
  name: string;
  category: VaultCategory;
  fields: Record<string, string>;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const TOKEN_STORAGE_KEY = "facepass-token";

const STATUS_TONE_STYLES: Record<StatusTone, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  error: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-200",
};

const CATEGORY_LABELS: Record<VaultCategory, string> = {
  login: "Login",
  email: "Email",
  credit_card: "Credit card",
  id: "Government ID",
  medical: "Medical record",
};

type FieldDefinition = {
  key: string;
  label: string;
  placeholder?: string;
  inputType?: "text" | "password" | "email" | "textarea";
  autoComplete?: string;
  optional?: boolean;
};

const CATEGORY_FIELD_CONFIG: Record<VaultCategory, FieldDefinition[]> = {
  login: [
    {
      key: "username",
      label: "Username",
      placeholder: "jane.doe",
      autoComplete: "username",
    },
    {
      key: "password",
      label: "Password",
      inputType: "password",
      placeholder: "••••••••",
      autoComplete: "current-password",
    },
  ],
  email: [
    {
      key: "email",
      label: "Email",
      inputType: "email",
      placeholder: "you@example.com",
      autoComplete: "email",
    },
    {
      key: "password",
      label: "Password",
      inputType: "password",
      placeholder: "Email password",
      autoComplete: "current-password",
    },
  ],
  credit_card: [
    {
      key: "cardholder_name",
      label: "Cardholder name",
      placeholder: "Jane Doe",
      autoComplete: "cc-name",
    },
    {
      key: "number",
      label: "Card number",
      placeholder: "4111 1111 1111 1111",
      autoComplete: "cc-number",
    },
    {
      key: "expiry_month",
      label: "Expiry month",
      placeholder: "08",
      autoComplete: "cc-exp-month",
    },
    {
      key: "expiry_year",
      label: "Expiry year",
      placeholder: "2028",
      autoComplete: "cc-exp-year",
    },
    {
      key: "cvv",
      label: "CVV",
      placeholder: "123",
      inputType: "password",
      autoComplete: "cc-csc",
    },
    {
      key: "network",
      label: "Network",
      placeholder: "Visa, Mastercard…",
      optional: true,
    },
  ],
  id: [
    {
      key: "document_type",
      label: "Document type",
      placeholder: "Passport",
    },
    {
      key: "id_number",
      label: "ID number",
      placeholder: "X1234567",
    },
    {
      key: "country",
      label: "Country",
      placeholder: "United States",
    },
    {
      key: "expiration_date",
      label: "Expiration date",
      placeholder: "2030-04-15",
      optional: true,
    },
  ],
  medical: [
    {
      key: "provider",
      label: "Provider",
      placeholder: "Blue Shield",
    },
    {
      key: "member_id",
      label: "Member ID",
      placeholder: "ABC123456",
    },
    {
      key: "plan_name",
      label: "Plan name",
      placeholder: "Gold PPO",
      optional: true,
    },
    {
      key: "group_number",
      label: "Group number",
      placeholder: "GRP-1234",
      optional: true,
    },
    {
      key: "notes",
      label: "Notes",
      placeholder: "Copay details, pharmacy info…",
      inputType: "textarea",
      optional: true,
    },
  ],
};

const PRIMARY_SECRET_KEYS: Record<VaultCategory, string | null> = {
  login: "password",
  email: "password",
  credit_card: "number",
  id: "id_number",
  medical: "member_id",
};

const getInitialFields = (category: VaultCategory): Record<string, string> => {
  const base: Record<string, string> = {};
  for (const field of CATEGORY_FIELD_CONFIG[category]) {
    base[field.key] = "";
  }
  return base;
};

const formatFieldsForDisplay = (
  category: VaultCategory,
  fields: Record<string, string>,
): string => {
  const config = CATEGORY_FIELD_CONFIG[category];
  const summary = config
    .map((field) => {
      const value = fields[field.key];
      if (!value) {
        return null;
      }
      return `${field.label}: ${value}`;
    })
    .filter(Boolean)
    .join(" • ");
  return summary || "Secret retrieved.";
};

export default function VaultPage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [savingVault, setSavingVault] = useState(false);
  const [vaultName, setVaultName] = useState("");
  const [vaultCategory, setVaultCategory] = useState<VaultCategory>("login");
  const [vaultFields, setVaultFields] = useState<Record<string, string>>(
    getInitialFields("login"),
  );

  const isAuthenticated = useMemo(() => Boolean(token), [token]);
  const categoryOptions = useMemo(
    () =>
      (Object.entries(CATEGORY_LABELS) as Array<[VaultCategory, string]>).map(
        ([value, label]) => ({ value, label }),
      ),
    [],
  );

  const parseErrorMessage = useCallback(async (response: Response) => {
    try {
      const data = await response.json();
      if (data?.detail) {
        if (typeof data.detail === "string") return data.detail;
        if (Array.isArray(data.detail)) {
          return data.detail
            .map(
              (item: Record<string, unknown>) =>
                (item.msg as string | undefined) ??
                (item.message as string | undefined) ??
                JSON.stringify(item),
            )
            .join(", ");
        }
        if (typeof data.detail === "object") {
          return (
            (data.detail.message as string | undefined) ??
            (data.detail.detail as string | undefined) ??
            JSON.stringify(data.detail)
          );
        }
      }
      return (
        (data?.message as string | undefined) ??
        response.statusText ??
        "Request failed"
      );
    } catch {
      return response.statusText || "Unexpected error";
    }
  }, []);

  const loadVaultEntries = useCallback(
    async (authToken: string) => {
      setVaultLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/vault`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!response.ok) {
          const errorMessage =
            (await parseErrorMessage(response)) ||
            "Unable to load saved items.";
          throw new Error(errorMessage);
        }
        const data = (await response.json()) as VaultEntry[];
        setEntries(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong while loading the vault.";
        setStatus({ tone: "error", message });
      } finally {
        setVaultLoading(false);
      }
    },
    [parseErrorMessage],
  );

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      router.replace("/auth");
      return;
    }
    setToken(storedToken);
    void loadVaultEntries(storedToken);
  }, [loadVaultEntries, router]);

  const handleCategoryChange = useCallback((next: VaultCategory) => {
    setVaultCategory(next);
    setVaultFields(getInitialFields(next));
    setStatus(null);
  }, []);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setVaultFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleVaultSave = useCallback(async () => {
    if (!token) {
      setStatus({ tone: "error", message: "Please log in again." });
      router.replace("/auth");
      return;
    }
    if (!vaultName.trim()) {
      setStatus({ tone: "error", message: "Label is required." });
      return;
    }
    const config = CATEGORY_FIELD_CONFIG[vaultCategory];
    const missing = config.find(
      (field) => !field.optional && !vaultFields[field.key]?.trim(),
    );
    if (missing) {
      setStatus({
        tone: "error",
        message: `${missing.label} is required for ${CATEGORY_LABELS[vaultCategory].toLowerCase()} entries.`,
      });
      return;
    }

    const sanitizedFields: Record<string, string> = {};
    for (const field of config) {
      const raw = vaultFields[field.key] ?? "";
      const trimmed = raw.trim();
      if (trimmed || !field.optional) {
        sanitizedFields[field.key] = trimmed;
      }
    }

    setSavingVault(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vault`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: vaultName.trim(),
          category: vaultCategory,
          fields: sanitizedFields,
        }),
      });
      if (!response.ok) {
        const errorMessage =
          (await parseErrorMessage(response)) ||
          "Unable to store the secret.";
        throw new Error(errorMessage);
      }
      setVaultName("");
      setVaultFields(getInitialFields(vaultCategory));
      await loadVaultEntries(token);
      setStatus({
        tone: "success",
        message: `${CATEGORY_LABELS[vaultCategory]} saved to your vault.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save the credential.";
      setStatus({ tone: "error", message });
    } finally {
      setSavingVault(false);
    }
  }, [
    loadVaultEntries,
    parseErrorMessage,
    router,
    token,
    vaultCategory,
    vaultFields,
    vaultName,
  ]);

  const handleReveal = useCallback(
    async (entryId: number) => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/vault/${entryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const message =
            (await parseErrorMessage(response)) ||
            "Unable to retrieve the secret.";
          throw new Error(message);
        }
        const data = (await response.json()) as VaultEntryDetail;
        const fields = data.fields ?? {};
        const category = data.category;
        const primaryKey = PRIMARY_SECRET_KEYS[category];
        if (primaryKey && fields[primaryKey]) {
          await navigator.clipboard
            .writeText(fields[primaryKey])
            .then(() => {
              setStatus({
                tone: "success",
                message: `Copied ${CATEGORY_LABELS[category].toLowerCase()} secret. ${formatFieldsForDisplay(category, fields)}`,
              });
            })
            .catch(() => {
              setStatus({
                tone: "info",
                message: formatFieldsForDisplay(category, fields),
              });
            });
        } else {
          setStatus({
            tone: "info",
            message: formatFieldsForDisplay(category, fields),
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not reveal the secret.";
        setStatus({ tone: "error", message });
      }
    },
    [parseErrorMessage, token],
  );

  const handleDelete = useCallback(
    async (entryId: number) => {
      if (!token) return;
      const confirmed = window.confirm(
        "Are you sure you want to delete this item?",
      );
      if (!confirmed) return;

      try {
        const response = await fetch(`${API_BASE_URL}/vault/${entryId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const message =
            (await parseErrorMessage(response)) ||
            "Failed to delete the secret.";
          throw new Error(message);
        }
        await loadVaultEntries(token);
        setStatus({ tone: "success", message: "Item deleted." });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to delete the item.";
        setStatus({ tone: "error", message });
      }
    },
    [loadVaultEntries, parseErrorMessage, token],
  );

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setEntries([]);
    router.replace("/auth");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm uppercase tracking-[0.35em] text-slate-400 transition hover:text-white"
          >
            FacePass
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-slate-700 px-4 py-2 transition hover:border-slate-500 hover:text-white"
            >
              Landing
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-700 px-4 py-2 transition hover:border-slate-500 hover:text-white"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Your encrypted vault
            </span>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Welcome back. Your secrets are safe.
            </h1>
            <p className="max-w-2xl text-sm text-slate-400 sm:text-base">
              Add credentials, reveal them securely, or purge anything that no
              longer belongs. Every entry stays encrypted at rest and only you
              can decrypt it with your token.
            </p>
          </div>

          {status && (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm sm:text-base ${STATUS_TONE_STYLES[status.tone]}`}
            >
              {status.message}
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-white">
                Store a credential
              </h2>
              <label className="block text-sm text-slate-300">
                Label
                <input
                  value={vaultName}
                  onChange={(event) => setVaultName(event.target.value)}
                  placeholder="Production database"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Category
                <select
                  value={vaultCategory}
                  onChange={(event) =>
                    handleCategoryChange(event.target.value as VaultCategory)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {CATEGORY_FIELD_CONFIG[vaultCategory].map((field) => (
                <label key={field.key} className="block text-sm text-slate-300">
                  {field.label}
                  {field.inputType === "textarea" ? (
                    <textarea
                      value={vaultFields[field.key] ?? ""}
                      onChange={(event) =>
                        handleFieldChange(field.key, event.target.value)
                      }
                      placeholder={field.placeholder}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                      rows={3}
                    />
                  ) : (
                    <input
                      value={vaultFields[field.key] ?? ""}
                      onChange={(event) =>
                        handleFieldChange(field.key, event.target.value)
                      }
                      placeholder={field.placeholder}
                      type={field.inputType === "password" ? "password" : field.inputType ?? "text"}
                      autoComplete={field.autoComplete}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    />
                  )}
                </label>
              ))}
              <button
                type="button"
                onClick={() => void handleVaultSave()}
                disabled={savingVault}
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {savingVault ? "Saving…" : "Save to vault"}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Saved credentials
                </h2>
                <button
                  type="button"
                  onClick={() => token && loadVaultEntries(token)}
                  className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 transition hover:text-slate-200"
                >
                  Refresh
                </button>
              </div>

              {!isAuthenticated ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                  Checking your session…
                </div>
              ) : vaultLoading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
                  Loading your vault…
                </div>
              ) : entries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                  No items yet. Save your first record on the left.
                </div>
              ) : (
                <ul className="space-y-3">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-white">
                            {entry.name}
                          </p>
                          <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                            {CATEGORY_LABELS[entry.category]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          {entry.username}
                        </p>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => void handleReveal(entry.id)}
                          className="flex-1 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-400/60 hover:text-white sm:flex-none"
                        >
                          Reveal
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(entry.id)}
                          className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-400/60 hover:text-white sm:flex-none"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
