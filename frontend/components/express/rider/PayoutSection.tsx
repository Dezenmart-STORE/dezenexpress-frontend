"use client";

import { useState, useEffect, useCallback } from "react";
import { riderApi, PayoutAccount, RiderWithdrawal } from "@/lib/express/api";
import { AlertTriangleIcon, CheckCircleIcon } from "@/components/Icons";

const inputCls =
  "w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]";

// What each withdrawal status means for the rider (from the integration guide).
const WITHDRAWAL_LABELS: Record<string, { label: string; cls: string }> = {
  completed: { label: "Sent", cls: "bg-green-500/15 text-green-400" },
  processing: { label: "Processing", cls: "bg-blue-500/15 text-blue-400" },
  failed: { label: "Retrying", cls: "bg-amber-500/15 text-amber-400" },
  reversed: { label: "Returned to wallet", cls: "bg-[#222] text-[#aaa]" },
  pending: {
    label: "Awaiting Dezenmart",
    cls: "bg-amber-500/15 text-amber-400",
  },
  rejected: { label: "Rejected", cls: "bg-red-500/15 text-red-400" },
};

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PayoutSection({ refreshKey }: { refreshKey: number }) {
  // ── payout account ──
  const [account, setAccount] = useState<PayoutAccount | null | undefined>(
    undefined,
  ); // undefined = still loading
  const [editing, setEditing] = useState(false);
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  // ── withdrawals ──
  const [withdrawals, setWithdrawals] = useState<RiderWithdrawal[]>([]);
  const [wLoading, setWLoading] = useState(true);

  const loadAccount = useCallback(async () => {
    try {
      const res = await riderApi.getProfile();
      setAccount(res.data?.payoutAccount ?? null);
    } catch {
      setAccount(null);
    }
  }, []);

  const loadWithdrawals = useCallback(async () => {
    setWLoading(true);
    try {
      const res = await riderApi.getWithdrawals();
      setWithdrawals(res.data?.items ?? res.data?.withdrawals ?? []);
    } catch {
      setWithdrawals([]);
    } finally {
      setWLoading(false);
    }
  }, []);

  const loadBanks = useCallback(async () => {
    setBanksLoading(true);
    setBanksError(null);
    try {
      const res = await riderApi.getBanks();
      const list = [...(res.data?.banks ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      setBanks(list);
    } catch {
      // The bank provider can be slow (502/504) — let the rider retry.
      setBanksError("Couldn't load the bank list. Try again shortly.");
    } finally {
      setBanksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals, refreshKey]);

  useEffect(() => {
    if (editing && banks.length === 0) loadBanks();
  }, [editing, banks.length, loadBanks]);

  const save = async () => {
    if (!bankCode) return setError("Choose your bank");
    if (!/^\d{10}$/.test(accountNumber))
      return setError("Account number must be 10 digits");
    if (!password) return setError("Enter your password to confirm");
    setSaving(true);
    setError(null);
    try {
      const res = await riderApi.setPayoutAccount({
        bankCode,
        accountNumber,
        password,
      });
      const pa = res.data?.payoutAccount ?? null;
      setAccount(pa);
      setEditing(false);
      setPassword("");
      setAccountNumber("");
      setSaved(
        pa
          ? `Saved. The bank says this account belongs to “${pa.accountName}”. If that isn't you, change it now.`
          : "Saved.",
      );
    } catch (err) {
      // 401 "Incorrect password", 422 "Could not verify that bank account"
      setError(
        err instanceof Error ? err.message : "Could not save the account",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Payout account */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-semibold text-[#aaa]">
            Payout account
          </p>
          {!editing && account !== undefined && (
            <button
              onClick={() => {
                setEditing(true);
                setSaved(null);
                setError(null);
              }}
              className="text-[12px] text-[#ff2d2d] bg-transparent border-none cursor-pointer"
            >
              {account ? "Change" : "Set up"}
            </button>
          )}
        </div>

        {saved && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-[12px] text-green-400">
            <CheckCircleIcon
              size={13}
              color="currentColor"
              className="shrink-0 mt-0.5"
            />
            {saved}
          </div>
        )}

        {account === undefined ? (
          <div className="w-5 h-5 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
        ) : !editing ? (
          account ? (
            <div className="flex flex-col gap-0.5">
              <p className="text-[14px] text-[#e0e0e0] font-medium">
                {account.accountName}
              </p>
              <p className="text-[12px] text-[#555]">
                {account.bankName} · {account.accountNumberMasked}
              </p>
              <p className="text-[11px] text-green-400 mt-1">
                Withdrawals are sent here automatically.
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-[#555]">
              No payout account yet. Without one, withdrawals wait for Dezenmart
              staff to pay them by hand. Set one up to be paid automatically.
            </p>
          )
        ) : (
          <div className="flex flex-col gap-3">
            {banksError ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[12px] text-amber-400">
                <span className="flex items-center gap-2">
                  <AlertTriangleIcon size={13} color="currentColor" />
                  {banksError}
                </span>
                <button
                  onClick={loadBanks}
                  className="text-[12px] text-amber-300 bg-transparent border-none cursor-pointer underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                disabled={banksLoading}
                className={inputCls}
              >
                <option value="">
                  {banksLoading ? "Loading banks…" : "Choose your bank"}
                </option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <input
              type="tel"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit account number"
              className={inputCls}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your DezenExpress password"
              autoComplete="current-password"
              className={inputCls}
            />
            <p className="text-[10px] text-[#444]">
              We ask for your password so nobody with a stolen session can
              redirect your earnings.
            </p>
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
                <AlertTriangleIcon size={13} color="currentColor" />
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditing(false);
                  setError(null);
                  setPassword("");
                }}
                className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
              >
                {saving ? "Verifying account…" : "Save payout account"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawals */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e1e]">
          <p className="text-[12px] font-semibold text-[#aaa]">Withdrawals</p>
        </div>
        {wLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <p className="text-[12px] text-[#555] px-5 py-6">
            No withdrawals yet.
          </p>
        ) : (
          <div className="divide-y divide-[#1e1e1e]">
            {withdrawals.map((w, i) => {
              const meta = WITHDRAWAL_LABELS[w.status] ?? {
                label: w.status,
                cls: "bg-[#222] text-[#aaa]",
              };
              return (
                <div
                  key={w.id ?? w.withdrawalId ?? i}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] text-[#e0e0e0] font-semibold">
                      ₦{Number(w.amount).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#555] truncate">
                      {w.accountNumberMasked ?? ""}
                      {w.accountNumberMasked && w.createdAt ? " · " : ""}
                      {formatDate(w.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
