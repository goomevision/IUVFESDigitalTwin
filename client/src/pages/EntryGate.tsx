import { useEffect } from "react";
import { Redirect } from "wouter";
import Home from "./Home";
import { HARDWARE_CONFIG_STORAGE_KEY } from "@/lib/hardwareConfig";

export default function EntryGate() {
  const configured = typeof window !== "undefined" && Boolean(window.localStorage.getItem(HARDWARE_CONFIG_STORAGE_KEY));

  useEffect(() => {
    if (typeof window !== "undefined" && !window.localStorage.getItem(HARDWARE_CONFIG_STORAGE_KEY)) {
      window.history.replaceState({}, "", "/hardware");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  return configured ? <Home /> : <Redirect to="/hardware" />;
}
