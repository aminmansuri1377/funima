"use client";

import dynamic from "next/dynamic";

import { useEffect } from "react";

import {
  getRTLTextPluginStatus,
  setRTLTextPlugin,
  setWorkerUrl,
} from "maplibre-gl";

import type { FunimaMapCanvasProps } from "./map-canvas";

/*
 * ========================================
 * MAPLIBRE WORKER
 * ========================================
 *
 * برای Next.js + Turbopack ضروری است.
 *
 * فایل‌های زیر باید وجود داشته باشند:
 *
 * public/maplibre/maplibre-gl-worker.mjs
 * public/maplibre/maplibre-gl-shared.mjs
 */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

/*
 * ========================================
 * MAP CANVAS
 * ========================================
 */

const DynamicMapCanvas = dynamic(
  () => import("./map-canvas").then((module) => module.MapCanvas),
  {
    ssr: false,

    loading: () => <MapLoading />,
  },
);

/*
 * ========================================
 * RTL PLUGIN
 * ========================================
 */

let rtlInitializationStarted = false;

function initializeRTL() {
  /*
   * StrictMode / Fast Refresh
   * نباید دوباره plugin را register کند.
   */
  if (rtlInitializationStarted) {
    return;
  }

  const status = getRTLTextPluginStatus();

  /*
   * اگر آماده است یا instance دیگری
   * در حال load کردن آن است،
   * هیچ کاری نکن.
   */
  if (status === "loaded" || status === "loading") {
    rtlInitializationStarted = true;

    return;
  }

  /*
   * اگر هنوز register نشده.
   */
  if (status === "unavailable") {
    rtlInitializationStarted = true;

    void setRTLTextPlugin("/mapbox-gl-rtl-text.js", true).catch((error) => {
      /*
       * مشکل RTL نباید کل Map
       * را از کار بیندازد.
       */
      console.warn("[Funima Map RTL] Plugin load failed:", error);
    });

    return;
  }

  /*
   * status === error
   *
   * Map را همچنان render می‌کنیم.
   */
  if (status === "error") {
    console.warn("[Funima Map RTL] Plugin is in error state.");
  }
}

/*
 * ========================================
 * MAP VIEW
 * ========================================
 */

export function MapView(props: FunimaMapCanvasProps) {
  useEffect(() => {
    initializeRTL();
  }, []);

  /*
   * Map دیگر منتظر RTL نمی‌ماند.
   *
   * Worker از بالا با setWorkerUrl
   * به آدرس صحیح وصل شده است.
   */
  return (
    <div
      className="
        relative
        h-full
        w-full
      "
    >
      <DynamicMapCanvas {...props} />
    </div>
  );
}

/*
 * ========================================
 * LOADING
 * ========================================
 */

function MapLoading() {
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
      در حال بارگذاری نقشه...
    </div>
  );
}
