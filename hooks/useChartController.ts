import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useIsFocused } from '@react-navigation/native'
import { ChartRef } from '../components/Chart'
import { useAuth } from '../lib/auth'
import {
  getOhlcvAssetsSymbolOhlcvGet as fetchOHLCV,
  apiIndicatorIndicatorsComputePost as addIndicatorAPI,
  listChartsChartsGet as listCharts,
  createChartChartsPost as createChart,
  updateChartChartsChartIdPut as updateChart,
  deleteChartChartsChartIdDelete as deleteChart,
  listAssetsAssetsGet as fetchAssets,
  listStrategiesStrategiesGet as listStrategies,
} from '../lib/api/generated'
import { useIndicatorMetadata } from './useIndicatorMetadata'
import {
  COLOR_PALETTE,
  compactIndicatorPanes,
  normalizeChartInterval,
  resolveIndicatorPaneIndex,
} from '../lib/chartHelpers'
import { normalizeStrategyIndicators, strategyIndicatorsToChartConfig } from '../lib/indicatorSets'

type ShowAlert = (
  title: string,
  description: string,
  severity?: 'info' | 'success' | 'warning' | 'error',
  isConfirm?: boolean,
  onConfirm?: () => void,
  confirmText?: string,
  cancelText?: string,
) => void

export function useChartController(showAlert: ShowAlert) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id || 'guest'
  const isFocused = useIsFocused()
  const { metadata, categories } = useIndicatorMetadata()
  const flatCategories = useMemo(
    () =>
      Object.entries(categories).flatMap(([catName, items]) =>
        items.map((item) => ({ ...item, category: catName })),
      ),
    [categories],
  )

  const params = useLocalSearchParams()
  const searchSymbol = params.symbol as string
  const searchInterval = params.interval as string

  const [symbol, setSymbol] = useState(searchSymbol || '')
  const [currentSymbol, setCurrentSymbol] = useState(symbol)
  const [ohlcv, setOhlcv] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const chartRef = useRef<ChartRef>(null)
  const [interval, setIntervalVal] = useState(normalizeChartInterval(searchInterval))
  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null)
  const [crosshairIsUp, setCrosshairIsUp] = useState<boolean | null>(null)
  const [catalog, setCatalog] = useState<any[]>([])
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false)
  const [isIndicatorDrawerOpen, setIsIndicatorDrawerOpen] = useState(false)
  const [activeIndicators, setActiveIndicators] = useState<any[]>([])
  const [nextPaneIndex, setNextPaneIndex] = useState(2)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialParams, setInitialParams] = useState<any>(null)
  const [initialPane, setInitialPane] = useState<string | null>(null)
  const [initialColors, setInitialColors] = useState<any>(null)
  const [colorIndex, setColorIndex] = useState(0)
  const [modalIndicatorName, setModalIndicatorName] = useState<string | null>(null)
  const [modalIndicatorInfo, setModalIndicatorInfo] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savedConfigs, setSavedConfigs] = useState<any[]>([])
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false)
  const [newLayoutName, setNewLayoutName] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)
  const [editId, setEditId] = useState<number | null>(null)
  const [layoutName, setLayoutName] = useState<string>('')
  const activeIndicatorsRef = useRef<any[]>([])
  const lastLoadedRef = useRef<{ symbol: string; interval: string } | null>(null)

  useEffect(() => {
    activeIndicatorsRef.current = activeIndicators
  }, [activeIndicators])

  useEffect(() => {
    chartRef.current?.replaceIndicatorSeries([])
    setActiveIndicators([])
    setNextPaneIndex(2)
    setSavedConfigs([])
    setEditId(null)
    setLayoutName('')

    const initialSym = searchSymbol || ''
    const initialTf = normalizeChartInterval(searchInterval)
    setSymbol(initialSym)
    setCurrentSymbol(initialSym)
    setIntervalVal(initialTf)
  }, [userId, searchSymbol, searchInterval])

  useEffect(() => {
    loadCatalog()
  }, [])


  useEffect(() => {
    if (!isFocused || !currentSymbol) return
    const intervalId = setInterval(() => {
      setRefreshCount((count) => count + 1)
    }, 60000)
    return () => clearInterval(intervalId)
  }, [isFocused, currentSymbol])

  const loadCatalog = async () => {
    try {
      const res = await fetchAssets()
      setCatalog(res?.assets || [])
    } catch (e) {
      console.error(e)
    }
  }

  const rebuildIndicatorSeries = (indicators: any[]) => {
    const refsById =
      chartRef.current?.replaceIndicatorSeries(
        indicators.map((indicator) => ({
          id: indicator.id,
          seriesData: indicator.seriesData || [],
          paneIndex: indicator.paneIndex,
        })),
      ) || {}

    const rebuilt = indicators.map((indicator) => ({
      ...indicator,
      seriesRefs: refsById[indicator.id] || [],
    }))
    const nextPane = Math.max(1, ...rebuilt.map((indicator) => indicator.paneIndex || 0)) + 1
    setNextPaneIndex(Math.max(2, nextPane))
    return rebuilt
  }

  useEffect(() => {
    if (!currentSymbol) {
      setOhlcv(null)
      return
    }

    let active = true

    const reloadDataAndIndicators = async () => {
      const isRefresh =
        lastLoadedRef.current &&
        lastLoadedRef.current.symbol === currentSymbol &&
        lastLoadedRef.current.interval === interval

      if (!isRefresh) {
        setLoading(true)
        chartRef.current?.replaceIndicatorSeries([])
      }

      try {
        const data = await fetchOHLCV({ path: { symbol: currentSymbol }, query: { interval } })
        if (!active) return
        setOhlcv(data)

        const currentActiveIndicators = activeIndicatorsRef.current
        if (currentActiveIndicators.length > 0) {
          const reloadedInds: any[] = []
          for (const indicator of currentActiveIndicators) {
            try {
              const res = await addIndicatorAPI({
                body: {
                  symbol: currentSymbol,
                  indicator: indicator.indicator,
                  params: indicator.params,
                  pane: indicator.pane,
                  interval,
                },
              })

              const seriesColors = indicator.seriesColors || {}
              res?.series?.forEach((series: any) => {
                const baseName = series.label.split('_')[0]
                series.color = seriesColors[baseName] || COLOR_PALETTE[0]
              })

              reloadedInds.push({ ...indicator, seriesData: res?.series })
            } catch (err) {
              console.error(`Failed to recalculate indicator ${indicator.indicator}:`, err)
            }
          }
          if (!active) return

          if (isRefresh) {
            setActiveIndicators((prev) =>
              prev.map((indicator) => {
                const matchingReloaded = reloadedInds.find((ri) => ri.id === indicator.id)
                if (matchingReloaded) {
                  chartRef.current?.updateIndicatorData(indicator.id, matchingReloaded.seriesData)
                  return { ...indicator, seriesData: matchingReloaded.seriesData }
                }
                return indicator
              })
            )
          } else {
            setActiveIndicators(rebuildIndicatorSeries(compactIndicatorPanes(reloadedInds)))
          }
        } else {
          if (!isRefresh) {
            chartRef.current?.replaceIndicatorSeries([])
            setNextPaneIndex(2)
          }
        }

        lastLoadedRef.current = { symbol: currentSymbol, interval }
      } catch (e) {
        console.error(e)
        showAlert(t('common.error'), t('chart.noData') + ': ' + currentSymbol, 'error')
      }
      setLoading(false)
    }

    reloadDataAndIndicators()
    return () => {
      active = false
    }
  }, [currentSymbol, interval, refreshCount])

  const loadData = (sym: string, tf: string) => {
    const normalizedInterval = normalizeChartInterval(tf)
    setCurrentSymbol(sym)
    setSymbol(sym)
    setIntervalVal(normalizedInterval)
  }

  const changeInterval = (tf: string) => {
    const normalized = normalizeChartInterval(tf)
    if (normalized === interval) return

    const incompatible = activeIndicators.filter((indicator) => {
      const metaInfo = metadata[indicator.indicator.toLowerCase()]
      return metaInfo?.supported_timeframes && !metaInfo.supported_timeframes.includes(normalized)
    })

    if (incompatible.length > 0) {
      const names = incompatible.map((indicator) => indicator.indicator.toUpperCase()).join(', ')
      showAlert(
        t('chart.incompatibleTitle'),
        t('chart.incompatibleDesc', { timeframe: normalized.toUpperCase(), names }),
        'warning',
        true,
        () => {
          setActiveIndicators(
            activeIndicators.filter(
              (indicator) => !incompatible.some((incompatibleIndicator) => incompatibleIndicator.id === indicator.id),
            ),
          )
          setIntervalVal(normalized)
        },
        t('common.yesProceed'),
        t('common.cancel'),
      )
    } else {
      setIntervalVal(normalized)
    }
  }

  const buildPaneOptions = () => {
    const panes = Array.from(
      new Set(
        activeIndicators
          .map((indicator) => indicator.paneIndex)
          .filter((paneIndex) => typeof paneIndex === 'number' && paneIndex > 1),
      ),
    ).sort((a, b) => a - b)

    return [
      { value: 'main', label: t('chart.overlayLabel') },
      ...panes.map((paneIndex) => {
        const names = activeIndicators
          .filter((indicator) => indicator.paneIndex === paneIndex)
          .map((indicator) => indicator.indicator.toUpperCase())
          .join(', ')
        return {
          value: `pane:${paneIndex}`,
          label: t('chart.paneLabel', { index: paneIndex - 1 }) + (names ? ` (${names})` : ''),
        }
      }),
      { value: 'new', label: t('chart.newPaneLabel') },
    ]
  }

  const handleIndicatorSelect = (name: string, info: any) => {
    setModalIndicatorName(name)
    setModalIndicatorInfo(info)
    setInitialParams(null)
    setInitialPane(info.default_pane === 'main' ? 'main' : 'new')
    setInitialColors(null)
    setEditingId(null)
    setIsModalOpen(true)
    setIsIndicatorDrawerOpen(false)
  }

  const editIndicator = (id: string) => {
    const target = activeIndicators.find((indicator) => indicator.id === id)
    if (!target) return
    const info = metadata[target.indicator.toLowerCase()]
    if (!info) return
    setModalIndicatorName(target.indicator)
    setModalIndicatorInfo(info)
    setInitialParams(target.params)
    setInitialPane(target.paneIndex === 0 ? 'main' : `pane:${target.paneIndex}`)
    setInitialColors(target.seriesColors)
    setEditingId(id)
    setIsModalOpen(true)
  }

  const handleApplyIndicator = async (params: any, paneOverride: string, colors: any) => {
    setLoading(true)
    try {
      const paneSelection = paneOverride || (modalIndicatorInfo.default_pane === 'main' ? 'main' : 'new')
      const apiPane = paneSelection === 'main' ? 'main' : 'separate'
      const res = await addIndicatorAPI({
        body: {
          symbol: currentSymbol,
          indicator: modalIndicatorName!,
          params,
          pane: apiPane,
          interval,
        },
      })

      const id = editingId || Math.random().toString()
      const baseIndicators = editingId
        ? activeIndicators.filter((indicator) => indicator.id !== editingId)
        : activeIndicators
      const paneIndex = resolveIndicatorPaneIndex(paneSelection, activeIndicators)
      const seriesColors: any = colors ? { ...colors } : {}
      let currentColorIdx = colorIndex

      res?.series?.forEach((series: any) => {
        const baseName = series.label.split('_')[0]
        if (!seriesColors[baseName]) {
          seriesColors[baseName] = COLOR_PALETTE[currentColorIdx % COLOR_PALETTE.length]
          currentColorIdx++
        }
        series.color = seriesColors[baseName]
      })

      setColorIndex(currentColorIdx)
      setActiveIndicators(
        rebuildIndicatorSeries(
          compactIndicatorPanes([
            ...baseIndicators,
            {
              id,
              indicator: res?.indicator || modalIndicatorName!,
              params,
              pane: apiPane,
              paneIndex,
              seriesData: res?.series,
              seriesColors,
            },
          ]),
        ),
      )
      setEditingId(null)
    } catch (e: any) {
      showAlert(t('common.error'), e.message || t('chart.applyIndicatorFailed', { message: t('common.error') }), 'error')
    }
    setLoading(false)
  }

  const removeIndicator = (id: string) => {
    setActiveIndicators(rebuildIndicatorSeries(compactIndicatorPanes(activeIndicators.filter((indicator) => indicator.id !== id))))
  }

  const handleOpenSaveModal = () => {
    if (editId) {
      void handleSaveLayout(layoutName)
    } else {
      setNewLayoutName('')
      setIsSaveModalOpen(true)
    }
  }

  const handleSaveLayout = async (name: string) => {
    if (!name) return
    const finalName = name.trim()
    if (!finalName) return

    const indicatorsData = activeIndicators.map((indicator) => ({
      indicator: indicator.indicator,
      params: indicator.params,
      pane: indicator.pane,
      paneIndex: indicator.paneIndex,
      seriesColors: indicator.seriesColors,
    }))

    setLoading(true)
    try {
      if (editId) {
        await updateChart({
          path: { chart_id: editId },
          body: {
            name: finalName,
            chart_config: { indicators: indicatorsData },
          },
        })
        setLayoutName(finalName)
        showAlert(t('common.success'), t('common.success'), 'success')
      } else {
        const res = await createChart({
          body: {
            name: finalName,
            interval,
            chart_config: { indicators: indicatorsData },
          },
        })
        if (res?.id) {
          setEditId(res.id)
          setLayoutName(res.name)
        }
        setIsSaveModalOpen(false)
        showAlert(t('common.success'), t('common.success'), 'success')
      }
    } catch (e: any) {
      showAlert(t('common.error'), t('chart.saveLayoutFailed', { message: e.message }), 'error')
    }
    setLoading(false)
  }

  const handleOpenLoadModal = async () => {
    try {
      const configs = await listCharts()
      setSavedConfigs(configs || [])
      setIsLoadModalOpen(true)
    } catch (e: any) {
      showAlert(t('common.error'), t('chart.loadLayoutsFailed', { message: e.message }), 'error')
    }
  }

  const handleLoadLayout = async (cfg: any) => {
    setIsLoadModalOpen(false)
    if (cfg.id === 'new' || cfg.isNew) {
      setEditId(null)
      setLayoutName('')
      chartRef.current?.replaceIndicatorSeries([])
      setActiveIndicators([])
      return
    }
    setEditId(Number(cfg.id))
    setLayoutName(cfg.name)
    setLoading(true)
    try {
      chartRef.current?.replaceIndicatorSeries([])
      setActiveIndicators([])
      const loadedInds: any[] = []

      for (const indicator of cfg.chart_config?.indicators || []) {
        const apiPane = indicator.pane === 'main' ? 'main' : 'separate'
        const res = await addIndicatorAPI({
          body: {
            symbol: currentSymbol,
            indicator: indicator.indicator,
            params: indicator.params,
            pane: apiPane,
            interval,
          },
        })

        const seriesColors = indicator.seriesColors || {}
        res?.series?.forEach((series: any) => {
          const baseName = series.label.split('_')[0]
          series.color = seriesColors[baseName] || COLOR_PALETTE[0]
        })

        loadedInds.push({
          id: Math.random().toString(),
          indicator: indicator.indicator,
          params: indicator.params,
          pane: apiPane,
          paneIndex: apiPane === 'main' ? 0 : indicator.paneIndex || 2,
          seriesData: res?.series,
          seriesColors,
        })
      }

      setActiveIndicators(rebuildIndicatorSeries(compactIndicatorPanes(loadedInds)))
    } catch (e: any) {
      showAlert(t('common.error'), t('chart.loadConfigurationFailed', { message: e.message }), 'error')
    }
    setLoading(false)
  }



  const handleDeleteLayout = async (id: number) => {
    try {
      await deleteChart({ path: { chart_id: id } })
      setSavedConfigs(savedConfigs.filter((config) => config.id !== id))
      if (editId === id) {
        setEditId(null)
        setLayoutName('')
        chartRef.current?.replaceIndicatorSeries([])
        setActiveIndicators([])
      }
    } catch (e: any) {
      showAlert(t('common.error'), t('chart.deleteLayoutFailed', { message: e.message }), 'error')
    }
  }

  return {
    chartRef,
    currentSymbol,
    ohlcv,
    loading,
    interval,
    crosshairPrice,
    crosshairIsUp,
    catalog,
    isAssetPickerOpen,
    setIsAssetPickerOpen,
    isIndicatorDrawerOpen,
    setIsIndicatorDrawerOpen,
    activeIndicators,
    flatCategories,
    isModalOpen,
    setIsModalOpen,
    modalIndicatorName,
    modalIndicatorInfo,
    initialParams,
    initialPane,
    initialColors,
    savedConfigs,
    isSaveModalOpen,
    setIsSaveModalOpen,
    isLoadModalOpen,
    setIsLoadModalOpen,
    newLayoutName,
    setNewLayoutName,
    editId,
    setEditId,
    layoutName,
    setLayoutName,
    loadData,
    changeInterval,
    setCrosshairPrice,
    setCrosshairIsUp,
    setRefreshCount,
    handleIndicatorSelect,
    editIndicator,
    removeIndicator,
    buildPaneOptions,
    handleApplyIndicator,
    handleOpenSaveModal,
    handleSaveLayout,
    handleOpenLoadModal,
    handleLoadLayout,
    handleDeleteLayout,
  } as const
}
