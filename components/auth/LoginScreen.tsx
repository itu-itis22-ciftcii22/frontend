import React, { useState } from 'react'
import { YStack, XStack, Text, Spinner, View, Theme } from 'tamagui'
import { Platform } from 'react-native'
import { useAuth } from '../../lib/auth'
import { router } from 'expo-router'
import { LogIn, Mail, Lock, AlertTriangle } from '@tamagui/lucide-icons-2'
import { CustomAlert } from '../CustomAlert'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '../ScreenContainer'
import { PrimaryButton, SecondaryButton } from '../Button'
import { AlertBannerFrame, AlertBannerText } from '../AlertBanner'
import { useAlert } from '../../hooks/useAlert'
import { AuthCard, AuthField, AuthFooterLink, AuthHeader, PasswordField } from './AuthCard'
import { ButtonText, DividerLabel, MutedText, PrimaryButtonText } from '../ui'
import { SavedAccountsPanel } from './SavedAccountsPanel'

export function LoginScreen() {
  const { t } = useTranslation()
  const { login, isAuthenticated, savedAccounts, switchAccount, removeSavedAccount } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { showAlert, alertProps } = useAlert()

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/' as any)
    }
  }, [isAuthenticated])

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth.pleaseFill'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      router.replace('/' as any)
    } catch (e: any) {
      setError(e.message || t('auth.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchSavedAccount = async (accountEmail: string) => {
    setLoading(true)
    try {
      await switchAccount(accountEmail)
      router.replace('/' as any)
    } catch (e: any) {
      setError(e.message || 'Failed to login as saved profile')
    } finally {
      setLoading(false)
    }
  }

  const emailError = !!(error && !email)
  const passwordError = !!(error && !password)

  return (
    <ScreenContainer justifyContent="center" alignItems="center" p="$4">
      <AuthCard>
        <AuthHeader title={t('auth.appName')} subtitle={t('auth.appSubtitle')} />
        {error && (
          <Theme name="red">
            <AlertBannerFrame>
              <AlertTriangle size={18} color="$color10" />
              <AlertBannerText>{error}</AlertBannerText>
            </AlertBannerFrame>
          </Theme>
        )}

        <SavedAccountsPanel
          accounts={savedAccounts}
          onSwitchAccount={handleSwitchSavedAccount}
          onRemoveAccount={removeSavedAccount}
        />

        <YStack gap="$3">
          <AuthField
            label={t('auth.usernameOrEmail')}
            errorLabel={t('auth.required')}
            hasError={emailError}
            focused={isEmailFocused}
            icon={<Mail size={16} color={emailError ? '$red8' : '$color8'} />}
            value={email}
            onChangeText={(val) => {
              setEmail(val)
              if (error) setError(null)
            }}
            onFocus={() => setIsEmailFocused(true)}
            onBlur={() => setIsEmailFocused(false)}
            placeholder={t('auth.usernamePlaceholder')}
            autoCapitalize="none"
          />

          <PasswordField
            label={t('auth.password')}
            errorLabel={t('auth.required')}
            hasError={passwordError}
            focused={isPasswordFocused}
            icon={<Lock size={16} color={passwordError ? '$red8' : '$color8'} />}
            shown={showPassword}
            onToggleShown={() => setShowPassword(!showPassword)}
            value={password}
            onChangeText={(val) => {
              setPassword(val)
              if (error) setError(null)
            }}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
            {...(Platform.OS === 'web' ? { type: showPassword ? 'text' : 'password' } : {})}
            placeholder={t('auth.passwordPlaceholder')}
            autoCapitalize="none"
          />
        </YStack>

        <PrimaryButton mt="$2" onPress={handleLogin} disabled={loading}>
          {loading ? (
            <XStack gap="$2" alignItems="center" justifyContent="center">
              <Spinner color="$color12" />
              <PrimaryButtonText>{t('auth.signingIn')}</PrimaryButtonText>
            </XStack>
          ) : (
            <XStack gap="$2" alignItems="center" justifyContent="center">
              <LogIn size={18} color="$color12" />
              <PrimaryButtonText>{t('auth.signIn')}</PrimaryButtonText>
            </XStack>
          )}
        </PrimaryButton>

        <DividerLabel>
          <View height={1} flex={1} bg="$borderColor" />
          <MutedText>{t('auth.or')}</MutedText>
          <View height={1} flex={1} bg="$borderColor" />
        </DividerLabel>

        <SecondaryButton onPress={() => showAlert(t('auth.googleAuthTitle'), t('auth.googleAuthDesc'), 'info')}>
          <ButtonText>{t('auth.signInWithGoogle')}</ButtonText>
        </SecondaryButton>

        <AuthFooterLink prompt={t('auth.noAccount')} href="/register" label={t('auth.signUp')} />
      </AuthCard>

      <CustomAlert {...alertProps} />
    </ScreenContainer>
  )
}
