import React, { useEffect, useMemo, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import {
  YStack,
  XStack,
  Text,
  Card,
  ScrollView,
  Theme,
  styled,
  Button,
  Separator,
} from 'tamagui'
import { ChevronDown } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { SectionTitle } from './ui'
import { BacktestPriceSignalChart } from './backtest/BacktestPriceSignalChart'
import { ListSheet } from './ListSheet'

interface ResultsDashboardProps {
  results: any
  symbol?: string
  interval: string
  activeTab?: 'summary' | 'per_asset'
  setActiveTab?: (tab: 'summary' | 'per_asset') => void
  selectedSymbol?: string
  setSelectedSymbol?: (symbol: string) => void
}

const MetricCard = styled(Card, {
  name: 'MetricCard',
  boxShadow: '0 2px 8px $shadow3',
  borderWidth: 1,
  borderColor: '$borderColor',
  p: '$2.5',
  flexGrow: 0,
  flexShrink: 0,
  minH: 80,
  bg: '$surfaceCard',
  rounded: '$3',
  transition: 'quick',
  hoverStyle: { borderColor: '$borderColor', scale: 1.02 },
})

const PRIORITY_METRICS = [
  'cagr',
  'Return [%]',
  'sharpe',
  'Sharpe Ratio',
  'sortino',
  'Sortino Ratio',
  'max_drawdown',
  'Max Drawdown [%]',
  'win_rate',
  'Win Rate [%]',
  'Total Trades',
  'Profit Factor',
  'Expectancy',
  'r_squared',
]

const PERCENT_METRICS = new Set([
  'cagr',
  'max_drawdown',
  'win_rate',
  'Return [%]',
  'Buy & Hold Return [%]',
  'Win Rate [%]',
  'Max Drawdown [%]',
])

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const titleize = (key: string, t: (key: string) => string) => {
  const metricLabels: Record<string, string> = {
    cagr: t('backtest.metricCagr'),
    sharpe: t('backtest.metricSharpe'),
    sortino: t('backtest.metricSortino'),
    max_drawdown: t('backtest.metricMaxDrawdown'),
    win_rate: t('backtest.metricWinRate'),
    r_squared: t('backtest.metricR2'),
    'Return [%]': t('common.return'),
    'Buy & Hold Return [%]': t('backtest.metricBuyHold'),
    'Win Rate [%]': t('backtest.metricWinRate'),
    'Sharpe Ratio': t('backtest.metricSharpe'),
    'Sortino Ratio': t('backtest.metricSortino'),
    'Max Drawdown [%]': t('backtest.metricMaxDrawdown'),
    'Total Trades': t('backtest.metricTotalTrades'),
    'Profit Factor': t('backtest.metricProfitFactor'),
    Expectancy: t('backtest.metricExpectancy'),
  }

  return metricLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatMetricValue = (key: string, value: any) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  if (!isFiniteNumber(value)) return String(value)

  if (PERCENT_METRICS.has(key)) {
    const percent = Math.abs(value) <= 1 ? value * 100 : value
    return `${percent.toFixed(2)}%`
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

const metricTone = (key: string, value: any) => {
  if (!isFiniteNumber(value)) return undefined
  if (key.toLowerCase().includes('drawdown')) return value <= 0 ? false : true
  if (key.toLowerCase().includes('win')) {
    return value >= (Math.abs(value) <= 1 ? 0.5 : 50)
  }
  if (['cagr', 'Return [%]', 'sharpe', 'sortino', 'Profit Factor', 'Expectancy'].includes(key)) {
    return value >= 0
  }
  return undefined
}

const getResultAtPath = (results: any, threshold: string | null) => {
  if (!threshold || !results?.results) return results
  return results.results[threshold] || results
}

const getCurrentDataset = (
  results: any,
  activeTab: 'summary' | 'per_asset',
  selectedSymbol: string,
) => {
  const isPortfolio = Array.isArray(results?.symbols) && results.symbols.length > 0

  if (activeTab === 'summary' && isPortfolio) {
    return {
      label: 'Portfolio',
      metrics: results.aggregated?.metrics || {},
      plots: results.aggregated?.plots || {},
      trades: [],
      candles: [],
      entries: [],
      exits: [],
    }
  }

  if (isPortfolio) {
    const asset = results.per_asset?.[selectedSymbol] || {}
    return {
      label: selectedSymbol,
      metrics: asset.metrics || {},
      plots: asset.plots || {},
      trades: asset.trades || [],
      candles: asset.candles || [],
      entries: asset.entries || [],
      exits: asset.exits || [],
    }
  }

  return {
    label: results?.symbol || selectedSymbol,
    metrics: results?.metrics || {},
    plots: results?.plots || {},
    trades: results?.trades || [],
    candles: results?.candles || [],
    entries: results?.entries || [],
    exits: results?.exits || [],
  }
}

export function ResultsDashboard({
  results,
  symbol,
  interval,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  selectedSymbol: propSelectedSymbol,
  setSelectedSymbol: propSelectedSymbolSetter,
}: ResultsDashboardProps) {
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const isThinScreen = width < 550
  const thresholdKeys = useMemo(
    () => (results?.results ? Object.keys(results.results) : []),
    [results],
  )
  const [selectedThreshold, setSelectedThreshold] = useState('')
  const selectedResults = getResultAtPath(results, selectedThreshold || null)
  const isPortfolio = !!(selectedResults?.symbols && selectedResults.symbols.length > 0)
  const symbolsList = isPortfolio ? selectedResults.symbols : []

  // Fallback to local state if props are not provided
  const [localActiveTab, localSetActiveTab] = useState<'summary' | 'per_asset'>(
    isPortfolio ? 'summary' : 'per_asset',
  )
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : localSetActiveTab

  const [localSelectedSymbol, localSetSelectedSymbol] = useState(
    symbolsList[0] || selectedResults?.symbol || symbol || '',
  )
  const selectedSymbol = propSelectedSymbol !== undefined ? propSelectedSymbol : localSelectedSymbol
  const setSelectedSymbol = propSelectedSymbolSetter !== undefined ? propSelectedSymbolSetter : localSetSelectedSymbol
  const [isAssetSelectSheetOpen, setIsAssetSelectSheetOpen] = useState(false)

  useEffect(() => {
    if (thresholdKeys.length > 0 && !selectedThreshold) {
      setSelectedThreshold(thresholdKeys[0])
    }
  }, [thresholdKeys, selectedThreshold])

  useEffect(() => {
    if (!selectedResults) return
    const nextIsPortfolio = selectedResults.symbols && selectedResults.symbols.length > 0
    const defaultSym = nextIsPortfolio ? selectedResults.symbols[0] : selectedResults.symbol || symbol || ''
    setSelectedSymbol(defaultSym)
    setActiveTab(nextIsPortfolio ? 'summary' : 'per_asset')
  }, [selectedResults, symbol])

  const current = useMemo(
    () => getCurrentDataset(selectedResults, activeTab, selectedSymbol),
    [selectedResults, activeTab, selectedSymbol],
  )

  if (!results || !selectedResults) return null

  const metricKeys = Object.keys(current.metrics || {})
  const orderedMetricKeys = [
    ...PRIORITY_METRICS.filter((key) => metricKeys.includes(key)),
    ...metricKeys.filter((key) => !PRIORITY_METRICS.includes(key)),
  ]
  const chartKey = `${selectedThreshold || 'single'}:${selectedSymbol}:${interval}:${current.candles.length}:${current.entries.length}:${current.exits.length}`

  const renderMetricCard = (key: string) => {
    const value = current.metrics[key]
    const tone = metricTone(key, value)
    const content = (
      <MetricCard width={isThinScreen ? '47%' : 130}>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$0.5">
          <Text fontSize="$1" color="$brandGold" textAlign="center" fontWeight="600" flexWrap="wrap" width="100%">
            {titleize(key, t)}
          </Text>
          <Text
            fontSize="$4"
            fontWeight="bold"
            color={tone !== undefined ? '$color10' : '$color12'}
            textAlign="center"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatMetricValue(key, value)}
          </Text>
        </YStack>
      </MetricCard>
    )

    if (tone === true) return <Theme name="green" key={key}>{content}</Theme>
    if (tone === false) return <Theme name="red" key={key}>{content}</Theme>
    return <React.Fragment key={key}>{content}</React.Fragment>
  }

  return (
    <Card elevation="$1" borderWidth={1} borderColor="$borderColor" padding="$4" bg="$surfaceCard" borderRadius="$4" gap="$4">
      {thresholdKeys.length > 0 && (
        <XStack alignItems="center" gap="$2.5" flexWrap="wrap">
          <Text fontSize="$3" color="$color11" fontWeight="600">
            {t('backtest.thresholdLabel')}
          </Text>
          <XStack gap="$2" flexWrap="wrap">
            {thresholdKeys.map((key) => {
              const isActive = selectedThreshold === key || (!selectedThreshold && thresholdKeys[0] === key)
              return (
                <Button
                  key={key}
                  size="$2.5"
                  bg={isActive ? '$brandSecondarySoft' : '$surfaceCard'}
                  borderColor={isActive ? '$brandSecondary' : '$borderColor'}
                  borderWidth={1}
                  hoverStyle={{ bg: '$surfaceHover' }}
                  onPress={() => setSelectedThreshold(key)}
                  px="$3"
                  rounded="$3"
                >
                  <Text color={isActive ? '$brandSecondaryForeground' : '$color12'} fontWeight="bold">
                    {key}
                  </Text>
                </Button>
              )
            })}
          </XStack>
        </XStack>
      )}

      {isPortfolio && (
        <XStack
          bg="$surfaceDeep"
          p="$1"
          borderRadius="$3"
          self={isThinScreen ? 'stretch' : 'flex-start'}
          width={isThinScreen ? '100%' : undefined}
          gap="$2"
        >
          <Button
            size="$3"
            flex={isThinScreen ? 1 : undefined}
            justifyContent="center"
            bg={activeTab === 'summary' ? '$brandSecondarySoft' : 'transparent'}
            onPress={() => setActiveTab('summary')}
            rounded="$3"
            borderWidth={0}
          >
            <Text color={activeTab === 'summary' ? '$brandSecondaryForeground' : '$textMuted'} fontWeight="bold">
              {t('backtest.portfolioSummary', { defaultValue: 'Aggregate' })}
            </Text>
          </Button>
          <Button
            size="$3"
            flex={isThinScreen ? 1 : undefined}
            justifyContent="center"
            bg={activeTab === 'per_asset' ? '$brandSecondarySoft' : 'transparent'}
            onPress={() => setActiveTab('per_asset')}
            rounded="$3"
            borderWidth={0}
          >
            <Text color={activeTab === 'per_asset' ? '$brandSecondaryForeground' : '$textMuted'} fontWeight="bold">
              {t('backtest.perAssetBreakdown', { defaultValue: 'Per Asset' })}
            </Text>
          </Button>
        </XStack>
      )}

      {activeTab === 'per_asset' && isPortfolio && symbolsList.length > 0 && (
        <XStack alignItems="center" gap="$2.5">
          <Text fontSize="$3" color="$color11" fontWeight="600">
            {t('backtest.selectAsset')}
          </Text>
          <Button
            size="$2.5"
            bg="$surfaceCard"
            borderColor="$borderColor"
            borderWidth={1}
            rounded="$3"
            iconAfter={<ChevronDown size={14} color="$color8" />}
            onPress={() => setIsAssetSelectSheetOpen(true)}
            px="$3"
          >
            <Text color="$color12" fontWeight="bold">
              {selectedSymbol}
            </Text>
          </Button>
        </XStack>
      )}

      <YStack gap="$4">
        {orderedMetricKeys.length > 0 ? (
          <ScrollView maxHeight={180} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
            <XStack gap="$2.5" pb="$2" flexWrap="wrap" justifyContent="flex-start">
              {orderedMetricKeys.map(renderMetricCard)}
            </XStack>
          </ScrollView>
        ) : (
          <Text color="$color8">{t('backtest.noMetrics')}</Text>
        )}

        <Separator borderColor="$borderColor" />

        <BacktestPriceSignalChart
          key={chartKey}
          symbol={current.label === 'Portfolio' ? t('backtest.portfolio') : current.label || selectedSymbol || t('backtest.result')}
          interval={interval}
          candles={current.candles}
          entries={current.entries}
          exits={current.exits}
          cumulativeReturns={current.plots?.cumulative_returns}
          benchmarkReturns={current.plots?.benchmark_cumulative_returns}
        />

        {activeTab === 'per_asset' && current.trades.length > 0 && (
          <YStack gap="$2" mt="$2">
            <SectionTitle>{t('common.tradeLog', { defaultValue: 'Trade Log' })}</SectionTitle>
            <Card borderWidth={1} borderColor="$borderColor" bg="$surfaceDeep" borderRadius="$3" p="$3">
              <ScrollView maxH={250} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                <YStack gap="$2">
                  <XStack justifyContent="space-between" pb="$2" borderBottomWidth={1} borderBottomColor="$borderColor">
                    <Text fontSize="$2" fontWeight="700" color="$color8" flex={2}>
                      {t('common.exitTime', { defaultValue: 'Exit Time' })}
                    </Text>
                    <Text fontSize="$2" fontWeight="700" color="$color8" flex={1.2} textAlign="right">
                      {t('common.pnl', { defaultValue: 'PnL' })}
                    </Text>
                    <Text fontSize="$2" fontWeight="700" color="$color8" flex={1.2} textAlign="right">
                      {t('common.return', { defaultValue: 'Return' })}
                    </Text>
                  </XStack>
                  {current.trades.map((trade: any, idx: number) => {
                    const isWin = isFiniteNumber(trade.pnl) ? trade.pnl >= 0 : true
                    return (
                      <XStack
                        key={idx}
                        justifyContent="space-between"
                        py="$2"
                        borderBottomWidth={idx < current.trades.length - 1 ? 1 : 0}
                        borderBottomColor="$surfaceCard"
                      >
                        <Text fontSize="$2" color="$color12" flex={2} style={{ fontVariant: ['tabular-nums'] }}>
                          {trade.time}
                        </Text>
                        <Theme name={isWin ? 'green' : 'red'}>
                          <Text fontSize="$2" fontWeight="600" color="$color10" flex={1.2} textAlign="right" style={{ fontVariant: ['tabular-nums'] }}>
                            {isFiniteNumber(trade.pnl) ? `${isWin ? '+' : ''}${trade.pnl.toFixed(2)}` : '-'}
                          </Text>
                          <Text fontSize="$2" fontWeight="600" color="$color10" flex={1.2} textAlign="right" style={{ fontVariant: ['tabular-nums'] }}>
                            {isFiniteNumber(trade.ret) ? `${trade.ret >= 0 ? '+' : ''}${(trade.ret * 100).toFixed(2)}%` : '-'}
                          </Text>
                        </Theme>
                      </XStack>
                    )
                  })}
                </YStack>
              </ScrollView>
            </Card>
          </YStack>
        )}
      </YStack>

      {activeTab === 'per_asset' && isPortfolio && symbolsList.length > 0 && (
        <ListSheet
          open={isAssetSelectSheetOpen}
          onOpenChange={setIsAssetSelectSheetOpen}
          title={t('backtest.selectAsset')}
          items={symbolsList.map((s: string) => ({ symbol: s }))}
          searchRelationName="symbol"
          searchPredicate={(item, q) => (item.symbol || '').toLowerCase().includes(q.toLowerCase())}
          onSelect={(item) => {
            if (item.symbol) {
              setSelectedSymbol(item.symbol)
            }
            setIsAssetSelectSheetOpen(false)
          }}
          snapPoints={[50]}
        />
      )}
    </Card>
  )
}
