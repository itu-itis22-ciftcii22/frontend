import { CHART_INTERVALS } from '../components/chart/ChartIntervalBar'

export const COLOR_PALETTE = [
  '#2962FF',
  '#FF6D00',
  '#AB47BC',
  '#00BFA5',
  '#FF1744',
  '#00E676',
  '#FFEA00',
  '#2979FF',
  '#F50057',
  '#00E5FF',
]

export function normalizeChartInterval(value?: string | string[]) {
  const interval = Array.isArray(value) ? value[0] : value
  return CHART_INTERVALS.some((item) => item.value === interval) ? interval! : '1m'
}

export function compactIndicatorPanes<T extends { pane?: string; paneIndex?: number }>(indicators: T[]) {
  const paneIndexes = Array.from(
    new Set(
      indicators
        .map((indicator) => indicator.paneIndex)
        .filter((paneIndex): paneIndex is number => typeof paneIndex === 'number' && paneIndex > 1),
    ),
  ).sort((a, b) => a - b)

  const paneIndexMap = new Map<number, number>()
  paneIndexes.forEach((paneIndex, index) => paneIndexMap.set(paneIndex, index + 2))

  return indicators.map((indicator) => {
    const paneIndex =
      indicator.paneIndex && indicator.paneIndex > 1
        ? paneIndexMap.get(indicator.paneIndex) ?? indicator.paneIndex
        : 0

    return {
      ...indicator,
      pane: paneIndex === 0 ? 'main' : 'separate',
      paneIndex,
    }
  })
}

export function resolveIndicatorPaneIndex(paneSelection: string, indicators: { paneIndex?: number }[]) {
  if (paneSelection === 'main') return 0
  if (paneSelection.startsWith('pane:')) {
    const parsed = Number(paneSelection.slice(5))
    if (Number.isFinite(parsed) && parsed > 1) return parsed
  }
  return Math.max(1, ...indicators.map((indicator) => indicator.paneIndex || 0)) + 1
}
