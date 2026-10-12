"use client";

import { useState, useEffect, useCallback } from "react";
import { useSidebar } from "./SidebarContext";
import { pricingApi, locationsApi, PricingRule, WeightTier } from "@/lib/api";
import { useExchangeRate } from "@/lib/hooks/useExchangeRate";
import {
  DollarIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  ToggleRightIcon,
  ToggleLeftIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshIcon,
  XIcon,
} from "@/components/Icons";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type DeliveryType = PricingRule["deliveryType"];

const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  intra_lga: "Intra LGA",
  inter_lga_same_state: "Inter LGA (Same State)",
  inter_state: "Inter State",
};

const DELIVERY_TYPE_COLORS: Record<DeliveryType, string> = {
  intra_lga: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  inter_lga_same_state: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  inter_state: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

/* ─── Small helpers ──────────────────────────────────────────────────────── */
function Label({ text }: { text: string }) {
  return (
    <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1">
      {text}
    </p>
  );
}

function FieldSelect({
  value,
  onChange,
  children,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0]
        focus:border-[#ff2d2d] focus:outline-none transition-colors
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-[#3a3a3a]"}`}
    >
      {children}
    </select>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min = 0,
}: {
  value: number | "";
  onChange: (v: number) => void;
  placeholder?: string;
  min?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) =>
        onChange(e.target.value === "" ? ("" as any) : Number(e.target.value))
      }
      placeholder={placeholder}
      className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-[#e0e0e0]
        focus:border-[#ff2d2d] focus:outline-none transition-colors hover:border-[#3a3a3a]"
    />
  );
}

/* ─── Dollar input with NGN equivalent ──────────────────────────────────── */
function UsdInput({
  value,
  onChange,
  placeholder = "0.00",
  label,
}: {
  value: number | "";
  onChange: (v: number) => void;
  placeholder?: string;
  label?: string;
}) {
  const { convert, loading } = useExchangeRate("USD", "NGN");
  const num = typeof value === "number" ? value : 0;
  const ngnVal = num > 0 ? convert(num) : null;

  return (
    <div>
      {label && <Label text={label} />}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#555] pointer-events-none select-none">
          $
        </span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value === "" ? ("" as any) : Number(e.target.value),
            )
          }
          placeholder={placeholder}
          className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg pl-7 pr-3 py-2.5 text-sm text-[#e0e0e0]
            focus:border-[#ff2d2d] focus:outline-none transition-colors hover:border-[#3a3a3a]
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <div className="h-4 mt-0.5 flex items-center">
        {loading && num > 0 && (
          <span className="text-[10px] text-[#444]">Loading rate...</span>
        )}
        {!loading && ngnVal !== null && num > 0 && (
          <span className="text-[10px] text-[#555]">
            ≈{" "}
            <span className="text-[#aaa] font-medium">
              ₦{ngnVal.toLocaleString("en-NG")}
            </span>
          </span>
        )}
        {!loading && num === 0 && (
          <span className="text-[10px] text-[#333]">Enter amount in USD</span>
        )}
      </div>
    </div>
  );
}

/* ─── Weight tier row ────────────────────────────────────────────────────── */
function WeightTierRow({
  tier,
  index,
  onChange,
  onRemove,
  isLast,
}: {
  tier: WeightTier;
  index: number;
  onChange: (t: WeightTier) => void;
  onRemove: () => void;
  isLast: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
      <div>
        {index === 0 && <Label text="Min (kg)" />}
        <NumberInput
          value={tier.minWeight}
          onChange={(v) => onChange({ ...tier, minWeight: v })}
          placeholder="0"
        />
      </div>
      <div>
        {index === 0 && <Label text="Max (kg)" />}
        <NumberInput
          value={tier.maxWeight}
          onChange={(v) => onChange({ ...tier, maxWeight: v })}
          placeholder="5"
        />
      </div>
      <div>
        {index === 0 && <Label text="Price (USD)" />}
        <UsdInput
          value={tier.price}
          onChange={(v) => onChange({ ...tier, price: v })}
          placeholder="10.00"
        />
      </div>
      <div className={index === 0 ? "mt-5" : "mt-6"}>
        <button
          onClick={onRemove}
          disabled={isLast}
          className="w-8 h-9 flex items-center justify-center text-[#555] hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer transition-colors"
        >
          <XIcon size={14} color="currentColor" />
        </button>
      </div>
    </div>
  );
}

/* ─── Blank rule ─────────────────────────────────────────────────────────── */
function blankRule(): Omit<PricingRule, "_id" | "providerId" | "isActive"> {
  return {
    deliveryType: "intra_lga",
    fromState: "",
    fromLga: "",
    toState: "",
    toLga: "",
    weightTiers: [{ minWeight: 0, maxWeight: 5, price: 0 }],
    insuranceFee: 0,
    packagingFee: 0,
    estimatedDaysMin: 1,
    estimatedDaysMax: 3,
  };
}

/* ─── Rule form modal ────────────────────────────────────────────────────── */
function RuleFormModal({
  rule,
  states,
  onClose,
  onSave,
  saving,
  error,
}: {
  rule: Omit<PricingRule, "_id" | "providerId" | "isActive"> & { _id?: string };
  states: string[];
  onClose: () => void;
  onSave: (r: typeof rule) => Promise<void>;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(rule);
  const [lgas, setLgas] = useState<{ from: string[]; to: string[] }>({
    from: [],
    to: [],
  });
  const isEdit = !!rule._id;

  const set = (patch: Partial<typeof form>) =>
    setForm((prev) => {
      const next = { ...prev, ...patch };
      // For intra_lga — to = from automatically
      if (next.deliveryType === "intra_lga") {
        next.toState = next.fromState;
        next.toLga = next.fromLga ?? "";
      }
      // For inter_lga_same_state — toState = fromState
      if (next.deliveryType === "inter_lga_same_state") {
        next.toState = next.fromState;
      }
      return next;
    });

  useEffect(() => {
    if (form.fromState)
      locationsApi
        .getLgas(form.fromState)
        .then((r) => setLgas((prev) => ({ ...prev, from: r.data.lgas })))
        .catch(() => {});
  }, [form.fromState]);

  useEffect(() => {
    if (form.toState)
      locationsApi
        .getLgas(form.toState)
        .then((r) => setLgas((prev) => ({ ...prev, to: r.data.lgas })))
        .catch(() => {});
  }, [form.toState]);

  const addTier = () =>
    set({
      weightTiers: [
        ...form.weightTiers,
        { minWeight: 0, maxWeight: 0, price: 0 },
      ],
    });
  const removeTier = (i: number) =>
    set({ weightTiers: form.weightTiers.filter((_, idx) => idx !== i) });
  const updateTier = (i: number, t: WeightTier) =>
    set({ weightTiers: form.weightTiers.map((x, idx) => (idx === i ? t : x)) });

  const showFromLga = form.deliveryType !== "inter_state";
  const showToState = form.deliveryType === "inter_state";
  const showToLga = form.deliveryType === "inter_lga_same_state";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] sticky top-0 bg-[#1a1a1a] z-10">
          <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
            {isEdit ? "Edit Pricing Rule" : "New Pricing Rule"}
          </h3>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer"
          >
            <XIcon size={18} color="currentColor" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-[12px] text-red-400">
              <AlertTriangleIcon size={13} color="currentColor" />
              {error}
            </div>
          )}

          {/* Delivery type */}
          <div>
            <Label text="Delivery Type" />
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DELIVERY_TYPE_LABELS) as DeliveryType[]).map(
                (dt) => (
                  <button
                    key={dt}
                    onClick={() => set({ deliveryType: dt })}
                    className={`px-2 py-2 rounded-xl text-[11px] font-semibold border cursor-pointer transition-all text-center
                    ${
                      form.deliveryType === dt
                        ? DELIVERY_TYPE_COLORS[dt]
                        : "bg-transparent border-[#2a2a2a] text-[#555] hover:border-[#444] hover:text-[#aaa]"
                    }`}
                  >
                    {DELIVERY_TYPE_LABELS[dt]}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label
                text={
                  form.deliveryType === "intra_lga" ? "State" : "From State"
                }
              />
              <FieldSelect
                value={form.fromState}
                onChange={(v) =>
                  set({ fromState: v, fromLga: "", toState: v, toLga: "" })
                }
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </FieldSelect>
            </div>

            {/* From LGA — for intra_lga and inter_lga_same_state */}
            {(form.deliveryType === "intra_lga" ||
              form.deliveryType === "inter_lga_same_state") && (
              <div>
                <Label text="From LGA" />
                <FieldSelect
                  value={form.fromLga ?? ""}
                  onChange={(v) => set({ fromLga: v })}
                  disabled={!form.fromState}
                >
                  <option value="">Select LGA</option>
                  {lgas.from.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </FieldSelect>
              </div>
            )}

            {/* To State — only for inter_state */}
            {form.deliveryType === "inter_state" && (
              <div>
                <Label text="To State" />
                <FieldSelect
                  value={form.toState}
                  onChange={(v) => set({ toState: v, toLga: "" })}
                >
                  <option value="">Select state</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </FieldSelect>
              </div>
            )}

            {/* To LGA — only for inter_lga_same_state */}
            {form.deliveryType === "inter_lga_same_state" && (
              <div>
                <Label text="To LGA" />
                <FieldSelect
                  value={form.toLga ?? ""}
                  onChange={(v) => set({ toLga: v })}
                  disabled={!form.fromState}
                >
                  <option value="">Select LGA</option>
                  {lgas.from.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </FieldSelect>
              </div>
            )}
          </div>

          {/* Weight tiers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label text="Weight Tiers" />
              <button
                onClick={addTier}
                className="flex items-center gap-1 text-[11px] text-[#ff2d2d] hover:opacity-75 bg-transparent border-none cursor-pointer transition-opacity"
              >
                <PlusIcon size={13} color="currentColor" /> Add tier
              </button>
            </div>
            <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-3 flex flex-col gap-3">
              {form.weightTiers.map((tier, i) => (
                <WeightTierRow
                  key={i}
                  tier={tier}
                  index={i}
                  onChange={(t) => updateTier(i, t)}
                  onRemove={() => removeTier(i)}
                  isLast={form.weightTiers.length === 1}
                />
              ))}
            </div>
          </div>

          {/* Fees */}
          <div className="grid grid-cols-2 gap-3">
            <UsdInput
              label="Insurance Fee (USD)"
              value={form.insuranceFee}
              onChange={(v) => set({ insuranceFee: v })}
              placeholder="2.00"
            />
            <UsdInput
              label="Packaging Fee (USD)"
              value={form.packagingFee}
              onChange={(v) => set({ packagingFee: v })}
              placeholder="1.00"
            />
          </div>

          {/* Estimated days */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label text="Min Days" />
              <NumberInput
                value={form.estimatedDaysMin}
                onChange={(v) => set({ estimatedDaysMin: v })}
                min={1}
                placeholder="1"
              />
            </div>
            <div>
              <Label text="Max Days" />
              <NumberInput
                value={form.estimatedDaysMax}
                onChange={(v) => set({ estimatedDaysMax: v })}
                min={1}
                placeholder="3"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444] hover:text-[#aaa] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={saving}
              className="flex-1 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              {saving ? "Saving..." : isEdit ? "Update Rule" : "Create Rule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Rule card ──────────────────────────────────────────────────────────── */
function RuleCard({
  rule,
  onEdit,
  onToggle,
  onDelete,
}: {
  rule: PricingRule;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { convert } = useExchangeRate("USD", "NGN");

  return (
    <div
      className={`bg-[#141414] border rounded-2xl p-4 flex flex-col gap-3 transition-all ${rule.isActive ? "border-[#222]" : "border-[#1a1a1a] opacity-60"}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border w-fit ${DELIVERY_TYPE_COLORS[rule.deliveryType]}`}
          >
            {DELIVERY_TYPE_LABELS[rule.deliveryType]}
          </span>
          <p className="text-[12px] text-[#555]">
            {rule.fromState}
            {rule.fromLga ? ` · ${rule.fromLga}` : ""}
            {rule.toState ? ` → ${rule.toState}` : ""}
            {rule.toLga ? ` · ${rule.toLga}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer transition-colors"
          >
            <EditIcon size={14} color="currentColor" />
          </button>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors"
            title={rule.isActive ? "Deactivate" : "Activate"}
          >
            {rule.isActive ? (
              <ToggleRightIcon size={20} color="#22c55e" />
            ) : (
              <ToggleLeftIcon size={20} color="#555" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-red-400 bg-transparent border-none cursor-pointer transition-colors"
          >
            <TrashIcon size={14} color="currentColor" />
          </button>
        </div>
      </div>

      {/* Weight tiers */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 px-3 py-1.5 border-b border-[#1e1e1e]">
          {["Min kg", "Max kg", "Price"].map((h) => (
            <span
              key={h}
              className="text-[10px] text-[#555] uppercase tracking-wider"
            >
              {h}
            </span>
          ))}
        </div>
        {rule.weightTiers.map((tier, i) => {
          const ngnPrice = convert(tier.price);
          return (
            <div
              key={i}
              className={`grid grid-cols-3 px-3 py-2 ${i > 0 ? "border-t border-[#1e1e1e]" : ""}`}
            >
              <span className="text-[12px] text-[#aaa]">
                {tier.minWeight} kg
              </span>
              <span className="text-[12px] text-[#aaa]">
                {tier.maxWeight} kg
              </span>
              <div>
                <span className="text-[12px] font-semibold text-[#e0e0e0]">
                  ${tier.price.toLocaleString()}
                </span>
                {ngnPrice && (
                  <span className="text-[10px] text-[#555] ml-1">
                    ≈ ₦{ngnPrice.toLocaleString("en-NG")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fees + days */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Insurance", value: rule.insuranceFee },
          { label: "Packaging", value: rule.packagingFee },
        ].map((f) => {
          const ngn = convert(f.value);
          return (
            <div
              key={f.label}
              className="bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2"
            >
              <p className="text-[10px] text-[#555] mb-0.5">{f.label} Fee</p>
              <p className="text-[12px] font-semibold text-[#e0e0e0]">
                ${f.value}
              </p>
              {ngn && (
                <p className="text-[10px] text-[#555]">
                  ≈ ₦{ngn.toLocaleString("en-NG")}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-[#555]">
        <DollarIcon size={12} color="#555" />
        {rule.estimatedDaysMin}–{rule.estimatedDaysMax} days estimated
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function PricingPage() {
  const { toggle } = useSidebar();

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<DeliveryType | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editRule, setEditRule] = useState<
    | (Omit<PricingRule, "_id" | "providerId" | "isActive"> & { _id?: string })
    | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([pricingApi.list(), locationsApi.getStates()])
      .then(([rulesRes, statesRes]) => {
        setRules(rulesRes.data.rules);
        setStates(statesRes.data.states);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditRule(blankRule());
    setSaveError(null);
    setModalOpen(true);
  };
  const openEdit = (rule: PricingRule) => {
    const { _id, providerId, isActive, ...rest } = rule;
    setEditRule({ ...rest, _id });
    setSaveError(null);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditRule(null);
  };

  const handleSave = async (form: typeof editRule) => {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Clean payload — remove empty strings, ensure correct types
      const { _id, ...rest } = form as any;

      const payload = {
        deliveryType: rest.deliveryType,
        fromState: rest.fromState,
        toState: rest.toState || rest.fromState, // fallback to fromState for intra types
        estimatedDaysMin: Number(rest.estimatedDaysMin) || 1,
        estimatedDaysMax: Number(rest.estimatedDaysMax) || 3,
        insuranceFee: Number(rest.insuranceFee) || 0,
        packagingFee: Number(rest.packagingFee) || 0,
        weightTiers: rest.weightTiers.map((t: WeightTier) => ({
          minWeight: Number(t.minWeight) || 0,
          maxWeight: Number(t.maxWeight) || 0,
          price: Number(t.price) || 0, // keep decimals — don't round
        })),
        // Only include LGA fields if they have values
        ...(rest.fromLga ? { fromLga: rest.fromLga } : {}),
        ...(rest.toLga ? { toLga: rest.toLga } : {}),
      };

      console.log("Pricing rule payload:", JSON.stringify(payload, null, 2));

      if (_id) {
        const res = await pricingApi.update(_id, payload);
        setRules((prev) =>
          prev.map((r) => (r._id === _id ? res.data.rule : r)),
        );
        showSuccess("Rule updated");
      } else {
        const res = await pricingApi.create(payload as any);
        setRules((prev) => [...prev, res.data.rule]);
        showSuccess("Rule created");
      }
      closeModal();
    } catch (err: unknown) {
      console.error("Save rule error:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: PricingRule) => {
    try {
      const res = await pricingApi.toggle(rule._id);
      setRules((prev) =>
        prev.map((r) =>
          r._id === rule._id ? { ...r, isActive: res.data.rule.isActive } : r,
        ),
      );
      showSuccess(
        res.data.rule.isActive ? "Rule activated" : "Rule deactivated",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle rule");
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Delete this pricing rule?")) return;
    setDeleting(ruleId);
    try {
      await pricingApi.delete(ruleId);
      setRules((prev) => prev.filter((r) => r._id !== ruleId));
      showSuccess("Rule deleted");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    } finally {
      setDeleting(null);
    }
  };

  const filtered =
    filterType === "all"
      ? rules
      : rules.filter((r) => r.deliveryType === filterType);

  return (
    <>
      {/* Topbar */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f] flex items-center justify-between px-4 lg:px-7 py-4 lg:py-5 border-b border-[#1e1e1e] shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggle}
            className="lg:hidden flex flex-col justify-center gap-[5px] w-8 h-8 cursor-pointer bg-transparent border-none shrink-0"
          >
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
          </button>
          <div>
            <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
              Pricing Rules
            </h1>
            <p className="text-[11px] text-[#555] hidden sm:block">
              All prices in USD · NGN equivalent shown
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] rounded-xl hover:border-[#444] transition-all cursor-pointer"
          >
            <RefreshIcon size={14} color="currentColor" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#ff2d2d] text-white border-none rounded-xl text-[13px] font-semibold font-[var(--font-syne)] cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <PlusIcon size={14} color="white" /> New Rule
          </button>
        </div>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-4 lg:gap-5">
        {error && (
          <div className="flex items-center justify-between px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[13px] text-red-400 gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon size={15} color="currentColor" />
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="bg-transparent border-none cursor-pointer shrink-0"
            >
              <XIcon size={14} color="currentColor" />
            </button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-[13px] text-green-400">
            <CheckCircleIcon size={15} color="currentColor" />
            {success}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#222] rounded-xl p-1 w-fit">
          {(
            ["all", "intra_lga", "inter_lga_same_state", "inter_state"] as const
          ).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border-none whitespace-nowrap capitalize
                ${filterType === f ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
            >
              {f === "all" ? "All" : DELIVERY_TYPE_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Rules",
              value: rules.length,
              color: "text-[#f0f0f0]",
            },
            {
              label: "Active",
              value: rules.filter((r) => r.isActive).length,
              color: "text-green-400",
            },
            {
              label: "Intra LGA",
              value: rules.filter((r) => r.deliveryType === "intra_lga").length,
              color: "text-blue-400",
            },
            {
              label: "Inter State",
              value: rules.filter((r) => r.deliveryType === "inter_state")
                .length,
              color: "text-amber-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-3 lg:p-4"
            >
              <DollarIcon size={14} color="#555" />
              <div
                className={`font-[var(--font-syne)] font-bold text-2xl mt-2 ${s.color}`}
              >
                {s.value}
              </div>
              <p className="text-[11px] text-[#555] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Rules grid */}
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#555] text-sm">Loading pricing rules...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4 bg-[#1a1a1a] border border-[#222] rounded-2xl">
            <DollarIcon size={40} color="#2a2a2a" />
            <p className="text-[15px] font-medium text-[#777]">
              No pricing rules yet
            </p>
            <p className="text-[13px] text-[#555] text-center max-w-xs">
              Create pricing rules to define your delivery fees for different
              routes and weights
            </p>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#ff2d2d] text-white border-none rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              <PlusIcon size={14} color="white" /> Create First Rule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((rule) => (
              <RuleCard
                key={rule._id}
                rule={rule}
                onEdit={() => openEdit(rule)}
                onToggle={() => handleToggle(rule)}
                onDelete={() => handleDelete(rule._id)}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && editRule && (
        <RuleFormModal
          rule={editRule}
          states={states}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
          error={saveError}
        />
      )}
    </>
  );
}
