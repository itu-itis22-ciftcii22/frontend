import React from 'react'
import { Button, Text, XStack } from 'tamagui'
import { ChevronDown, FolderOpen, Plus, Save } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../Button'
import { WorkspaceToolbar } from '../workspace/WorkspaceToolbar'

interface ChartToolbarProps {
  currentSymbol: string
  interval: string
  onChangeInterval: (interval: string) => void
  onSelectSymbol: () => void
  onLoadLayout: () => void
  onSaveLayout: () => void
  onAddIndicator: () => void
}

export function ChartToolbar({
  currentSymbol,
  interval,
  onChangeInterval,
  onSelectSymbol,
  onLoadLayout,
  onSaveLayout,
  onAddIndicator,
}: ChartToolbarProps) {
  const { t } = useTranslation()

  return (
    <WorkspaceToolbar
      leftElement={
        <>
          <Button
            bg="$surfaceCard"
            borderColor="$borderColor"
            borderWidth={1}
            size="$3.5"
            rounded="$3"
            minWidth={116}
            maxWidth={260}
            justifyContent="space-between"
            iconAfter={<ChevronDown size={14} color="$color8" />}
            onPress={onSelectSymbol}
          >
            <Text color="$color12" fontWeight="bold" numberOfLines={1} flexShrink={1}>
              {currentSymbol || t('chart.selectSymbol')}
            </Text>
          </Button>
          <XStack bg="$surfaceDeep" p="$0.5" rounded="$3" borderWidth={1} borderColor="$borderColor" gap="$1">
            {(['1m', '1d'] as const).map((tf) => (
              <Button
                key={tf}
                size="$2.5"
                bg={interval === tf ? '$brandGoldSoft' : 'transparent'}
                borderWidth={0}
                rounded="$2"
                px="$3"
                onPress={() => onChangeInterval(tf)}
              >
                <Text
                  color={interval === tf ? '$brandGold' : '$textMuted'}
                  fontWeight="bold"
                >
                  {tf.toUpperCase()}
                </Text>
              </Button>
            ))}
          </XStack>
        </>
      }
      actions={
        <>
          <Button
            size="$3.5"
            chromeless
            circular
            icon={FolderOpen}
            hoverStyle={{ bg: '$surfaceHover' }}
            onPress={onLoadLayout}
            aria-label={t('chart.loadLayoutTitle')}
          />
          <Button
            size="$3.5"
            chromeless
            circular
            icon={Save}
            hoverStyle={{ bg: '$surfaceHover' }}
            onPress={onSaveLayout}
            aria-label={t('common.save')}
          />
          <PrimaryButton size="$3.5" icon={Plus} circular onPress={onAddIndicator} aria-label={t('chart.indicatorsTitle')} />
        </>
      }
    />
  )
}
