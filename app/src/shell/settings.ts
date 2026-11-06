/**
 * App settings, saved on the device. Settings use localStorage (synchronous, so the first frame already
 * has the right language and lite mode); progress records use IndexedDB via Dexie (storage/db.ts).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '../i18n'

export interface SettingsState {
  lang: Lang
  /** null = automatic (decided by device memory and frame time). */
  liteOverride: boolean | null
  liteAuto: boolean
  /** Master switch for every sound. */
  sound: boolean
  /** Background music (needs `sound` too). */
  music: boolean
  unlockAll: boolean
  demoWatermark: boolean
  setLang: (lang: Lang) => void
  toggleLang: () => void
  setLiteOverride: (v: boolean | null) => void
  setLiteAuto: (v: boolean) => void
  set: (patch: Partial<Pick<SettingsState, 'sound' | 'music' | 'unlockAll' | 'demoWatermark'>>) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      lang: 'ms',
      liteOverride: null,
      liteAuto: false,
      sound: true,
      music: true,
      unlockAll: false,
      demoWatermark: true,
      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === 'ms' ? 'en' : 'ms' }),
      setLiteOverride: (liteOverride) => set({ liteOverride }),
      setLiteAuto: (liteAuto) => set({ liteAuto }),
      set: (patch) => set(patch),
    }),
    {
      name: 'makmalpop-settings',
      partialize: (s) => ({
        lang: s.lang,
        liteOverride: s.liteOverride,
        sound: s.sound,
        music: s.music,
        unlockAll: s.unlockAll,
        demoWatermark: s.demoWatermark,
      }),
    },
  ),
)

/** Lite mode currently in effect. */
export const useLite = () => useSettings((s) => s.liteOverride ?? s.liteAuto)
