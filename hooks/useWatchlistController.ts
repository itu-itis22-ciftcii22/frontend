import { useCallback, useEffect, useRef, useState } from 'react'
import { useIsFocused } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import {
  getWatchlist,
  WatchlistEntry,
  PairedIndicator,
} from '../lib/storage'
import {
  listAssetsAssetsGet as fetchAssets,
  getOhlcvAssetsSymbolOhlcvGet as fetchOHLCV,
  apiIndicatorIndicatorsComputePost as addIndicatorAPI,
  listStrategiesStrategiesGet as listStrategies,
  listAssetItemsAssetListGet as listAssetItems,
  createAssetItemAssetListPost as createAssetItem,
  updateAssetItemAssetListItemIdPatch as updateAssetItem,
  deleteAssetItemAssetListItemIdDelete as deleteAssetItem,
  reorderAssetItemsAssetListReorderItemsPatch as reorderAssetItems,
  evaluateStrategySignalsStrategiesSignalsEvaluatePost as evaluateStrategySignals,
  listChartsChartsGet as listCharts,
  AssetResponse,
  StrategyResponse,
  ChartConfigResponse,
  StrategySignalEvaluationResult,
} from '../lib/api/generated'

export type PriceSnapshot = {
  price: number | null
  change: number | null
  pct: number | null
}

export type StrategySignalMap = Record<string, Record<number, StrategySignalEvaluationResult[]>>

function derivePairedIndicators(configIds: number[] = [], chartConfigs: ChartConfigResponse[]): PairedIndicator[] {
  const nextPairedIndicators: PairedIndicator[] = []
  configIds.forEach((cfgId) => {
    const config = chartConfigs.find((cfg) => cfg.id === cfgId)
    const indicatorsData = (config?.chart_config as any)?.indicators || []
    indicatorsData.forEach((indicator: any) => {
      const exists = nextPairedIndicators.some(
        (paired) =>
          paired.name.toLowerCase() === indicator.indicator.toLowerCase() &&
          JSON.stringify(paired.params) === JSON.stringify(indicator.params || {}) &&
          paired.timeframe === (config?.interval || '1m'),
      )
      if (!exists) {
        nextPairedIndicators.push({
          name: indicator.indicator,
          params: indicator.params || {},
          timeframe: config?.interval || '1m',
        })
      }
    })
  })
  return nextPairedIndicators
}

export function useWatchlistController(showAlert: (
  title: string,
  description: string,
  severity?: 'info' | 'success' | 'warning' | 'error',
) => void) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id || 'guest'
  const isFocused = useIsFocused()

  const [loading, setLoading] = useState(false)
  const [catalog, setCatalog] = useState<AssetResponse[]>([])
  const [watchlist, setWatchlistState] = useState<WatchlistEntry[]>([])
  const [watchlistPrices1d, setWatchlistPrices1d] = useState<Record<string, PriceSnapshot>>({})
  const [watchlistPrices1m, setWatchlistPrices1m] = useState<Record<string, PriceSnapshot>>({})
  const [strategySignals, setStrategySignals] = useState<StrategySignalMap>({})
  const [strategies, setStrategies] = useState<StrategyResponse[]>([])
  const [chartConfigs, setChartConfigs] = useState<ChartConfigResponse[]>([])

  const [isWatchlistPickerOpen, setIsWatchlistPickerOpen] = useState(false)
  const [isEditConfigsOpen, setIsEditConfigsOpen] = useState(false)
  const [editingAssetSymbol, setEditingAssetSymbol] = useState<string | null>(null)
  const [tempSelectedConfigIds, setTempSelectedConfigIds] = useState<number[]>([])
  const [tempSelectedStrategyIds, setTempSelectedStrategyIds] = useState<number[]>([])

  const watchlistRef = useRef<WatchlistEntry[]>([])
  useEffect(() => {
    watchlistRef.current = watchlist
  }, [watchlist])

  const chartConfigsRef = useRef<ChartConfigResponse[]>([])
  useEffect(() => {
    chartConfigsRef.current = chartConfigs
  }, [chartConfigs])

  const loadCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAssets()
      setCatalog(res?.assets || [])
    } catch (e) {
      console.error('Failed to load catalog:', e)
    }
    setLoading(false)
  }, [])

  const loadWatchlistData = useCallback(async () => {
    try {
      let response = await listAssetItems()
      let items = response?.items || []

      if (items.length === 0) {
        const localItems = await getWatchlist(userId)
        if (localItems.length > 0) {
          for (const [index, entry] of localItems.entries()) {
            try {
              await createAssetItem({
                body: {
                  symbol: entry.symbol,
                  chart_config_ids: entry.associatedChartConfigIds || (entry.associatedChartConfigId ? [entry.associatedChartConfigId] : []),
                  strategy_ids: entry.associatedStrategies || [],
                  sort_order: index,
                },
              })
            } catch (err) {
              console.warn(`Failed importing local watchlist item ${entry.symbol}:`, err)
            }
          }
          response = await listAssetItems()
          items = response?.items || []
        }
      }

      setWatchlistState(items.map((item) => ({
        id: item.id,
        symbol: item.symbol,
        timeframe: '1d',
        pairedIndicators: derivePairedIndicators(item.chart_config_ids || [], chartConfigsRef.current),
        associatedChartConfigIds: item.chart_config_ids || [],
        associatedStrategies: item.strategy_ids || [],
        name: item.name,
        sector: item.sector,
        industry: item.industry,
        currency: item.currency,
        exchange: item.exchange,
        tags: item.tags,
      })))
    } catch (e) {
      console.error('Failed to load backend asset list, using local watchlist fallback:', e)
      const list = await getWatchlist(userId)
      setWatchlistState(list)
    }
  }, [userId])

  const loadStrategiesData = useCallback(async () => {
    try {
      const res = await listStrategies()
      setStrategies(res || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  const loadChartConfigsData = useCallback(async () => {
    try {
      const res = await listCharts()
      setChartConfigs(res || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    setWatchlistState([])
    setWatchlistPrices1d({})
    setWatchlistPrices1m({})
    setStrategySignals({})
    setStrategies([])
    setChartConfigs([])

    loadCatalog()
    loadWatchlistData()
    loadStrategiesData()
    loadChartConfigsData()
  }, [userId, loadCatalog, loadWatchlistData, loadStrategiesData, loadChartConfigsData])

  useEffect(() => {
    if (chartConfigs.length === 0) return
    setWatchlistState((current) =>
      current.map((entry) => ({
        ...entry,
        pairedIndicators: derivePairedIndicators(entry.associatedChartConfigIds || [], chartConfigs),
      })),
    )
  }, [chartConfigs])

  const pollPrices = useCallback(async (overrideWatchlist?: WatchlistEntry[]) => {
    const newPrices1d: Record<string, PriceSnapshot> = {}
    const newPrices1m: Record<string, PriceSnapshot> = {}
    let changed = false
    const currentWatchlist = overrideWatchlist || watchlistRef.current

    try {
      const requests = currentWatchlist.flatMap((entry) =>
        (entry.associatedStrategies || []).map((strategyId) => ({
          asset: entry.symbol,
          strategy_id: strategyId,
          intervals: ['1d', '1m'],
        })),
      )
      const signalResponse = requests.length > 0
        ? await evaluateStrategySignals({ body: { requests } })
        : { results: [] }
      const nextSignals: StrategySignalMap = {}
      for (const result of signalResponse?.results || []) {
        const symbol = result.asset.toUpperCase().replace('.IS', '').trim()
        if (!nextSignals[symbol]) nextSignals[symbol] = {}
        if (!nextSignals[symbol][result.strategy_id]) nextSignals[symbol][result.strategy_id] = []
        nextSignals[symbol][result.strategy_id].push(result)
      }
      setStrategySignals(nextSignals)
    } catch (e) {
      console.warn('Failed to poll strategy signals:', e)
    }

    const nextWatchlist = await Promise.all(
      currentWatchlist.map(async (entry) => {
        const entryCopy = { ...entry }
        try {
          const [ohlcv1d, ohlcv1m] = await Promise.all([
            fetchOHLCV({ path: { symbol: entry.symbol }, query: { interval: '1d' } }),
            fetchOHLCV({ path: { symbol: entry.symbol }, query: { interval: '1m' } }),
          ])

          if (ohlcv1d?.candles?.length) {
            const candles = ohlcv1d.candles
            const currentCandle = candles[candles.length - 1]
            const prevCandle = candles[candles.length - 2] || currentCandle
            const price = currentCandle.close
            const change = price - prevCandle.close
            const pct = prevCandle.close !== 0 ? (change / prevCandle.close) * 100 : 0
            newPrices1d[entry.symbol] = { price, change, pct }
          }

          if (ohlcv1m?.candles?.length) {
            const candles = ohlcv1m.candles
            const currentCandle = candles[candles.length - 1]
            const prevCandle = candles[candles.length - 2] || currentCandle
            const price = currentCandle.close
            const change = price - prevCandle.close
            const pct = prevCandle.close !== 0 ? (change / prevCandle.close) * 100 : 0
            newPrices1m[entry.symbol] = { price, change, pct }
          }

          if (entry.pairedIndicators?.length) {
            const nextIndicators = await Promise.all(
              entry.pairedIndicators.map(async (ind) => {
                const indCopy = { ...ind }
                try {
                  const res = await addIndicatorAPI({
                    body: {
                      symbol: entry.symbol,
                      indicator: ind.name,
                      params: ind.params,
                      interval: ind.timeframe,
                    },
                  })

                  if (res?.series?.[0]?.data?.length) {
                    const latestPoint = res.series[0].data[res.series[0].data.length - 1]
                    const val = latestPoint.value !== undefined ? latestPoint.value : latestPoint.close
                    if (val !== undefined && val !== null && ind.value !== val) {
                      indCopy.value = val
                      changed = true
                    }
                  }
                } catch (err) {
                  console.warn(`Failed computing ${ind.name} for ${entry.symbol}:`, err)
                }
                return indCopy
              }),
            )
            entryCopy.pairedIndicators = nextIndicators
          }
        } catch (e) {
          console.warn(`Failed to poll price for ${entry.symbol}:`, e)
        }
        return entryCopy
      }),
    )

    setWatchlistPrices1d(newPrices1d)
    setWatchlistPrices1m(newPrices1m)
    if (changed) {
      setWatchlistState(nextWatchlist)
    }
  }, [userId])

  useEffect(() => {
    if (!isFocused || watchlist.length === 0) return
    pollPrices()
    const intervalId = setInterval(pollPrices, 60000)
    return () => clearInterval(intervalId)
  }, [watchlist.length, isFocused, pollPrices])

  const deleteWatchlistAsset = async (symbol: string) => {
    const target = watchlist.find((entry) => entry.symbol === symbol)
    if (target?.id) {
      await deleteAssetItem({ path: { item_id: target.id } })
    }
    const filtered = watchlist.filter((entry) => entry.symbol !== symbol)
    setWatchlistState(filtered)
  }

  const addWatchlistAsset = async (symbol: string) => {
    if (watchlist.some((entry) => entry.symbol === symbol)) return
    const created = await createAssetItem({ body: { symbol } })
    if (!created) return
    const nextEntry: WatchlistEntry = {
      id: created.id,
      symbol: created.symbol,
      timeframe: '1d',
      pairedIndicators: [],
      associatedStrategies: [],
      associatedChartConfigIds: [],
      name: created.name,
      sector: created.sector,
      industry: created.industry,
      currency: created.currency,
      exchange: created.exchange,
      tags: created.tags,
    }
    const updated = [...watchlist, nextEntry]
    setWatchlistState(updated)
    pollPrices(updated)
  }

  const moveWatchlistAsset = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= watchlist.length) return
    const nextWatchlist = [...watchlist]
    const temp = nextWatchlist[index]
    nextWatchlist[index] = nextWatchlist[targetIndex]
    nextWatchlist[targetIndex] = temp
    const reordered = nextWatchlist.map((entry, sortOrder) => ({ ...entry, sortOrder }))
    setWatchlistState(reordered)
    await reorderAssetItems({
      body: {
        items: reordered
          .filter((entry) => entry.id)
          .map((entry, sort_order) => ({ id: entry.id!, sort_order })),
      },
    })
  }

  const openAssetConfigs = async (symbol: string, _currentIndicators: PairedIndicator[]) => {
    setEditingAssetSymbol(symbol)
    const entry = watchlist.find((item) => item.symbol === symbol)
    const initialStrategyIds = entry?.associatedStrategies || []
    
    // Use cached values for immediate UI rendering
    const validStrategyIds = new Set(strategies.map((strategy) => strategy.id))
    setTempSelectedConfigIds(entry?.associatedChartConfigIds || [])
    setTempSelectedStrategyIds(initialStrategyIds.filter((strategyId) => validStrategyIds.has(strategyId)))
    setIsEditConfigsOpen(true)

    // Parallel fetch absolute latest data from the backend to ensure zero lag
    try {
      const [freshStrategies, freshConfigs] = await Promise.all([
        listStrategies(),
        listCharts(),
      ])
      setStrategies(freshStrategies || [])
      setChartConfigs(freshConfigs || [])

      const freshStrategyIds = new Set((freshStrategies || []).map((s) => s.id))
      setTempSelectedStrategyIds(initialStrategyIds.filter((strategyId) => freshStrategyIds.has(strategyId)))
    } catch (err) {
      console.warn('Failed to load fresh layout configurations and strategies on openAssetConfigs:', err)
    }
  }

  const closeAssetConfigs = () => {
    setIsEditConfigsOpen(false)
    setEditingAssetSymbol(null)
  }

  const saveAssetConfigs = async () => {
    if (!editingAssetSymbol) return

    const nextPairedIndicators: PairedIndicator[] = []
    tempSelectedConfigIds.forEach((cfgId) => {
      const config = chartConfigs.find((cfg) => cfg.id === cfgId)
      const indicatorsData = (config?.chart_config as any)?.indicators || []
      indicatorsData.forEach((indicator: any) => {
        const exists = nextPairedIndicators.some(
          (paired) =>
            paired.name.toLowerCase() === indicator.indicator.toLowerCase() &&
            JSON.stringify(paired.params) === JSON.stringify(indicator.params || {}) &&
            paired.timeframe === (config?.interval || '1m'),
        )
        if (!exists) {
          nextPairedIndicators.push({
            name: indicator.indicator,
            params: indicator.params || {},
            timeframe: config?.interval || '1m',
          })
        }
      })
    })

    const validStrategyIds = new Set(strategies.map((strategy) => strategy.id))
    const validSelectedStrategyIds = tempSelectedStrategyIds.filter((strategyId) => validStrategyIds.has(strategyId))

    const updated = watchlist.map((entry) =>
      entry.symbol === editingAssetSymbol
        ? {
            ...entry,
            associatedChartConfigIds: tempSelectedConfigIds,
            associatedStrategies: validSelectedStrategyIds,
            pairedIndicators: nextPairedIndicators,
          }
        : entry,
    )

    const target = updated.find((entry) => entry.symbol === editingAssetSymbol)
    if (target?.id) {
      await updateAssetItem({
        path: { item_id: target.id },
        body: {
          chart_config_ids: tempSelectedConfigIds,
          strategy_ids: validSelectedStrategyIds,
        },
      })
    }

    setWatchlistState(updated)
    closeAssetConfigs()
    pollPrices(updated)
  }

  return {
    loading,
    catalog,
    watchlist,
    watchlistPrices1d,
    watchlistPrices1m,
    strategySignals,
    strategies,
    chartConfigs,
    isWatchlistPickerOpen,
    setIsWatchlistPickerOpen,
    isEditConfigsOpen,
    setIsEditConfigsOpen,
    editingAssetSymbol,
    tempSelectedConfigIds,
    setTempSelectedConfigIds,
    tempSelectedStrategyIds,
    setTempSelectedStrategyIds,
    addWatchlistAsset,
    deleteWatchlistAsset,
    moveWatchlistAsset,
    openAssetConfigs,
    closeAssetConfigs,
    saveAssetConfigs,
  } as const
}
