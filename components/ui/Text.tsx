import { H3, H4, Text, styled } from 'tamagui'

export const ScreenTitle = styled(H3, {
  name: 'ScreenTitle',
  color: '$textPrimary',
  fontFamily: '$heading',
})

export const SectionTitle = styled(H4, {
  name: 'SectionTitle',
  color: '$textPrimary',
  fontFamily: '$heading',
})

export const FieldLabel = styled(Text, {
  name: 'FieldLabel',
  color: '$textSecondary',
  fontSize: '$2',
  fontWeight: '600',
})

export const MutedText = styled(Text, {
  name: 'MutedText',
  color: '$textMuted',
  fontSize: '$2',
})

export const ValueText = styled(Text, {
  name: 'ValueText',
  color: '$textPrimary',
  fontWeight: 'bold',
})

export const ButtonText = styled(Text, {
  name: 'ButtonText',
  color: '$textPrimary',
  fontWeight: 'bold',
})

export const PrimaryButtonText = styled(Text, {
  name: 'PrimaryButtonText',
  color: '$brandPrimaryForeground',
  fontWeight: 'bold',
})

export const DestructiveButtonText = styled(Text, {
  name: 'DestructiveButtonText',
  color: '$destructiveForeground',
  fontWeight: 'bold',
})

export const SelectableRowText = styled(Text, {
  name: 'SelectableRowText',
  color: '$textPrimary',
  fontWeight: 'bold',

  variants: {
    selected: {
      true: {
        color: '$brandSecondaryForeground',
      },
    },
    emphasis: {
      strong: {
        color: '$brandPrimaryForeground',
      },
      soft: {},
    },
  } as const,
})

export const SelectableRowSubtext = styled(Text, {
  name: 'SelectableRowSubtext',
  color: '$textMuted',
  fontSize: '$2',

  variants: {
    selected: {
      true: {
        color: '$brandSecondaryForeground',
        opacity: 0.8,
      },
    },
    emphasis: {
      strong: {
        color: '$brandPrimaryForeground',
        opacity: 0.86,
      },
      soft: {},
    },
  } as const,
})
