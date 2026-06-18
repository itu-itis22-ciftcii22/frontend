import React from 'react'
import { XStack } from 'tamagui'
import { HeaderBar } from '../navigation/HeaderBar'

interface WorkspaceToolbarProps {
  leftElement: React.ReactNode
  actions: React.ReactNode
}

export function WorkspaceToolbar({ leftElement, actions }: WorkspaceToolbarProps) {
  return (
    <HeaderBar
      showProfile={false}
      leftElement={
        <XStack gap="$2" alignItems="center" flex={1} minWidth={0}>
          {leftElement}
        </XStack>
      }
      rightElement={
        <XStack gap="$2" alignItems="center">
          {actions}
        </XStack>
      }
    />
  )
}
