export type MapPosition = {
  latitude: number;
  longitude: number;
};

export type LngLat = [longitude: number, latitude: number];

export function positionToLngLat(position: MapPosition): LngLat {
  return [position.longitude, position.latitude];
}

export function lngLatToPosition(value: LngLat): MapPosition {
  return {
    longitude: value[0],
    latitude: value[1],
  };
}
