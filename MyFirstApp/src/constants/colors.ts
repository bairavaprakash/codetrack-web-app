export const Colors = {
  dark: {
    background: '#090D16',
    surface: '#111827',
    surfaceElevated: '#1F2937',
    surfaceSubtle: '#161F30',
    border: '#2A364F',
    borderSubtle: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    primary: '#38BDF8', // Cyan-Blue
    primaryGradient: ['#38BDF8', '#6366F1'],
    accent: '#818CF8', // Indigo
    success: '#34D399', // Emerald
    warning: '#FBBF24', // Amber
    danger: '#F87171', // Rose
    info: '#60A5FA',
    card: '#131B2E',
    tabBar: '#0C1220',
    tabBarBorder: '#1E293B',
    tabActive: '#38BDF8',
    tabInactive: '#64748B',
  },
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    surfaceSubtle: '#F8FAFC',
    border: '#E2E8F0',
    borderSubtle: '#EEF2F6',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    primary: '#0284C7',
    primaryGradient: ['#0284C7', '#4F46E5'],
    accent: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    card: '#FFFFFF',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    tabActive: '#0284C7',
    tabInactive: '#94A3B8',
  },
};

export const CategoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Learning: { bg: '#38BDF820', text: '#38BDF8', border: '#38BDF840' },
  'Coding Practice': { bg: '#818CF820', text: '#818CF8', border: '#818CF840' },
  Project: { bg: '#34D39920', text: '#34D399', border: '#34D39940' },
  Revision: { bg: '#FBBF2420', text: '#FBBF24', border: '#FBBF2440' },
  Personal: { bg: '#F472B620', text: '#F472B6', border: '#F472B640' },
};

export const PriorityColors: Record<string, { bg: string; text: string; badge: string }> = {
  Low: { bg: '#94A3B820', text: '#94A3B8', badge: '#64748B' },
  Medium: { bg: '#60A5FA20', text: '#60A5FA', badge: '#3B82F6' },
  High: { bg: '#FBBF2420', text: '#FBBF24', badge: '#F59E0B' },
  Urgent: { bg: '#F8717120', text: '#F87171', badge: '#EF4444' },
};

export const LanguageColors: Record<string, string> = {
  Python: '#38BDF8',
  JavaScript: '#FACC15',
  TypeScript: '#60A5FA',
  Java: '#FB923C',
  C: '#94A3B8',
  'C++': '#A78BFA',
  'HTML and CSS': '#F43F5E',
  SQL: '#2DD4BF',
  React: '#38BDF8',
  'React Native': '#818CF8',
  FastAPI: '#10B981',
  'Data Structures and Algorithms': '#EC4899',
};
