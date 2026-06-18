import { Accordion, Button, ScrollView, XStack, YStack, styled } from 'tamagui'

export const PageScroll = styled(ScrollView, {
  name: 'PageScroll',
  flex: 1,
  p: '$3',
})

export const LoadingState = styled(YStack, {
  name: 'LoadingState',
  py: '$8',
  alignItems: 'center',
  justifyContent: 'center',
})

export const CenteredState = styled(YStack, {
  name: 'CenteredState',
  py: '$12',
  px: '$6',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$3',
})

export const LoadingOverlay = styled(YStack, {
  name: 'LoadingOverlay',
  position: 'absolute',
  t: 0,
  l: 0,
  r: 0,
  b: 0,
  bg: '$surfaceBase',
  opacity: 0.7,
  justifyContent: 'center',
  alignItems: 'center',
  z: 20,
})

export const EmptyState = styled(YStack, {
  name: 'EmptyState',
  py: '$12',
  alignItems: 'center',
  gap: '$3',
})

export const Pill = styled(XStack, {
  name: 'Pill',
  bg: '$surfaceSubtle',
  px: '$2',
  py: '$1',
  rounded: '$6',
  borderWidth: 1,
  borderColor: '$borderSubtle',
})

export const DividerLabel = styled(XStack, {
  name: 'DividerLabel',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '$2',
  my: '$1',
})

export const SheetFrame = styled(YStack, {
  name: 'SheetFrame',
  p: '$4',
  gap: '$4',
  bg: '$surfaceBase',
  borderTopLeftRadius: '$4',
  borderTopRightRadius: '$4',
})

export const SelectableRow = styled(Button, {
  name: 'SelectableRow',
  justifyContent: 'space-between',
  bg: '$surfaceRaised',
  rounded: '$3',
  borderWidth: 1,
  borderColor: '$borderSubtle',
  hoverStyle: { bg: '$surfaceHover' },

  variants: {
    selected: {
      true: {
        bg: '$brandSecondarySoft',
        borderColor: '$borderFocus',
        hoverStyle: { bg: '$brandSecondarySoft' },
      },
    },
    emphasis: {
      strong: {
        bg: '$brandPrimary',
        borderColor: '$brandPrimary',
        hoverStyle: { bg: '$brandPrimaryHover' },
      },
      soft: {},
    },
  } as const,
})

export const InteractiveRow = styled(XStack, {
  name: 'InteractiveRow',
  justifyContent: 'space-between',
  alignItems: 'center',
  bg: '$surfaceRaised',
  p: '$2',
  px: '$3',
  rounded: '$3',
  borderWidth: 1,
  borderColor: '$borderSubtle',
  hoverStyle: {
    bg: '$surfaceHover',
    borderColor: '$borderSubtle',
  },

  variants: {
    selected: {
      true: {
        bg: '$brandSecondarySoft',
        borderColor: '$borderFocus',
        hoverStyle: { bg: '$brandSecondarySoft' },
      },
    },
    emphasis: {
      strong: {
        bg: '$brandPrimary',
        borderColor: '$brandPrimary',
        hoverStyle: { bg: '$brandPrimaryHover' },
      },
      soft: {},
    },
  } as const,
})

export const RowSurface = styled(XStack, {
  name: 'RowSurface',
  justifyContent: 'space-between',
  alignItems: 'center',
  bg: '$surfaceRaised',
  p: '$3',
  rounded: '$3',
  borderWidth: 1,
  borderColor: '$borderSubtle',
})

export const AccordionCard = styled(Accordion.Item, {
  name: 'AccordionCard',
  borderWidth: 1,
  borderColor: '$borderSubtle',
  borderRadius: '$10',
  overflow: 'hidden',
  bg: '$surfaceRaised',
})

export const AccordionTriggerRow = styled(Accordion.Trigger, {
  name: 'AccordionTriggerRow',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  px: '$3',
  py: '$2.5',
  bg: 'transparent',
  backgroundColor: 'transparent',
  hoverStyle: { bg: 'transparent', opacity: 0.88 },
  pressStyle: { bg: 'transparent', opacity: 0.78 },
})

export const AccordionContentFrame = styled(Accordion.Content, {
  name: 'AccordionContentFrame',
  bg: 'transparent',
  backgroundColor: 'transparent',
  borderTopWidth: 0,
  borderTopColor: 'transparent',
})
