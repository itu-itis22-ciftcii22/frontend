import { Button, styled } from 'tamagui'

export const PrimaryButton = styled(Button, {
  name: 'PrimaryButton',
  bg: '$brandPrimary',
  color: '$brandPrimaryForeground',
  hoverStyle: { bg: '$brandPrimaryHover' },
  pressStyle: { scale: 0.98 },
  borderRadius: '$3',
  size: '$4',
})

export const SecondaryButton = styled(Button, {
  name: 'SecondaryButton',
  bg: '$surfaceRaised',
  borderWidth: 1,
  borderColor: '$borderSubtle',
  hoverStyle: { bg: '$surfaceHover' },
  pressStyle: { scale: 0.98 },
  borderRadius: '$3',
  size: '$4',
})

export const IconButton = styled(Button, {
  name: 'IconButton',
  chromeless: true,
  circular: true,
  pressStyle: { scale: 0.95 },
  bg: 'transparent',
  hoverStyle: { bg: '$surfaceHover' },
})
