import { Button, XStack, styled } from 'tamagui'

export const TabToggleFrame = styled(XStack, {
  name: 'TabToggleFrame',
  bg: '$surfaceSubtle',
  p: '$1',
  borderRadius: '$3',
  self: 'center',
  width: '100%',
})

export const TabToggleButton = styled(Button, {
  name: 'TabToggleButton',
  flex: 1,
  size: '$3',
  borderRadius: '$3',
  borderWidth: 0,

  variants: {
    active: {
      true: {
        bg: '$brandSecondarySoft',
        hoverStyle: { bg: '$brandSecondarySoft' },
      },
      false: {
        bg: 'transparent',
        hoverStyle: { bg: '$surfaceHover' },
      }
    }
  } as const,
})
