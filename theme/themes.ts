import { createV5Theme, defaultChildrenThemes } from '@tamagui/config/v5'

export const themes = createV5Theme({
  childrenThemes: {
    ...defaultChildrenThemes,
  },

  getTheme: ({ palette, scheme }) => {
    const isDark = scheme === 'dark'
    const surfaceBase = isDark ? '#061A2F' : '#F7FAFC'
    const surfaceRaised = isDark ? '#0D2A47' : '#FFFFFF'
    const surfaceSubtle = isDark ? '#153D5E' : '#DFEAF4'
    const surfaceHover = isDark ? '#1C4A72' : '#D0E4F0'
    const borderSubtle = isDark ? '#335F82' : '#B8D1E2'
    const brandPrimary = isDark ? '#1A4A7A' : '#002855'
    const brandPrimaryHover = isDark ? '#245A8E' : '#001F42'
    const brandSecondary = '#8DB9D3'
    const brandSecondarySoft = isDark ? '#143B5A' : '#E1F0F7'
    const brandSecondaryForeground = isDark ? '#F4FBFF' : '#12344D'
    const brandGold = '#9A8051'
    const brandGoldSoft = isDark ? '#3A3020' : '#F1E7D2'

    // Brand palette:
    // Primary: Pantone 295-inspired navy.
    // Secondary: Pantone 542-inspired light blue.
    // Accent: flat digital approximation of Pantone 872 metallic gold.
    return {
      surfaceBase,
      surfaceRaised,
      surfaceSubtle,
      surfaceHover,
      borderSubtle,
      borderFocus: brandSecondary,
      textPrimary: isDark ? '#F5F8FB' : '#0B1520',
      textSecondary: isDark ? '#C5D3DE' : '#334E68',
      textMuted: isDark ? '#A3BDD0' : '#66788A',
      brandPrimary,
      brandPrimaryHover,
      brandPrimaryForeground: '#ffffff',
      brandSecondary,
      brandSecondarySoft,
      brandSecondaryForeground,
      brandGold,
      brandGoldSoft,
      brandGoldForeground: isDark ? '#111827' : '#ffffff',
      destructiveForeground: '#ffffff',
      surfaceDeep: surfaceBase,
      surfaceCard: surfaceRaised,
      borderColor: borderSubtle,
      accentBackground: brandPrimary,
      accentHover: brandPrimaryHover,
      accentForeground: '#ffffff',
      secondaryBackground: brandSecondary,
      secondaryForeground: brandSecondaryForeground,
      goldBackground: brandGold,
      goldForeground: isDark ? '#111827' : '#ffffff',
    }
  },
})
