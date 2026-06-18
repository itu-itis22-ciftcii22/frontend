import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../lib/auth'
import {
  listStrategiesStrategiesGet as listStrategies,
  createStrategyStrategiesPost as createStrategy,
  updateStrategyStrategiesStrategyIdPut as updateStrategy,
  deleteStrategyStrategiesStrategyIdDelete as deleteStrategy,
  listChartsChartsGet as listCharts,
  apiBacktestColumnsBacktestColumnsPost as fetchBacktestColumns,
  listAssetsAssetsGet as fetchAssets,
  apiBacktestRunBacktestRunPost as runBacktest,
  StrategyResponse,
} from '../lib/api/generated'
import {
  buildStrategyV2,
  defaultRule,
  defaultScore,
  isV2StrategyJson,
  RuleNode,
  ScoreNode,
} from '../lib/conditions'
import { chartConfigToStrategyIndicators } from '../lib/indicatorSets'
import { useIndicatorMetadata } from './useIndicatorMetadata'

type ShowAlert = (
  title: string,
  description: string,
  severity?: 'info' | 'success' | 'warning' | 'error',
  isConfirm?: boolean,
  onConfirm?: () => void,
) => void

export function useStrategyLabController(showAlert: ShowAlert) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id || 'guest'
  const { categories } = useIndicatorMetadata()
  const [isStrategyListSheetOpen, setIsStrategyListSheetOpen] = useState(false)
  const [isStrategySaveDialogOpen, setIsStrategySaveDialogOpen] = useState(false)
  const [pendingStrategyName, setPendingStrategyName] = useState('')
  const [isIndicatorPickerOpen, setIsIndicatorPickerOpen] = useState(false)
  const [isChartImportSheetOpen, setIsChartImportSheetOpen] = useState(false)
  const [chartConfigs, setChartConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [backtesting, setBacktesting] = useState(false)
  const [assets, setAssets] = useState<any[]>([])
  const [strategiesList, setStrategiesList] = useState<StrategyResponse[]>([])
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('new')
  const [editId, setEditId] = useState<number | null>(null)
  const [stratName, setStratName] = useState('')
  const [indicators, setIndicators] = useState<any[]>([])
  const [entryRule, setEntryRule] = useState<RuleNode>(defaultRule())
  const [exitRule, setExitRule] = useState<RuleNode>(defaultRule())
  const [entryScore, setEntryScore] = useState<ScoreNode>(defaultScore())
  const [exitScore, setExitScore] = useState<ScoreNode>(defaultScore())
  const [entryThreshold, setEntryThreshold] = useState('0.5')
  const [exitThreshold, setExitThreshold] = useState('0.5')
  const [availableColumns, setAvailableColumns] = useState<string[]>(['open', 'high', 'low', 'close', 'volume'])
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false)
  const [backtestInterval, setBacktestInterval] = useState('1d')
  const [initialCapital, setInitialCapital] = useState('10000')
  const [commission, setCommission] = useState('0.001')
  const [stopLoss, setStopLoss] = useState('0.02')
  const [takeProfit, setTakeProfit] = useState('0.04')
  const [backtestResults, setBacktestResults] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'per_asset'>('summary')
  const [selectedSymbol, setSelectedSymbol] = useState('')

  useEffect(() => {
    resetBuilderState()
    setBacktestResults(null)
    setSelectedSymbols([])
    setBacktestInterval('1d')
    setInitialCapital('10000')
    setCommission('0.001')
    setStopLoss('0.02')
    setTakeProfit('0.04')
    setStrategiesList([])
    setIsAssetPickerOpen(false)
    setIsIndicatorPickerOpen(false)
    setIsChartImportSheetOpen(false)
    setIsStrategySaveDialogOpen(false)
    loadStrategies()
    loadAssets()
    setActiveTab('summary')
    setSelectedSymbol('')
  }, [userId])

  useEffect(() => {
    updateColumns()
  }, [indicators])

  const loadStrategies = async () => {
    setLoading(true)
    try {
      const res = await listStrategies()
      setStrategiesList(res || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const loadAssets = async () => {
    try {
      const res = await fetchAssets()
      setAssets(res?.assets || [])
    } catch (e) {
      console.error(e)
    }
  }

  const updateColumns = async () => {
    try {
      const res = await fetchBacktestColumns({ body: { indicators } })
      setAvailableColumns(res?.columns || ['open', 'high', 'low', 'close', 'volume'])
    } catch (e) {
      console.error('Failed to update backtest columns:', e)
    }
  }

  const resetBuilderState = () => {
    setEditId(null)
    setStratName('')
    setIndicators([])
    setEntryRule(defaultRule())
    setExitRule(defaultRule())
    setEntryScore(defaultScore())
    setExitScore(defaultScore())
    setEntryThreshold('0.5')
    setExitThreshold('0.5')
  }

  const handleSelectStrategy = (idVal: string) => {
    setSelectedStrategyId(idVal)
    if (idVal === 'new') {
      resetBuilderState()
      return
    }

    const strategy = strategiesList.find((item) => String(item.id) === idVal)
    if (!strategy) return
    const json = (strategy.strategy_json as any) || {}
    if (!isV2StrategyJson(json)) {
      showAlert(
        t('common.unavailable'),
        t('strategies.incompatibleStrategy'),
        'warning',
      )
      setSelectedStrategyId('new')
      return
    }
    setEditId(strategy.id)
    setStratName(strategy.name)
    setIndicators(json.indicators || [])
    setEntryThreshold(String(json.thresholds?.[0] ?? 0.5))
    setExitThreshold(String(json.exit_threshold ?? 0.5))
    setEntryRule(json.entry_rule || defaultRule())
    setExitRule(json.exit_rule || defaultRule())
    setEntryScore(json.entry_score || defaultScore())
    setExitScore(json.exit_score || defaultScore())
  }

  const handleOpenStrategySaveDialog = () => {
    setPendingStrategyName(stratName || 'Untitled Strategy')
    setIsStrategySaveDialogOpen(true)
  }

  const handleSaveStrategy = async (nameOverride?: string) => {
    const finalName = (nameOverride ?? stratName).trim()
    if (!finalName) {
      showAlert(t('strategies.confirmDelete'), t('strategies.strategyName') + ' ' + t('auth.required'), 'warning')
      return
    }

    const thresholdVal = Number(entryThreshold)
    const exitThresholdVal = Number(exitThreshold)
    const payloadJson = buildStrategyV2({
      indicators,
      entry_rule: entryRule,
      exit_rule: exitRule,
      entry_score: entryScore,
      exit_score: exitScore,
      thresholds: [Number.isFinite(thresholdVal) ? thresholdVal : 0.5],
      exit_threshold: Number.isFinite(exitThresholdVal) ? exitThresholdVal : 0.5,
    })

    setLoading(true)
    try {
      if (editId) {
        await updateStrategy({ path: { strategy_id: editId }, body: { name: finalName, strategy_json: payloadJson } })
      } else {
        const res = await createStrategy({ body: { name: finalName, strategy_json: payloadJson } })
        if (res?.id) {
          setSelectedStrategyId(String(res.id))
          setEditId(res.id)
        }
      }
      setStratName(finalName)
      setIsStrategySaveDialogOpen(false)
      showAlert(t('common.success'), t('common.success'), 'success')
      loadStrategies()
    } catch (e: any) {
      showAlert(t('common.error'), `${t('common.save')} ${t('common.error')}: ${e.message}`, 'error')
    }
    setLoading(false)
  }

  const handleOpenChartImportSheet = async () => {
    try {
      const configs = await listCharts()
      setChartConfigs(configs || [])
      setIsChartImportSheetOpen(true)
    } catch (e: any) {
      showAlert(t('common.error'), e.message || t('chart.loadLayoutsFailed', { message: t('common.error') }), 'error')
    }
  }

  const applyChartIndicatorImport = (config: any) => {
    const imported = chartConfigToStrategyIndicators(config)
    if (imported.length === 0) {
      showAlert(t('common.unavailable'), t('strategies.noIndicatorsConfigured'), 'warning')
      return
    }
    setIndicators(imported)
    setIsChartImportSheetOpen(false)
    showAlert(t('common.success'), t('common.success'), 'success')
  }

  const handleImportChartIndicators = (config: any) => {
    if (indicators.length > 0) {
      showAlert(
        t('common.confirm', { defaultValue: 'Confirm' }),
        t('strategies.replaceIndicatorsConfirm', { defaultValue: 'Replace current indicators with this chart layout?' }),
        'warning',
        true,
        () => applyChartIndicatorImport(config),
      )
      return
    }
    applyChartIndicatorImport(config)
  }

  const handleDeleteStrategy = async (id: number) => {
    showAlert(
      t('strategies.confirmDelete'),
      t('strategies.confirmDeleteDesc'),
      'warning',
      true,
      async () => {
        setLoading(true)
        try {
          await deleteStrategy({ path: { strategy_id: id } })
          resetBuilderState()
          setSelectedStrategyId('new')
          loadStrategies()
        } catch (e: any) {
          showAlert(t('common.error'), `${t('common.delete')} ${t('common.error')}: ${e.message}`, 'error')
        }
        setLoading(false)
      },
    )
  }

  const buildBacktestPayload = () => {
    const thresholdVal = Number(entryThreshold)
    const exitThresholdVal = Number(exitThreshold)
    const symbols = (activeTab === 'per_asset' && selectedSymbol) ? [selectedSymbol] : selectedSymbols
    return {
      strategy_version: 2 as const,
      symbols,
      indicators,
      entry_rule: entryRule as any,
      exit_rule: exitRule as any,
      entry_score: entryScore as any,
      exit_score: exitScore as any,
      interval: backtestInterval,
      thresholds: [Number.isFinite(thresholdVal) ? thresholdVal : 0.5],
      exit_threshold: Number.isFinite(exitThresholdVal) ? exitThresholdVal : 0.5,
      params: {
        init_cash: Number(initialCapital),
        fees: Number(commission),
        sl_stop: Number(stopLoss),
        tp_stop: Number(takeProfit),
      },
    }
  }

  const handleRunBacktest = async () => {
    if (selectedSymbols.length === 0) {
      showAlert(t('backtest.requiredInput'), t('backtest.selectAssetAlert'), 'warning')
      return
    }
    setBacktesting(true)
    setBacktestResults(null)
    try {
      const res = await runBacktest({ body: buildBacktestPayload() })
      setBacktestResults(res)
      const nextIsPortfolio = !!(res?.symbols && res.symbols.length > 0)
      setActiveTab(nextIsPortfolio ? 'summary' : 'per_asset')
      setSelectedSymbol(res?.symbols?.[0] || res?.symbol || selectedSymbols[0] || '')
    } catch (e: any) {
      showAlert(t('backtest.title'), t('backtest.backtestFailed', { message: e.message }), 'error')
    }
    setBacktesting(false)
  }

  return {
    categories,
    isStrategyListSheetOpen,
    setIsStrategyListSheetOpen,
    isStrategySaveDialogOpen,
    setIsStrategySaveDialogOpen,
    pendingStrategyName,
    setPendingStrategyName,
    isIndicatorPickerOpen,
    setIsIndicatorPickerOpen,
    isChartImportSheetOpen,
    setIsChartImportSheetOpen,
    chartConfigs,
    loading,
    backtesting,
    assets,
    strategiesList,
    selectedStrategyId,
    stratName,
    setStratName,
    indicators,
    setIndicators,
    entryRule,
    setEntryRule,
    exitRule,
    setExitRule,
    entryScore,
    setEntryScore,
    exitScore,
    setExitScore,
    availableColumns,
    entryThreshold,
    setEntryThreshold,
    exitThreshold,
    setExitThreshold,
    selectedSymbols,
    setSelectedSymbols,
    isAssetPickerOpen,
    setIsAssetPickerOpen,
    backtestInterval,
    setBacktestInterval,
    initialCapital,
    setInitialCapital,
    commission,
    setCommission,
    stopLoss,
    setStopLoss,
    takeProfit,
    setTakeProfit,
    backtestResults,
    activeTab,
    setActiveTab,
    selectedSymbol,
    setSelectedSymbol,
    editId,
    handleSelectStrategy,
    handleOpenStrategySaveDialog,
    handleSaveStrategy,
    handleDeleteStrategy,
    handleOpenChartImportSheet,
    handleImportChartIndicators,
    handleRunBacktest,
  } as const
}
