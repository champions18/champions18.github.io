"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { BehavioralSignals, Channel } from "@/lib/risk-engine";

export function getDeviceFingerprint() {
  if (typeof window === "undefined") return "Server render · unknown device";
  const browser = navigator.userAgent.includes("Edg") ? "Edge" : navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Safari") ? "Safari" : "Browser";
  const os = navigator.userAgent.includes("Windows") ? "Windows 11" : navigator.userAgent.includes("Mac") ? "macOS" : navigator.userAgent.includes("Android") ? "Android" : navigator.userAgent.includes("iPhone") ? "iOS" : "Unknown OS";
  return `${browser} on ${os} · ${window.screen.width}x${window.screen.height} · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
}

export function useBehaviorSignals(channel: Channel = "Internet Banking") {
  const [keys, setKeys] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [mouseDistance, setMouseDistance] = useState(0);
  const [mouseSamples, setMouseSamples] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [touchSamples, setTouchSamples] = useState(0);
  const [swipeVelocity, setSwipeVelocity] = useState(310);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const firstKeyAt = useRef<number | null>(null);
  const lastKeyAt = useRef<number | null>(null);
  const dwellTotal = useRef(0);
  const flightTotal = useRef(0);
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const now = performance.now();
    if (!firstKeyAt.current) firstKeyAt.current = now;
    if (lastKeyAt.current) flightTotal.current += now - lastKeyAt.current;
    lastKeyAt.current = now;
    dwellTotal.current += 95 + Math.random() * 80;
    setKeys((value) => value + 1);
    if (event.key === "Backspace") setBackspaces((value) => value + 1);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const now = performance.now();
    const current = { x: event.clientX, y: event.clientY, t: now };
    if (lastPointer.current) {
      const dx = current.x - lastPointer.current.x;
      const dy = current.y - lastPointer.current.y;
      setMouseDistance((value) => value + Math.sqrt(dx * dx + dy * dy));
    }
    lastPointer.current = current;
    setMouseSamples((value) => value + 1);
  }, []);

  const onClickCapture = useCallback(() => setClicks((value) => value + 1), []);

  const onTouchMove = useCallback((event: React.TouchEvent<HTMLElement>) => {
    setTouchSamples((value) => value + 1);
    if (event.touches.length > 0) setSwipeVelocity(240 + Math.random() * 260);
  }, []);

  const signals = useMemo<BehavioralSignals>(() => {
    const elapsedMinutes = firstKeyAt.current && lastKeyAt.current ? Math.max((lastKeyAt.current - firstKeyAt.current) / 60000, 0.05) : 0.25;
    const typingSpeed = Math.round(keys / elapsedMinutes);
    const mouseVelocity = Math.round(mouseSamples > 0 ? mouseDistance / Math.max(mouseSamples / 12, 1) : 620);
    const clickPrecision = Math.max(0.5, Math.min(0.98, 0.96 - Math.max(0, clicks - 4) * 0.03));

    return {
      channel,
      device: getDeviceFingerprint(),
      location: "Mumbai, Maharashtra",
      ipAddress: "103.21.58.17",
      loginTime: new Date().toISOString(),
      typingSpeed: Number.isFinite(typingSpeed) ? typingSpeed : 210,
      dwellTime: keys > 0 ? Math.round(dwellTotal.current / keys) : 128,
      flightTime: keys > 1 ? Math.round(flightTotal.current / (keys - 1)) : 82,
      backspaceRate: keys > 0 ? Number((backspaces / keys).toFixed(2)) : 0.06,
      mouseVelocity: Number.isFinite(mouseVelocity) ? mouseVelocity : 620,
      clickPrecision,
      pathIrregularity: Math.min(0.9, Math.max(0.1, mouseSamples < 8 ? 0.2 : 0.12 + Math.abs(mouseVelocity - 620) / 1200)),
      hesitationMs: Math.round(Math.max(120, 900 - keys * 8 + clicks * 12)),
      failedAttempts,
      touchPressure: Number((0.36 + touchSamples * 0.01).toFixed(2)),
      swipeVelocity,
      deviceRotation: typeof window !== "undefined" && "DeviceOrientationEvent" in window ? 4 : 0
    };
  }, [backspaces, channel, clicks, failedAttempts, keys, mouseDistance, mouseSamples, swipeVelocity, touchSamples]);

  return {
    signals,
    collectors: { onKeyDown, onPointerMove, onClickCapture, onTouchMove },
    setFailedAttempts
  };
}
