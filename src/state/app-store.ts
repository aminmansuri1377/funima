import { create } from "zustand";

type AppState = {
  selectedCity: string | null;
  selectedFilterIds: string[];

  setSelectedCity: (
    city: string | null,
  ) => void;

  setSelectedFilterIds: (
    ids: string[],
  ) => void;

  resetHomeFilters: () => void;
};

export const useAppStore =
  create<AppState>((set) => ({
    selectedCity: null,
    selectedFilterIds: [],

    setSelectedCity: (
      selectedCity,
    ) => {
      set({
        selectedCity,
      });
    },

    setSelectedFilterIds: (
      selectedFilterIds,
    ) => {
      set({
        selectedFilterIds,
      });
    },

    resetHomeFilters: () => {
      set({
        selectedCity: null,
        selectedFilterIds: [],
      });
    },
  }));