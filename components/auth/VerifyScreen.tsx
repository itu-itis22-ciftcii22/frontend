import React, { useState, useEffect } from 'react'
import { YStack, XStack, Button, Spinner, Theme } from 'tamagui'
import { verifyEmailAuthVerifyEmailPost as verifyEmail, resendVerificationAuthResendVerificationPost as resendVerification } from '../../lib/api/generated'
import { router, useLocalSearchParams } from 'expo-router'
import { Mail, Shield, AlertTriangle, CheckCircle, ArrowLeft } from '@tamagui/lucide-icons-2'
import { CustomAlert } from '../CustomAlert'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '../ScreenContainer'
import { PrimaryButton } from '../Button'
import { AlertBannerFrame, AlertBannerText } from '../AlertBanner'
import { useAlert } from '../../hooks/useAlert'
import { AuthCard, AuthField, AuthHeader } from './AuthCard'
import { ButtonText, MutedText, PrimaryButtonText } from '../ui'
import { isValidEmail, isValidOtpCode, normalizeOtpCode } from '../../lib/validation'

export function VerifyScreen() {
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ email?: string }>()
  const [email, setEmail] = useState(params.email || '')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isCodeFocused, setIsCodeFocused] = useState(false)
  const { showAlert, alertProps } = useAlert()

  useEffect(() => {
    if (params.email) setEmail(params.email)
  }, [params.email])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleVerify = async () => {
    if (!email || !code) {
      setError(t('auth.pleaseFill'))
      return
    }
    if (!isValidEmail(email)) {
      setError(t('auth.invalidEmailAlert'))
      return
    }
    if (!isValidOtpCode(code)) {
      setError(t('auth.sixDigitsAlert'))
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await verifyEmail({ body: { email, code } })
      const msg = (res as any)?.message || t('auth.verifiedSuccess')
      setSuccess(msg)
      showAlert(t('auth.verifiedTitle'), msg, 'success')
      setTimeout(() => {
        router.replace('/login' as any)
      }, 3000)
    } catch (e: any) {
      setError(e.message || t('auth.verificationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError(t('auth.enterEmailResend'))
      return
    }
    if (!isValidEmail(email)) {
      setError(t('auth.invalidEmailAlert'))
      return
    }

    setError(null)
    setSuccess(null)
    try {
      const res = await resendVerification({ body: { email } })
      showAlert(t('auth.codeSentTitle'), (res as any)?.message || t('auth.codeSentDesc'), 'success')
      setCooldown(60)
    } catch (e: any) {
      setError(e.message || t('auth.resendFailed'))
    }
  }

  const emailError = !!(error && (!email || (email !== '' && !isValidEmail(email))))
  const codeError = !!(error && (!code || !isValidOtpCode(code)))

  return (
    <ScreenContainer justifyContent="center" alignItems="center" p="$4">
      <AuthCard>
        <AuthHeader title={t('auth.verifyTitle')} subtitle={t('auth.verifySubtitle')} />
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
              <CheckCircle size={18} color="$color10" />
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

          <AuthField
            label={t('auth.verifyButton')}
            errorLabel={t('auth.codeRequired')}
            hasError={codeError}
            focused={isCodeFocused}
            icon={<Shield size={16} color={codeError ? '$red8' : '$color8'} />}
            value={code}
            onChangeText={(val) => {
              setCode(normalizeOtpCode(val))
              if (error) setError(null)
            }}
            onFocus={() => setIsCodeFocused(true)}
            onBlur={() => setIsCodeFocused(false)}
            placeholder={t('auth.codePlaceholder')}
            keyboardType="number-pad"
            maxLength={6}
            fontFamily={'monospace' as any}
            letterSpacing={2}
          />
        </YStack>

        <PrimaryButton mt="$2" onPress={handleVerify} disabled={loading}>
          {loading ? (
            <XStack gap="$2" alignItems="center" justifyContent="center">
              <Spinner color="$color12" />
              <PrimaryButtonText>{t('auth.verifying')}</PrimaryButtonText>
            </XStack>
          ) : (
            <PrimaryButtonText>{t('auth.verifyButton')}</PrimaryButtonText>
          )}
        </PrimaryButton>

        <XStack justifyContent="space-between" alignItems="center" mt="$2">
          <Button size="$3" chromeless bg="transparent" onPress={() => router.replace('/login' as any)} icon={ArrowLeft} p="$1">
            <MutedText fontWeight="600">{t('auth.backToLogin')}</MutedText>
          </Button>

          <Button
            size="$3"
            bg="transparent"
            borderWidth={1}
            borderColor={cooldown > 0 ? '$surfaceSubtle' : '$borderSubtle'}
            onPress={handleResend}
            disabled={cooldown > 0}
            px="$3"
            borderRadius="$3"
          >
            <ButtonText color={cooldown > 0 ? '$textMuted' : '$textPrimary'} fontSize="$2">
              {cooldown > 0 ? t('auth.resendCooldown', { seconds: cooldown }) : t('auth.resendCode')}
            </ButtonText>
          </Button>
        </XStack>
      </AuthCard>

      <CustomAlert {...alertProps} />
    </ScreenContainer>
  )
}
