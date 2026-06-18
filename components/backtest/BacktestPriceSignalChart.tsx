import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Text, XStack, YStack, Button, View } from 'tamagui'
import { Camera, RotateCcw } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { Chart, ChartRef } from '../Chart'

type SignalMarker = {
  time: string
  price?: number | null
}

interface BacktestPriceSignalChartProps {
  symbol: string
  interval: string
  candles: any[]
  entries: SignalMarker[]
  exits: SignalMarker[]
  cumulativeReturns?: any[]
  benchmarkReturns?: any[]
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export function BacktestPriceSignalChart({
  symbol,
  interval,
  candles,
  entries,
  exits,
  cumulativeReturns,
  benchmarkReturns,
}: BacktestPriceSignalChartProps) {
  const { t } = useTranslation()
  const chartRef = useRef<ChartRef>(null)

  const hasCandles = candles && candles.length > 0
  const hasPerformance = Array.isArray(cumulativeReturns) && cumulativeReturns.length > 0

  const [chartType, setChartType] = useState<'price_signals' | 'cumulative_returns'>(
    hasCandles ? 'price_signals' : 'cumulative_returns'
  )

  const ohlcv = useMemo(
    () => ({
      symbol,
      candles: chartType === 'price_signals' ? candles : [],
      volume: [],
    }),
    [symbol, candles, chartType],
  )

  const markers = useMemo(
    () =>
      [
        ...entries.map((entry) => ({
          time: entry.time,
          position: 'belowBar' as const,
          color: '#16a34a',
          shape: 'arrowUp' as const,
          text: '',
        })),
        ...exits.map((exit) => ({
          time: exit.time,
          position: 'aboveBar' as const,
          color: '#dc2626',
          shape: 'arrowDown' as const,
          text: '',
        })),
      ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    [entries, exits],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!chartRef.current) return

      if (chartType === 'price_signals') {
        chartRef.current.setMarkers(markers)
        chartRef.current.replaceIndicatorSeries([])
      } else {
        chartRef.current.setMarkers([])

        const seriesList: any[] = []
        if (Array.isArray(cumulativeReturns) && cumulativeReturns.length > 0) {
          seriesList.push({
            type: 'Line',
            color: '#3b82f6',
            data: cumulativeReturns,
          })
        }
        if (Array.isArray(benchmarkReturns) && benchmarkReturns.length > 0) {
          seriesList.push({
            type: 'Line',
            color: '#eab308',
            data: benchmarkReturns,
          })
        }

        chartRef.current.replaceIndicatorSeries([
          {
            id: 'backtest_performance',
            paneIndex: 0,
            seriesData: seriesList,
          },
        ])
      }

      chartRef.current.fitContent()
    }, 0)

    return () => clearTimeout(timer)
  }, [markers, ohlcv, chartType, cumulativeReturns, benchmarkReturns])

  if (!hasCandles && !hasPerformance) {
    return (
      <Card borderWidth={1} borderColor="$borderSubtle" bg="$surfaceBase" borderRadius="$3" minH={280} alignItems="center" justifyContent="center" p="$4">
        <Text color="$color8" textAlign="center">
          {t('backtest.noPriceSignals', { defaultValue: 'No price and signal data returned for this asset.' })}
        </Text>
      </Card>
    )
  }

  return (
    <Card borderWidth={1} borderColor="$borderSubtle" bg="$surfaceBase" borderRadius="$3" overflow="hidden">
      <XStack px="$3" py="$2" alignItems="center" justifyContent="flex-end" borderBottomWidth={1} borderBottomColor="$borderSubtle">
        <XStack gap="$1.5" alignItems="center">
          {hasCandles && hasPerformance && (
            <XStack bg="$surfaceDeep" p="$0.5" borderRadius="$3" gap="$1" borderWidth={1} borderColor="$borderColor">
              <Button
                size="$2.5"
                bg={chartType === 'price_signals' ? '$brandSecondarySoft' : 'transparent'}
                borderWidth={0}
                onPress={() => setChartType('price_signals')}
                px="$3"
                rounded="$2"
              >
                <Text fontSize="$2" color={chartType === 'price_signals' ? '$brandSecondaryForeground' : '$color8'} fontWeight="bold">
                  {t('backtest.priceSignalsTab', { defaultValue: 'Price & Signals' })}
                </Text>
              </Button>
              <Button
                size="$2.5"
                bg={chartType === 'cumulative_returns' ? '$brandSecondarySoft' : 'transparent'}
                borderWidth={0}
                onPress={() => setChartType('cumulative_returns')}
                px="$3"
                rounded="$2"
              >
                <Text fontSize="$2" color={chartType === 'cumulative_returns' ? '$brandSecondaryForeground' : '$color8'} fontWeight="bold">
                  {t('backtest.performanceTab', { defaultValue: 'Cum. Returns' })}
                </Text>
              </Button>
            </XStack>
          )}
          <Button size="$2.5" circular chromeless icon={RotateCcw} onPress={() => chartRef.current?.fitContent()} aria-label={t('chart.fitContent', { defaultValue: 'Reset view' })} />
          <Button size="$2.5" circular chromeless icon={Camera} onPress={() => chartRef.current?.takeScreenshot()} aria-label={t('chart.screenshot', { defaultValue: 'Screenshot' })} />
        </XStack>
      </XStack>
      <YStack height={320} position="relative">
        {chartType === 'cumulative_returns' && (
          <XStack
            position="absolute"
            top="$2.5"
            left="$2.5"
            zIndex={10}
            backgroundColor="$backgroundHover"
            opacity={0.85}
            px="$2.5"
            py="$1.5"
            borderRadius="$2"
            borderWidth={1}
            borderColor="$borderSubtle"
            gap="$3"
            alignItems="center"
            pointerEvents="none"
          >
            <XStack gap="$1.5" alignItems="center">
              <View width={8} height={8} borderRadius={4} backgroundColor="#3b82f6" />
              <Text fontSize="$1" fontWeight="600" color="$color11">
                {t('backtest.strategy', { defaultValue: 'Strategy' })}
              </Text>
            </XStack>
            <XStack gap="$1.5" alignItems="center">
              <View width={8} height={8} borderRadius={4} backgroundColor="#eab308" />
              <Text fontSize="$1" fontWeight="600" color="$color11">
                {t('backtest.benchmark', { defaultValue: 'Benchmark' })}
              </Text>
            </XStack>
          </XStack>
        )}
        <Chart ref={chartRef} symbol={symbol || t('backtest.result')} ohlcv={ohlcv} interval={interval} />
      </YStack>
    </Card>
  )
}
