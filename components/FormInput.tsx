import React, { useState, useEffect } from 'react'
import { Input, XStack, styled } from 'tamagui'

export const FormInputContainer = styled(XStack, {
  name: 'FormInputContainer',
  alignItems: 'center',
  bg: '$surfaceRaised',
  borderWidth: 1,
  borderColor: '$borderSubtle',
  borderRadius: '$3',
  px: '$3',
  height: '$4',
  position: 'relative',

  variants: {
    error: {
      true: {
        borderColor: '$red8',
      },
    },
    focused: {
      true: {
        borderColor: '$borderFocus',
      },
    },
  } as const,
})

export const FormInput = styled(Input, {
  name: 'FormInput',
  flex: 1,
  borderWidth: 0,
  bg: 'transparent',
  px: '$2',
  height: '100%',
  color: '$textPrimary',
  size: '$4',
})

export const ParameterInput = styled(Input, {
  name: 'ParameterInput',
  borderWidth: 1,
  borderColor: '$borderSubtle',
  bg: '$surfaceRaised',
  borderRadius: '$3',
  px: '$3',
  height: 38,
  color: '$textPrimary',
  focusStyle: {
    borderColor: '$borderFocus',
  },
})

interface NumericInputProps {
  value: number | undefined
  onChange: (val: number | undefined) => void
  placeholder?: string
  flex?: number
  minWidth?: number
  size?: any
  disabled?: boolean
  height?: number
}

export function NumericInput({
  value,
  onChange,
  placeholder,
  flex,
  minWidth,
  size,
  disabled,
  height = 38,
}: NumericInputProps) {
  const [text, setText] = useState(value !== undefined && value !== null ? String(value) : '')

  useEffect(() => {
    setText((prev) => {
      const parsedPrev = parseFloat(prev)
      if (isNaN(parsedPrev) && (value === undefined || value === null)) return prev
      if (parsedPrev === value) return prev
      return value !== undefined && value !== null ? String(value) : ''
    })
  }, [value])

  const handleChangeText = (newText: string) => {
    setText(newText)

    if (newText.trim() === '' || newText === '-' || newText === '.') {
      onChange(undefined)
      return
    }

    const parsed = Number(newText)
    if (!isNaN(parsed)) {
      onChange(parsed)
    }
  }

  return (
    <ParameterInput
      flex={flex}
      minWidth={minWidth}
      value={text}
      onChangeText={handleChangeText}
      keyboardType="numeric"
      size={size}
      placeholder={placeholder}
      disabled={disabled}
      height={height}
    />
  )
}

