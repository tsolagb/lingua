import React, { createContext, useContext } from "react";

interface AuthGateValue {
  guestAccepted: boolean;
  setGuestAccepted: (accepted: boolean) => void;
}

export const AuthGateContext = createContext<AuthGateValue | null>(null);

export function useAuthGate() {
  const value = useContext(AuthGateContext);
  if (!value) {
    throw new Error("useAuthGate must be used inside the root auth gate");
  }
  return value;
}
