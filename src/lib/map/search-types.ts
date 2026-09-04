import type { LngLat } from "./types";

export type MapSearchResult = {
  id: string;

  name: string;

  label: string;

  position: LngLat;

  city: string | null;

  state: string | null;

  country: string | null;

  street: string | null;

  postcode: string | null;
};
