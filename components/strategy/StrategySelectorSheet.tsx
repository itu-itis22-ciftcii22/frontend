import React from 'react'
import { YStack, XStack, Button, Text } from 'tamagui'
import { Trash2 } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { StrategyResponse } from '../../lib/api/generated'
import { ListSheet } from '../ListSheet'

interface StrategySelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategies: StrategyResponse[]
  onSelectStrategy: (id: string) => void
  onDeleteStrategy: (id: number) => void
}

export function StrategySelectorSheet({
  open,
  onOpenChange,
  strategies,
  onSelectStrategy,
  onDeleteStrategy,
}: StrategySelectorSheetProps) {
  const { t } = useTranslation()

  return (
    <ListSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('strategies.selectStrategy')}
      items={[
        { id: 'new', name: `+ ${t('strategies.createStrategy')}`, isNew: true },
        ...strategies.map((strategy) => ({ ...strategy, id: String(strategy.id), isNew: false })),
      ] as any[]}
      snapPoints={[60]}
      renderItem={(item) => {
        const strategy = item as any
        const json = strategy.strategy_json || {}
        const isCompatible = strategy.isNew || json.strategy_version === 2
        return (
          <XStack
            key={strategy.id}
            justifyContent="space-between"
            alignItems="center"
            bg="$surfaceCard"
            p="$3"
            rounded="$3"
            borderWidth={1}
            borderColor="$borderColor"
            mb="$2"
          >
            <YStack
              gap="$1"
              onPress={() => {
                onSelectStrategy(String(strategy.id))
                onOpenChange(false)
              }}
              cursor="pointer"
              flex={1}
            >
              <Text fontWeight="bold" color="$color12">
                {strategy.name}
              </Text>
              {!strategy.isNew && (
                <Text color="$color8" fontSize="$2">
                  {isCompatible ? t('strategies.ruleScoringStrategy') : t('strategies.incompatibleLegacyStrategy')}
                </Text>
              )}
            </YStack>
            {!strategy.isNew && (
              <Button
                size="$2.5"
                chromeless
                circular
                theme="red"
                icon={Trash2}
                onPress={() => {
                  onDeleteStrategy(Number(strategy.id))
                  onOpenChange(false)
                }}
              />
            )}
          </XStack>
        )
      }}
      onSelect={() => {}}
    />
  )
}
