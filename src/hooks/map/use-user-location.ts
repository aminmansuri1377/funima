"use client";

import { useCallback, useState } from "react";

import type { LngLat } from "@/lib/map/types";

type UserLocationStatus = "idle" | "loading" | "success" | "error";

type UserLocationError =
  | "UNSUPPORTED"
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "UNKNOWN";

type UserLocationData = {
  position: LngLat;

  accuracy: number;

  altitude: number | null;

  heading: number | null;

  speed: number | null;

  timestamp: number;
};

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocationData | null>(null);

  const [status, setStatus] = useState<UserLocationStatus>("idle");

  const [error, setError] = useState<UserLocationError | null>(null);

  const locate = useCallback(async (): Promise<UserLocationData | null> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");

      setError("UNSUPPORTED");

      return null;
    }

    setStatus("loading");

    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (result) => {
          const nextLocation: UserLocationData = {
            position: [result.coords.longitude, result.coords.latitude],

            accuracy: result.coords.accuracy,

            altitude: result.coords.altitude,

            heading: result.coords.heading,

            speed: result.coords.speed,

            timestamp: result.timestamp,
          };

          setLocation(nextLocation);

          setStatus("success");

          resolve(nextLocation);
        },

        (locationError) => {
          let nextError: UserLocationError = "UNKNOWN";

          if (locationError.code === locationError.PERMISSION_DENIED) {
            nextError = "PERMISSION_DENIED";
          } else if (
            locationError.code === locationError.POSITION_UNAVAILABLE
          ) {
            nextError = "POSITION_UNAVAILABLE";
          } else if (locationError.code === locationError.TIMEOUT) {
            nextError = "TIMEOUT";
          }

          setError(nextError);

          setStatus("error");

          resolve(null);
        },

        {
          /*
           * برای موبایل از GPS دقیق‌تر
           * درخواست می‌کنیم.
           */
          enableHighAccuracy: true,

          /*
           * بیشتر از 15 ثانیه منتظر نمی‌مانیم.
           */
          timeout: 15_000,

          /*
           * برای ثبت دقیق مکان Host
           * cache قدیمی را قبول نمی‌کنیم.
           */
          maximumAge: 0,
        },
      );
    });
  }, []);

  function clear() {
    setLocation(null);

    setStatus("idle");

    setError(null);
  }

  return {
    location,

    position: location?.position ?? null,

    accuracy: location?.accuracy ?? null,

    status,

    error,

    locate,

    clear,

    isLoading: status === "loading",

    hasLocation: location !== null,
  };
}
