import React from 'react'
import { Link } from 'expo-router'
import { XStack, YStack, Text, View, Button } from 'tamagui'
import { Eye, EyeOff } from '@tamagui/lucide-icons-2'
import { Surface } from '../Surface'
import { FormInput, FormInputContainer } from '../FormInput'
import { FieldLabel, MutedText, ScreenTitle } from '../ui'

interface AuthCardProps {
  children: React.ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <Surface width="100%" maxWidth={400} p="$6" gap="$4" elevation="$3">
      {children}
    </Surface>
  )
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <YStack gap="$2" alignItems="center" pb="$2">
      <ScreenTitle>{title}</ScreenTitle>
      <MutedText fontSize="$3" textAlign="center">
        {subtitle}
      </MutedText>
    </YStack>
  )
}

interface AuthFieldProps extends React.ComponentProps<typeof FormInput> {
  label: string
  errorLabel?: string
  hasError?: boolean
  focused?: boolean
  icon?: React.ReactNode
  afterInput?: React.ReactNode
}

export function AuthField({
  label,
  errorLabel,
  hasError,
  focused,
  icon,
  afterInput,
  ...inputProps
}: AuthFieldProps) {
  return (
    <YStack gap="$1.5">
      <XStack justifyContent="space-between" alignItems="center">
        <FieldLabel>{label}</FieldLabel>
        {hasError && errorLabel ? (
          <Text color="$red10" fontSize="$1">
            {errorLabel}
          </Text>
        ) : null}
      </XStack>
      <FormInputContainer error={hasError} focused={focused}>
        {icon ? <View width={24} alignItems="center" justifyContent="center">{icon}</View> : null}
        <FormInput {...inputProps} />
        {afterInput}
      </FormInputContainer>
    </YStack>
  )
}

interface PasswordFieldProps extends AuthFieldProps {
  shown: boolean
  onToggleShown: () => void
  visibleIcon?: React.ReactNode
  hiddenIcon?: React.ReactNode
}

export function PasswordField({
  shown,
  onToggleShown,
  visibleIcon,
  hiddenIcon,
  ...fieldProps
}: PasswordFieldProps) {
  return (
    <AuthField
      {...fieldProps}
      paddingRight={32}
      secureTextEntry={!shown}
      afterInput={
        <Button
          position="absolute"
          right="$3"
          zIndex={10}
          p="$1"
          bg="transparent"
          chromeless
          onPress={onToggleShown}
          hoverStyle={{ bg: 'transparent' }}
          pressStyle={{ bg: 'transparent', opacity: 0.7 }}
        >
          {shown ? (hiddenIcon || <EyeOff size={16} color="$color8" />) : (visibleIcon || <Eye size={16} color="$color8" />)}
        </Button>
      }
    />
  )
}

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string
  href: string
  label: string
}) {
  return (
    <XStack justifyContent="center" gap="$2" mt="$2">
      <MutedText>{prompt}</MutedText>
      <Link href={href as any} asChild>
        <Text color="$brandSecondary" fontSize="$2" fontWeight="600" cursor="pointer">
          {label}
        </Text>
      </Link>
    </XStack>
  )
}
