"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ordersApi,
  Order,
  OrderStatus,
  LogisticsStatus,
} from "@/lib/dezenmart-api";

// ── Hook for logistics provider — gets THEIR assigned orders ──────────────────
export function useMyOrders(logisticsStatus?: LogisticsStatus) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    ordersApi
      .getMyOrders({ logisticsStatus, limit: 100 })
      .then((res) => setOrders(res.data.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [logisticsStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (orderId: string) => {
    await ordersApi.accept(orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? { ...o, logisticsStatus: "accepted" as LogisticsStatus }
          : o,
      ),
    );
  };

  const reject = async (orderId: string, reason?: string) => {
    await ordersApi.reject(orderId, reason);
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? { ...o, logisticsStatus: "rejected" as LogisticsStatus }
          : o,
      ),
    );
  };

  const ship = async (
    orderId: string,
    params?: {
      trackingNumber?: string;
      expectedDeliveryDate?: string;
      notes?: string;
    },
  ) => {
    await ordersApi.ship(orderId, params);
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? {
              ...o,
              logisticsStatus: "shipped" as LogisticsStatus,
              trackingNumber: params?.trackingNumber,
            }
          : o,
      ),
    );
  };

  return { orders, loading, error, refetch: load, accept, reject, ship };
}

// ── Hook for all orders (admin / dashboard stats view) ────────────────────────
export function useAllOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    ordersApi
      .getAllOrders()
      .then((res) => setOrders(res.data.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const updated = await ordersApi.update(id, { status });
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, ...updated } : o)),
    );
    return updated;
  };

  const raiseDispute = async (id: string, reason: string) => {
    const updated = await ordersApi.raiseDispute(id, reason);
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, ...updated } : o)),
    );
    return updated;
  };

  return { orders, loading, error, refetch: load, updateStatus, raiseDispute };
}

// ── Backward compat — maps old useOrders() calls to useMyOrders ───────────────
export function useOrders() {
  return useMyOrders();
}
