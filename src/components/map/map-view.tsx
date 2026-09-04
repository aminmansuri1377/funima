"use client";

import dynamic from "next/dynamic";

import { useEffect, useState } from "react";

import {
  getRTLTextPluginStatus,
  setRTLTextPlugin,
  setWorkerUrl,
} from "maplibre-gl";

import type { FunimaMapCanvasProps } from "./map-canvas";

/*
 * ========================================
 * MapLibre Worker
 * ========================================
 *
 * قبل از ساخته شدن اولین Map
 * worker اختصاصی را مشخص می‌کنیم.
 */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const DynamicMapCanvas = dynamic(
  () => import("./map-canvas").then((module) => module.MapCanvas),
  {
    ssr: false,

    loading: () => <MapLoading text="در حال بارگذاری نقشه..." />,
  },
);

export function MapView(props: FunimaMapCanvasProps) {
  const [mapReady, setMapReady] = useState(false);

  const [rtlError, setRtlError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      try {
        const status = getRTLTextPluginStatus();

        /*
         * اگر قبلاً load شده،
         * دوباره setRTLTextPlugin نمی‌زنیم.
         */
        if (status !== "loaded") {
          /*
           * اگر unavailable باشد یعنی هنوز
           * plugin درخواست نشده.
           *
           * lazy = false:
           * همین الان plugin کامل load شود.
           */
          if (status === "unavailable") {
            await setRTLTextPlugin("/mapbox-gl-rtl-text.js", false);
          } else if (status === "loading") {
            /*
             * این حالت معمولاً فقط در HMR
             * اتفاق می‌افتد.
             *
             * به جای ساختن polling دستی،
             * کمی صبر می‌کنیم و دوباره
             * component بعد از refresh
             * وضعیت واقعی را خواهد داشت.
             */
            await waitForRTL();
          }
        }

        const finalStatus = getRTLTextPluginStatus();

        if (finalStatus !== "loaded") {
          throw new Error(`RTL plugin status: ${finalStatus}`);
        }
      } catch (error) {
        console.error("[Funima Map RTL]", error);

        if (!cancelled) {
          setRtlError("افزونه نمایش فارسی نقشه بارگذاری نشد.");
        }
      } finally {
        if (!cancelled) {
          /*
           * حتی اگر RTL fail شود،
           * کل Map را از دسترس خارج نمی‌کنیم.
           */
          setMapReady(true);
        }
      }
    }

    void setupMap();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!mapReady) {
    return <MapLoading text="در حال آماده‌سازی نقشه..." />;
  }

  return (
    <div
      className="
        relative
        h-full
        w-full
      "
    >
      {rtlError && (
        <div
          className="
            absolute
            left-3
            right-3
            top-3
            z-30
            rounded-xl
            bg-white/95
            px-3
            py-2
            text-center
            text-xs
            text-red-600
            shadow
          "
        >
          {rtlError}
        </div>
      )}

      <DynamicMapCanvas {...props} />
    </div>
  );
}

async function waitForRTL() {
  /*
   * فقط برای HMR:
   *
   * instance قبلی ممکن است plugin را
   * در حال load گذاشته باشد.
   */
  const timeout = 10_000;

  const interval = 100;

  const started = Date.now();

  while (Date.now() - started < timeout) {
    const status = getRTLTextPluginStatus();

    if (status === "loaded") {
      return;
    }

    if (status === "error") {
      throw new Error("RTL plugin failed to load.");
    }

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, interval);
    });
  }

  throw new Error("RTL plugin loading timeout.");
}

function MapLoading({ text }: { text: string }) {
  return (
    <div
      className="
        flex
        h-full
        w-full
        items-center
        justify-center
        bg-gray-100
        text-sm
        text-(--color-text-secondary)
      "
    >
      {text}
    </div>
  );
}
