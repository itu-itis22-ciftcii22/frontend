import React, { useState } from 'react'
import { YStack, XStack, Spinner, Theme } from 'tamagui'
import { Platform } from 'react-native'
import { UserPlus, Mail, Lock, AlertTriangle } from '@tamagui/lucide-icons-2'
import { CustomAlert } from '../CustomAlert'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '../ScreenContainer'
import { PrimaryButton } from '../Button'
import { AlertBannerFrame, AlertBannerText } from '../AlertBanner'
import { registerAuthRegisterPost as apiRegister } from '../../lib/api/generated'
import { router } from 'expo-router'
import { useAlert } from '../../hooks/useAlert'
import { AuthCard, AuthField, AuthFooterLink, AuthHeader, PasswordField } from './AuthCard'
import { PrimaryButtonText } from '../ui'
import { isValidEmail } from '../../lib/validation'

export function RegisterScreen() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { showAlert, alertProps } = useAlert()

  const handleRegister = async () => {
    if (!email || !password) {
      setError(t('auth.pleaseFill'))
      return
    }
    if (!isValidEmail(email)) {
      setError(t('auth.invalidEmailAlert'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordMinLengthAlert'))
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiRegister({ body: { email, password } })
      setSuccess(res?.message || t('auth.registrationSuccessMsg'))
      showAlert(t('auth.registrationSuccessfulTitle'), res?.message || t('auth.registrationSuccessfulDesc'), 'success')
      setTimeout(() => {
        router.replace('/login' as any)
      }, 3000)
    } catch (e: any) {
      setError(e.message || t('auth.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const emailError = !!(error && (!email || (email !== '' && !isValidEmail(email))))
  const passwordError = !!(error && (!password || (password !== '' && password.length < 6)))

  return (
    <ScreenContainer justifyContent="center" alignItems="center" p="$4">
      <AuthCard>
        <AuthHeader title={t('auth.registerTitle')} subtitle={t('auth.joinPlatform')} />
        {error && (
          <Theme name="red">
            <AlertBannerFrame>
              <AlertTriangle size={18} color="$color10" />
              <AlertBannerText>{error}</AlertBannerText>
            </AlertBannerFrame>
          </Theme>
        )}

        {success && (
          <Theme name="green">
            <AlertBannerFrame>
              <AlertBannerText>{success}</AlertBannerText>
            </AlertBannerFrame>
          </Theme>
        )}

        <YStack gap="$3">
          <AuthField
            label={t('auth.email')}
            errorLabel={t('auth.invalidEmail')}
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
            placeholder={t('auth.emailPlaceholder')}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <PasswordField
            label={t('auth.password')}
            errorLabel={t('auth.minCharsError')}
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
            placeholder={t('auth.passwordPlaceholderRegister')}
            autoCapitalize="none"
          />
        </YStack>

        <PrimaryButton mt="$2" onPress={handleRegister} disabled={loading}>
          {loading ? (
            <XStack gap="$2" alignItems="center" justifyContent="center">
              <Spinner color="$color12" />
              <PrimaryButtonText>{t('auth.creatingAccount')}</PrimaryButtonText>
            </XStack>
          ) : (
            <XStack gap="$2" alignItems="center" justifyContent="center">
              <UserPlus size={18} color="$color12" />
              <PrimaryButtonText>{t('auth.signUp')}</PrimaryButtonText>
            </XStack>
          )}
        </PrimaryButton>

        <AuthFooterLink prompt={t('auth.hasAccount')} href="/login" label={t('auth.signIn')} />
      </AuthCard>

      <CustomAlert {...alertProps} />
    </ScreenContainer>
  )
}
