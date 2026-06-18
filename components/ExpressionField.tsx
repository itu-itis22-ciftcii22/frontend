import React from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { Edit3 } from '@tamagui/lucide-icons-2'
import { FieldLabel } from './ui'
import { Expr, formatExpression } from '../lib/conditions'

interface ExpressionFieldProps {
  value: Expr
  onPress: () => void
  label?: string
  disabled?: boolean
  placeholder?: string
  width?: any
  flex?: any
  flexBasis?: any
  maxWidth?: any
}

export function ExpressionField({
  value,
  onPress,
  label,
  disabled = false,
  placeholder = 'Select expression',
  width,
  flex,
  flexBasis,
  maxWidth,
}: ExpressionFieldProps) {
  const displayValue = value ? formatExpression(value) : placeholder

  const field = (
    <Button
      size="$3"
      flex={label ? undefined : flex}
      flexBasis={label ? undefined : flexBasis}
      width={width}
      maxWidth={maxWidth}
      minWidth={0}
      bg="$surfaceRaised"
      borderWidth={1}
      borderColor="$borderSubtle"
      rounded="$3"
      px="$3"
      onPress={onPress}
      disabled={disabled}
      hoverStyle={{ bg: '$surfaceHover' }}
    >
      <XStack width="100%" alignItems="center" gap="$2">
        <Text color="$textPrimary" numberOfLines={1} flex={1} textAlign="left">
          {displayValue}
        </Text>
        <Edit3 size={14} color="$textMuted" />
      </XStack>
    </Button>
  )

  if (!label) return field

  return (
    <YStack gap="$1.5" flex={flex} flexBasis={flexBasis} width={width} maxWidth={maxWidth} minWidth={0}>
      <FieldLabel>{label}</FieldLabel>
      <Button
        size="$3"
        width="100%"
        minWidth={0}
        bg="$surfaceRaised"
        borderWidth={1}
        borderColor="$borderSubtle"
        rounded="$3"
        px="$3"
        onPress={onPress}
        disabled={disabled}
        hoverStyle={{ bg: '$surfaceHover' }}
      >
        <XStack width="100%" alignItems="center" gap="$2">
          <Text color="$textPrimary" numberOfLines={1} flex={1} textAlign="left">
            {displayValue}
          </Text>
          <Edit3 size={14} color="$textMuted" />
        </XStack>
      </Button>
    </YStack>
  )
}
