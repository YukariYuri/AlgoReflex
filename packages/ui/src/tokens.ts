export const colors = {
  bg: {
    base: '#0B0F19',
    subtle: '#111827',
    elevated: '#1F2937',
    hover: '#374151',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#9CA3AF',
    muted: '#6B7280',
    inverse: '#111827',
  },
  brand: {
    primary: '#6366F1', // Indigo
    primaryHover: '#4F46E5',
    accent: '#06B6D4', // Cyan
    gradient: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
  },
  status: {
    accepted: '#10B981', // Emerald
    wrongAnswer: '#EF4444', // Red
    timeLimit: '#F59E0B', // Amber
    compileError: '#EC4899', // Pink
    running: '#3B82F6', // Blue
  },
  border: {
    subtle: '#1F2937',
    default: '#374151',
    highlight: '#4F46E5',
  },
} as const;

export const typography = {
  fontFamilySans: 'Inter, system-ui, -apple-system, sans-serif',
  fontFamilyMono: 'JetBrains Mono, Fira Code, monospace',
} as const;
