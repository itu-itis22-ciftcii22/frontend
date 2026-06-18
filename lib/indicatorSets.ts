import { COLOR_PALETTE } from './chartHelpers'

export type StrategyIndicatorSnapshot = {
  name: string
  params: Record<string, any>
}

export type ChartIndicatorSnapshot = {
  indicator: string
  params: Record<string, any>
  pane: 'main' | 'separate'
  paneIndex: number
  seriesColors?: Record<string, string>
}

export function chartConfigToStrategyIndicators(config: any): StrategyIndicatorSnapshot[] {
  return (config?.chart_config?.indicators || [])
    .map((indicator: any) => ({
      name: indicator.indicator || indicator.name,
      params: indicator.params || {},
    }))
    .filter((indicator: StrategyIndicatorSnapshot) => !!indicator.name)
}

export function strategyIndicatorsToChartConfig(
  indicators: StrategyIndicatorSnapshot[],
  metadata: Record<string, any> = {},
): { indicators: ChartIndicatorSnapshot[] } {
  let nextPaneIndex = 2

  return {
    indicators: indicators
      .map((indicator, index) => {
        const name = indicator.name || (indicator as any).indicator
        if (!name) return null

        const info = metadata[name.toLowerCase()]
        const pane = info?.default_pane === 'main' ? 'main' : 'separate'
        const paneIndex = pane === 'main' ? 0 : nextPaneIndex++

        return {
          indicator: name,
          params: indicator.params || {},
          pane,
          paneIndex,
          seriesColors: { default: COLOR_PALETTE[index % COLOR_PALETTE.length] },
        }
      })
      .filter(Boolean) as ChartIndicatorSnapshot[],
  }
}

export function normalizeStrategyIndicators(indicators: any[]): StrategyIndicatorSnapshot[] {
  return (indicators || [])
    .map((indicator) => ({
      name: indicator.name || indicator.indicator,
      params: indicator.params || {},
    }))
    .filter((indicator) => !!indicator.name)
}
