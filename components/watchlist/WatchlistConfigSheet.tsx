import React from 'react'
import { Sheet, YStack, XStack, Text, Button, Separator, ScrollView } from 'tamagui'
import { Check } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { ChartConfigResponse, StrategyResponse } from '../../lib/api/generated'
import { MutedText, PrimaryButtonText, SectionTitle, SelectableRow, SelectableRowSubtext, SelectableRowText } from '../ui'
import { PrimaryButton } from '../Button'

interface WatchlistConfigSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAssetSymbol: string | null
  chartConfigs: ChartConfigResponse[]
  strategies: StrategyResponse[]
  selectedConfigIds: number[]
  onSelectedConfigIdsChange: (ids: number[]) => void
  selectedStrategyIds: number[]
  onSelectedStrategyIdsChange: (ids: number[]) => void
  onSave: () => void
  onCancel: () => void
}

export function WatchlistConfigSheet({
  open,
  onOpenChange,
  editingAssetSymbol,
  chartConfigs,
  strategies,
  selectedConfigIds,
  onSelectedConfigIdsChange,
  selectedStrategyIds,
  onSelectedStrategyIdsChange,
  onSave,
  onCancel,
}: WatchlistConfigSheetProps) {
  const { t } = useTranslation()

  const toggleConfig = (id: number) => {
    onSelectedConfigIdsChange(
      selectedConfigIds.includes(id)
        ? selectedConfigIds.filter((selectedId) => selectedId !== id)
        : [...selectedConfigIds, id],
    )
  }

  const toggleStrategy = (id: number) => {
    onSelectedStrategyIdsChange(
      selectedStrategyIds.includes(id)
        ? selectedStrategyIds.filter((selectedId) => selectedId !== id)
        : [...selectedStrategyIds, id],
    )
  }

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[75]}
      snapPointsMode="percent"
      dismissOnSnapToBottom
      zIndex={140000}
      transition="lazy"
      disableDrag={true}
    >
      <Sheet.Overlay transition="lazy" bg="$shadow6" />
      <Sheet.Handle />
      <Sheet.Frame transition="lazy" p="$4" gap="$4" bg="$surfaceDeep" borderTopLeftRadius="$4" borderTopRightRadius="$4">
        <YStack gap="$1.5">
          <SectionTitle>{t('watchlist.editConfigurations')}</SectionTitle>
          <MutedText>{t('watchlist.configureAsset', { symbol: editingAssetSymbol })}</MutedText>
        </YStack>

        <ScrollView flex={1} keyboardShouldPersistTaps="always" keyboardDismissMode="none" nestedScrollEnabled showsVerticalScrollIndicator>
          <YStack gap="$4" pb="$8" mt="$1">
            <YStack gap="$2">
              <Text color="$color11" fontSize="$2" textTransform="uppercase" letterSpacing={1} fontWeight="bold" px="$1">
                {t('watchlist.chartLayoutProfiles')}
              </Text>
              {chartConfigs.length === 0 ? (
                <Text color="$color8" fontSize="$2" px="$1">
                  {t('watchlist.noSavedChartLayouts')}
                </Text>
              ) : (
                chartConfigs.map((cfg) => {
                  const isSelected = selectedConfigIds.includes(cfg.id)
                  return (
                    <SelectableRow key={cfg.id} selected={isSelected} onPress={() => toggleConfig(cfg.id)}>
                      <SelectableRowText selected={isSelected}>
                        {cfg.name}
                      </SelectableRowText>
                      <XStack gap="$2" alignItems="center">
                        <SelectableRowSubtext selected={isSelected}>
                          {cfg.interval.toUpperCase()} - {(cfg.chart_config as any)?.indicators?.length || 0} {t('watchlist.indicatorsAbbrev')}
                        </SelectableRowSubtext>
                        {isSelected && <Check size={16} color="$accentForeground" />}
                      </XStack>
                    </SelectableRow>
                  )
                })
              )}
            </YStack>

            <Separator borderColor="$borderColor" />

            <YStack gap="$2">
              <Text color="$color11" fontSize="$2" textTransform="uppercase" letterSpacing={1} fontWeight="bold" px="$1">
                {t('watchlist.strategiesToMonitor')}
              </Text>
              {strategies.length === 0 ? (
                <Text color="$color8" fontSize="$2" px="$1">
                  {t('watchlist.noStrategiesDefined')}
                </Text>
              ) : (
                strategies.map((strategy) => {
                  const isSelected = selectedStrategyIds.includes(strategy.id)
                  return (
                    <SelectableRow key={strategy.id} selected={isSelected} onPress={() => toggleStrategy(strategy.id)}>
                      <SelectableRowText selected={isSelected}>
                        {strategy.name}
                      </SelectableRowText>
                      {isSelected && <Check size={16} color="$accentForeground" />}
                    </SelectableRow>
                  )
                })
              )}
            </YStack>
          </YStack>
        </ScrollView>

        <XStack gap="$3" width="100%" mt="auto">
          <PrimaryButton flex={1} onPress={onSave}>
            <PrimaryButtonText>{t('common.save')}</PrimaryButtonText>
          </PrimaryButton>
          <Button flex={1} chromeless borderColor="$borderColor" borderWidth={1} onPress={onCancel}>
            <Text color="$color12">{t('common.cancel')}</Text>
          </Button>
        </XStack>
      </Sheet.Frame>
    </Sheet>
  )
}
