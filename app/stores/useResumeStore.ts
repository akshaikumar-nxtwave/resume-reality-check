import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ApiResult } from '@/types/resume';

interface ResumeState {
  result: ApiResult | null;

  lastDriveLink: string;

  setResult: (result: ApiResult, driveLink: string) => void;
  clearResult: () => void;
}


export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      result: null,
      lastDriveLink: '',

      setResult: (result: ApiResult, driveLink: string) =>
        set({ result, lastDriveLink: driveLink }),

      clearResult: () =>
        set({ result: null, lastDriveLink: '' }),
    }),
    {
      name: 'resume-analysis',           // localStorage key
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        result: state.result,
        lastDriveLink: state.lastDriveLink,
      }),
    }
  )
);