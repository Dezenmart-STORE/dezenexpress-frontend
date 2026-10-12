"use client";

import { useState, useEffect, useCallback } from "react";
import { pricingApi, PricingRule } from "@/lib/api";

export function usePricingRules(deliveryType?: PricingRule["deliveryType"]) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    pricingApi
      .list(deliveryType)
      .then((res) => setRules(res.data.rules))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [deliveryType]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = async (data: Parameters<typeof pricingApi.create>[0]) => {
    const res = await pricingApi.create(data);
    setRules((prev) => [...prev, res.data.rule]);
    return res.data.rule;
  };

  const update = async (
    ruleId: string,
    data: Parameters<typeof pricingApi.update>[1],
  ) => {
    const res = await pricingApi.update(ruleId, data);
    setRules((prev) => prev.map((r) => (r._id === ruleId ? res.data.rule : r)));
    return res.data.rule;
  };

  const toggle = async (ruleId: string) => {
    const res = await pricingApi.toggle(ruleId);
    setRules((prev) =>
      prev.map((r) =>
        r._id === ruleId ? { ...r, isActive: res.data.rule.isActive } : r,
      ),
    );
  };

  const remove = async (ruleId: string) => {
    await pricingApi.delete(ruleId);
    setRules((prev) => prev.filter((r) => r._id !== ruleId));
  };

  return {
    rules,
    loading,
    error,
    create,
    update,
    toggle,
    remove,
    refetch: fetch,
  };
}
