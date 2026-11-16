import { create } from 'zustand';
// userStore.js
export const useUserStore = create((set) => ({

    user: null,



    setUser: (user) => set({ user }),
}));

// themeStore.js
export const useThemeStore = create((set) => ({
    theme: 'light',
    setTheme: (theme) => set({ theme }),
}));