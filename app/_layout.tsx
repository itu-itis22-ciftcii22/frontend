import { Platform } from 'react-native'

if (Platform.OS === 'web') {
  require('../tamagui.generated.css')
  require('../theme/semantic-web.css')
}

import '@tamagui/native/setup-zeego'

import { useEffect, useMemo } from 'react'
import { StatusBar } from 'expo-status-bar'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'
import { Provider } from '../components/Provider'
import { usePreferences } from '../components/Provider'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontsError])

  if (!fontsLoaded && !fontsError) {
    return null
  }

  return (
    <Providers>
      <RootLayoutNav />
    </Providers>
  )
}

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <Provider>{children}</Provider>
}

function RootLayoutNav() {
  const { theme } = usePreferences()
  const navigationTheme = useMemo(
    () =>
      theme === 'light'
        ? {
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              primary: '#002855',
              background: '#F7FAFC',
              card: '#FFFFFF',
              text: '#0B1520',
              border: '#C9DFEC',
            },
          }
        : {
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              primary: '#8DB9D3',
              background: '#061A2F',
              card: '#0B223B',
              text: '#F5F8FB',
              border: '#285173',
            },
          },
    [theme]
  )

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  )
}
