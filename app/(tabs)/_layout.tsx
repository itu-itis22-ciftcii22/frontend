import { Tabs, router } from 'expo-router'
import { useTheme } from 'tamagui'
import { LineChart, List, Zap } from '@tamagui/lucide-icons-2'
import { useAuth } from '../../lib/auth'
import { useEffect } from 'react'

export default function TabLayout() {
  const theme = useTheme()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login' as any)
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) {
    return null
  }

  // Dynamic theme colors resolved from the current active theme
  const activeColor = theme.brandSecondary?.val || '#8DB9D3'
  const inactiveColor = theme.textMuted?.val || '#8EA4B5'
  const bgColor = theme.surfaceSubtle?.val || theme.surfaceRaised?.val || '#0D2A47'
  const borderColor = theme.borderSubtle?.val || theme.borderColor?.val || '#285173'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          height: 52,
          paddingBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <List color={color as any} size={20} />,
        }}
      />
      <Tabs.Screen
        name="charting"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <LineChart color={color as any} size={20} />,
        }}
      />
      <Tabs.Screen
        name="strategy"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <Zap color={color as any} size={20} />,
        }}
      />
    </Tabs>
  )
}
