import { Link, Stack } from 'expo-router'
import { StyleSheet } from 'react-native'
import { View, Text } from 'tamagui'
import { useTranslation } from 'react-i18next'

export default function NotFoundScreen() {
  const { t } = useTranslation()

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View m={10}>
        <Text>{t('notFound.message')}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('notFound.homeLink')}</Text>
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
})
