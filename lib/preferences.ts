import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_KEY = 'user_theme'       // e.g. 'dark', 'dark_blue', 'dark_green', 'light'
const LANGUAGE_KEY = 'user_language'  // e.g. 'en', 'tr', 'ar'

export async function getThemePreference(): Promise<string> {
  return (await AsyncStorage.getItem(THEME_KEY)) ?? 'dark'
}

export async function setThemePreference(theme: string): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme)
}

export async function getLanguagePreference(): Promise<string> {
  return (await AsyncStorage.getItem(LANGUAGE_KEY)) ?? 'en'
}

export async function setLanguagePreference(lang: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang)
}
