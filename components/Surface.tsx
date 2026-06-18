import { Card, styled } from 'tamagui'

export const Surface = styled(Card, {
  name: 'Surface',
  backgroundColor: '$surfaceRaised',
  borderColor: '$borderSubtle',
  borderWidth: 1,
  borderRadius: '$3',
  padding: '$3',

  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        hoverStyle: {
          borderColor: '$borderFocus',
        },
        pressStyle: {
          scale: 0.98,
        },
      },
    },
  } as const,
})
