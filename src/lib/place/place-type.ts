export const PLACE_TYPES = [
  "CAFE",
  "RESTAURANT",
  "CAFE_GAME",
  "GALLERY",
  "OTHER",
] as const;

export type PlaceTypeValue = (typeof PLACE_TYPES)[number];

export const PLACE_TYPE_LABELS: Record<PlaceTypeValue, string> = {
  CAFE: "کافه",
  RESTAURANT: "رستوران",
  CAFE_GAME: "کافه بازی",
  GALLERY: "گالری",
  OTHER: "سایر",
};

export const PLACE_TYPE_OPTIONS = PLACE_TYPES.map((value) => ({
  value,
  label: PLACE_TYPE_LABELS[value],
}));
