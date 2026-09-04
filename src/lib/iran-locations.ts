export type IranProvinceOption = {
  id: number | string;
  name: string;
};

export type IranCityOption = {
  id: number | string;
  name: string;
  provinceId: number | string;
};
