import React, { createContext, useContext, useState, useEffect } from 'react'
import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui'
import { Toaster } from '@tamagui/toast/v2'
import { config } from '../tamagui.config'
import { AuthProvider } from '../lib/auth'
import {
  getThemePreference,
  setThemePreference,
  getLanguagePreference,
  setLanguagePreference,
} from '../lib/preferences'
import i18n from '../i18n' // import initializes i18next

interface PreferencesContextProps {
  theme: string
  setTheme: (theme: string) => Promise<void>
  language: string
  setLanguage: (lang: string) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextProps | undefined>(undefined)

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config' | 'defaultTheme'>) {
  const [themeName, setThemeName] = useState<string>('dark')
  const [language, setLanguageState] = useState<string>('en')

  useEffect(() => {
    // Load stored user preferences on mount
    getThemePreference().then((theme) => {
      setThemeName(theme)
    })
    getLanguagePreference().then((lang) => {
      setLanguageState(lang)
      i18n.changeLanguage(lang)
    })
  }, [])

  const setTheme = async (theme: string) => {
    setThemeName(theme)
    await setThemePreference(theme)
  }

  const setLanguage = async (lang: string) => {
    setLanguageState(lang)
    i18n.changeLanguage(lang)
    await setLanguagePreference(lang)
  }

  return (
    <PreferencesContext.Provider value={{ theme: themeName, setTheme, language, setLanguage }}>
      <TamaguiProvider
        config={config}
        defaultTheme={themeName}
        {...rest}
      >
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </TamaguiProvider>
    </PreferencesContext.Provider>
  )
}
