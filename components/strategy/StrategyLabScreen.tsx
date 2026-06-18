import React, { useState } from 'react'
import { YStack, XStack, ScrollView, Spinner, Text, Button, Sheet } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../Button'
import { ScreenContainer } from '../ScreenContainer'
import { MutedText, PrimaryButtonText, ValueText } from '../ui'
import { BacktestParamsLayout } from './BacktestParamsLayout'
import { ResultsDashboard } from '../ResultsDashboard'
import { ListSheet } from '../ListSheet'
import { CustomAlert } from '../CustomAlert'
import { useAlert } from '../../hooks/useAlert'
import { useStrategyLabController } from '../../hooks/useStrategyLabController'
import { StrategySelectorSheet } from './StrategySelectorSheet'
import { StrategyToolbar } from './StrategyToolbar'
import { SaveStrategyDialog } from './SaveStrategyDialog'
import { RowSurface } from '../ui'
import { Surface } from '../Surface'
import { IndicatorListEditor } from '../IndicatorListEditor'
import { RuleBuilder } from '../RuleBuilder'
import { ScoringMetricsEditor } from '../ScoringMetricsEditor'
import { RuleNode, ScoreNode } from '../../lib/conditions'

type EditorSheet = 'indicators' | 'entry' | 'exit' | 'backtest' | null

function countRules(rule: RuleNode): number {
  if (rule.type === 'condition') return 1
  return rule.children.reduce((total, child) => total + countRules(child), 0)
}

function countScores(score: ScoreNode): number {
  if (score.type !== 'score_group') return 1
  return score.children.length
}

function SummaryCard({
  title,
  detail,
  children,
  onPress,
}: {
  title: string
  detail: string
  children?: React.ReactNode
  onPress: () => void
}) {
  return (
    <Surface interactive p="$3" gap="$2" onPress={onPress}>
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <ValueText fontSize="$3">{title}</ValueText>
        <Text color="$color8" fontSize="$2" numberOfLines={1} flexShrink={1}>
          {detail}
        </Text>
      </XStack>
      {children}
    </Surface>
  )
}

function EditorSheetFrame({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={[88]} snapPointsMode="percent" dismissOnSnapToBottom zIndex={130000} disableDrag={true}>
      <Sheet.Overlay transition="lazy" bg="$shadow6" />
      <Sheet.Handle />
      <Sheet.Frame transition="lazy" p="$4" gap="$4" bg="$surfaceDeep" borderTopLeftRadius="$4" borderTopRightRadius="$4">
        <ScrollView flex={1} keyboardShouldPersistTaps="always" keyboardDismissMode="none" nestedScrollEnabled showsVerticalScrollIndicator>
          <YStack gap="$4" pb="$8">
            {children}
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  )
}

export function StrategyLabScreen() {
  const { t } = useTranslation()
  const { showAlert, alertProps } = useAlert()
  const strategy = useStrategyLabController(showAlert)
  const [activeEditorSheet, setActiveEditorSheet] = useState<EditorSheet>(null)

  const indicatorNames = strategy.indicators
    .slice(0, 4)
    .map((indicator: any) => (indicator.name || indicator.indicator || '').toUpperCase())
    .filter(Boolean)
  const extraIndicatorCount = Math.max(0, strategy.indicators.length - indicatorNames.length)

  return (
    <ScreenContainer>
      <StrategyToolbar
        strategyName={strategy.stratName}
        loading={strategy.loading}
        onSelectStrategy={() => strategy.setIsStrategyListSheetOpen(true)}
        onImportChartLayout={strategy.handleOpenChartImportSheet}
        onSaveStrategy={() => {
          if (strategy.editId) {
            void strategy.handleSaveStrategy()
          } else {
            strategy.handleOpenStrategySaveDialog()
          }
        }}
        onAddIndicator={() => setActiveEditorSheet('indicators')}
      />

      <ScrollView flex={1} p="$3" contentContainerStyle={{ pb: '$10' }}>
        <YStack gap="$4">
          <YStack gap="$3">
            <SummaryCard
              title={t('chart.indicatorsTitle')}
              detail={t('strategies.selectedCount', { count: strategy.indicators.length })}
              onPress={() => setActiveEditorSheet('indicators')}
            >
              {strategy.indicators.length === 0 ? (
                <Text color="$color8" fontSize="$2">
                  {t('strategies.noIndicatorsConfigured')}
                </Text>
              ) : (
                <XStack flexWrap="wrap" gap="$2">
                  {indicatorNames.map((name) => (
                    <XStack key={name} bg="$surfaceDeep" borderWidth={1} borderColor="$borderColor" px="$2" py="$1" rounded="$6">
                      <Text color="$color11" fontSize="$1" fontWeight="700">{name}</Text>
                    </XStack>
                  ))}
                  {extraIndicatorCount > 0 && (
                    <Text color="$color8" fontSize="$2">{t('strategies.moreCount', { count: extraIndicatorCount })}</Text>
                  )}
                </XStack>
              )}
            </SummaryCard>

            <SummaryCard
              title={t('strategies.entry')}
              detail={t('strategies.ruleScoreSummary', {
                rules: countRules(strategy.entryRule),
                scores: countScores(strategy.entryScore),
                threshold: strategy.entryThreshold,
              })}
              onPress={() => setActiveEditorSheet('entry')}
            />

            <SummaryCard
              title={t('strategies.exit')}
              detail={t('strategies.ruleScoreSummary', {
                rules: countRules(strategy.exitRule),
                scores: countScores(strategy.exitScore),
                threshold: strategy.exitThreshold,
              })}
              onPress={() => setActiveEditorSheet('exit')}
            />

            <SummaryCard
              title={t('backtest.title')}
              detail={`${strategy.selectedSymbols.length ? strategy.selectedSymbols.join(', ') : t('backtest.noAssets')} - ${strategy.backtestInterval}`}
              onPress={() => setActiveEditorSheet('backtest')}
            >
              <Text color="$color8" fontSize="$2">
                {t('backtest.paramsSummary', {
                  capital: strategy.initialCapital,
                  commission: strategy.commission,
                  stopLoss: strategy.stopLoss,
                  takeProfit: strategy.takeProfit,
                })}
              </Text>
            </SummaryCard>
          </YStack>

          <PrimaryButton onPress={strategy.handleRunBacktest} disabled={strategy.backtesting || strategy.loading}>
            <PrimaryButtonText>{strategy.backtesting ? t('backtest.running') : t('backtest.run')}</PrimaryButtonText>
          </PrimaryButton>

          {strategy.backtesting && (
            <YStack py="$8" alignItems="center" justifyContent="center">
              <Spinner size="large" color="$brandSecondary" />
              <MutedText mt="$3" fontSize="$3" color="$color11">
                {t('backtest.computingMetrics')}
              </MutedText>
            </YStack>
          )}

          {strategy.backtestResults && (
            <ResultsDashboard
              results={strategy.backtestResults}
              symbol={strategy.selectedSymbols[0]}
              interval={strategy.backtestInterval}
              activeTab={strategy.activeTab}
              setActiveTab={strategy.setActiveTab}
              selectedSymbol={strategy.selectedSymbol}
              setSelectedSymbol={strategy.setSelectedSymbol}
            />
          )}
        </YStack>
      </ScrollView>

      <ListSheet
        open={strategy.isAssetPickerOpen}
        onOpenChange={strategy.setIsAssetPickerOpen}
        title={t('backtest.addAsset')}
        items={strategy.assets}
        searchRelationName="symbol"
        searchPredicate={(item, q) =>
          item.symbol.toLowerCase().includes(q.toLowerCase()) ||
          item.name.toLowerCase().includes(q.toLowerCase())
        }
        onSelect={(item) => {
          strategy.setIsAssetPickerOpen(false)
          if (!strategy.selectedSymbols.includes(item.symbol)) {
            strategy.setSelectedSymbols([...strategy.selectedSymbols, item.symbol])
          }
        }}
      />

      <StrategySelectorSheet
        open={strategy.isStrategyListSheetOpen}
        onOpenChange={strategy.setIsStrategyListSheetOpen}
        strategies={strategy.strategiesList}
        onSelectStrategy={strategy.handleSelectStrategy}
        onDeleteStrategy={strategy.handleDeleteStrategy}
      />

      <ListSheet
        open={strategy.isChartImportSheetOpen}
        onOpenChange={strategy.setIsChartImportSheetOpen}
        title={t('chart.loadLayoutTitle')}
        items={strategy.chartConfigs}
        snapPoints={[60]}
        renderItem={(cfg) => (
          <RowSurface key={cfg.id}>
            <YStack gap="$1" onPress={() => strategy.handleImportChartIndicators(cfg)} cursor="pointer" flex={1}>
              <Text fontWeight="bold" color="$color12">
                {cfg.name}
              </Text>
              <Text color="$color8" fontSize="$2">
                {(cfg.interval || '1m').toUpperCase()} - {cfg.chart_config?.indicators?.length || 0} {t('chart.indicatorsTitle')}
              </Text>
            </YStack>
          </RowSurface>
        )}
        onSelect={() => {}}
      />

      <SaveStrategyDialog
        open={strategy.isStrategySaveDialogOpen}
        onOpenChange={strategy.setIsStrategySaveDialogOpen}
        strategyName={strategy.pendingStrategyName}
        onSave={(name) => strategy.handleSaveStrategy(name)}
      />

      <EditorSheetFrame open={activeEditorSheet === 'indicators'} onOpenChange={(open) => setActiveEditorSheet(open ? 'indicators' : null)}>
        <IndicatorListEditor
          indicators={strategy.indicators}
          onAdd={(indicator) => strategy.setIndicators([...strategy.indicators, indicator])}
          onRemove={(idx) => {
            const updated = [...strategy.indicators]
            updated.splice(idx, 1)
            strategy.setIndicators(updated)
          }}
          categories={strategy.categories}
          isSelectOpen={strategy.isIndicatorPickerOpen}
          onSelectOpenChange={strategy.setIsIndicatorPickerOpen}
          compact
        />
      </EditorSheetFrame>

      <EditorSheetFrame open={activeEditorSheet === 'entry'} onOpenChange={(open) => setActiveEditorSheet(open ? 'entry' : null)}>
        <RuleBuilder
          value={strategy.entryRule}
          onChange={strategy.setEntryRule}
          availableColumns={strategy.availableColumns}
        />
        <ScoringMetricsEditor
          value={strategy.entryScore}
          onChange={strategy.setEntryScore}
          availableColumns={strategy.availableColumns}
          threshold={strategy.entryThreshold}
          onThresholdChange={strategy.setEntryThreshold}
        />
      </EditorSheetFrame>

      <EditorSheetFrame open={activeEditorSheet === 'exit'} onOpenChange={(open) => setActiveEditorSheet(open ? 'exit' : null)}>
        <RuleBuilder
          value={strategy.exitRule}
          onChange={strategy.setExitRule}
          availableColumns={strategy.availableColumns}
        />
        <ScoringMetricsEditor
          value={strategy.exitScore}
          onChange={strategy.setExitScore}
          availableColumns={strategy.availableColumns}
          threshold={strategy.exitThreshold}
          onThresholdChange={strategy.setExitThreshold}
        />
      </EditorSheetFrame>

      <EditorSheetFrame open={activeEditorSheet === 'backtest'} onOpenChange={(open) => setActiveEditorSheet(open ? 'backtest' : null)}>
        <BacktestParamsLayout
          selectedSymbols={strategy.selectedSymbols}
          setSelectedSymbols={strategy.setSelectedSymbols}
          setIsAssetPickerOpen={strategy.setIsAssetPickerOpen}
          backtestInterval={strategy.backtestInterval}
          setBacktestInterval={strategy.setBacktestInterval}
          initialCapital={strategy.initialCapital}
          setInitialCapital={strategy.setInitialCapital}
          commission={strategy.commission}
          setCommission={strategy.setCommission}
          stopLoss={strategy.stopLoss}
          setStopLoss={strategy.setStopLoss}
          takeProfit={strategy.takeProfit}
          setTakeProfit={strategy.setTakeProfit}
        />
      </EditorSheetFrame>



      <CustomAlert {...alertProps} />
    </ScreenContainer>
  )
}
