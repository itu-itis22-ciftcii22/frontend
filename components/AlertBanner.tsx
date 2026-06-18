import { XStack, Text, styled } from 'tamagui'

export const AlertBannerFrame = styled(XStack, {
  name: 'AlertBannerFrame',
  gap: '$2.5',
  alignItems: 'center',
  bg: '$color2',
  p: '$2.5',
  borderRadius: '$3',
  borderWidth: 1,
  borderColor: '$borderColor',
  width: '100%',
})

export const AlertBannerText = styled(Text, {
  name: 'AlertBannerText',
  color: '$color10',
  fontSize: '$2',
  flex: 1,
})
