"use client";

import { useEffect, useState } from "react";
import {
  customerApi,
  normalizeProfile,
  CustomerProfile,
} from "@/lib/express/api";
import { getCustomerUser, saveCustomerUser } from "@/lib/express/customerAuth";

/** Cached customer profile (name / email / phone) for prefilling booking forms. */
export function useCustomerProfile() {
  const [profile, setProfile] = useState<CustomerProfile>({});

  useEffect(() => {
    const cached = getCustomerUser();
    if (cached) setProfile(cached);
    customerApi
      .getProfile()
      .then((res) => {
        const p = normalizeProfile(res);
        saveCustomerUser(p);
        setProfile(p);
      })
      .catch(() => {
        // 401 is handled globally (shows the sign-in screen); anything else we ignore.
      });
  }, []);

  return profile;
}
