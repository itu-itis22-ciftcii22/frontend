import React from 'react'
import { Keyboard, Platform } from 'react-native'
import { View, YStack, Button, Text, Spinner } from 'tamagui'
import { Trash2 } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '../ScreenContainer'
import { Chart } from '../Chart'
import { IndicatorModal } from '../IndicatorModal'
import { ListSheet } from '../ListSheet'
import { CustomAlert } from '../CustomAlert'
import { useAlert } from '../../hooks/useAlert'
import { ChartIntervalBar } from './ChartIntervalBar'
import { IndicatorLegend } from './IndicatorLegend'
import { SaveLayoutDialog } from './SaveLayoutDialog'
import { ChartToolbar } from './ChartToolbar'
import { useChartController } from '../../hooks/useChartController'
import { PrimaryButtonText, RowSurface } from '../ui'
import { PrimaryButton } from '../Button'

export function ChartTerminalScreen() {
  const { t } = useTranslation()
  const { showAlert, alertProps } = useAlert()
  const chart = useChartController(showAlert)

  return (
    <ScreenContainer>
      <ChartToolbar
        currentSymbol={chart.currentSymbol}
        interval={chart.interval}
        onChangeInterval={chart.changeInterval}
        onSelectSymbol={() => chart.setIsAssetPickerOpen(true)}
        onLoadLayout={chart.handleOpenLoadModal}
        onSaveLayout={chart.handleOpenSaveModal}
        onAddIndicator={() => chart.setIsIndicatorDrawerOpen(true)}
      />

      <ChartIntervalBar
        interval={chart.interval}
        chartRef={chart.chartRef}
        onRefresh={() => chart.setRefreshCount((prev) => prev + 1)}
      />

      <View flex={1} position="relative" bg="$surfaceDeep" justifyContent="center" alignItems="center">
        {chart.currentSymbol && chart.ohlcv ? (
          <Chart
            ref={chart.chartRef}
            symbol={chart.currentSymbol}
            ohlcv={chart.ohlcv}
            interval={chart.interval}
            onCrosshairMove={(price, isUp) => {
              chart.setCrosshairPrice(price)
              chart.setCrosshairIsUp(isUp)
            }}
          />
        ) : (
          <YStack gap="$4" alignItems="center" px="$6" py="$12">
            <Text color="$color8" fontSize="$4" textAlign="center" maxWidth={300}>
              {t('chart.emptyStateDesc')}
            </Text>
          </YStack>
        )}
        {chart.loading && (
          <YStack position="absolute" t={0} l={0} r={0} b={0} bg="$surfaceBase" opacity={0.7} justifyContent="center" alignItems="center" z={20}>
            <Spinner size="large" color="$brandSecondary" />
            <Text color="$color11" mt="$3" fontSize="$3">
              {t('chart.loadingTerminal')}
            </Text>
          </YStack>
        )}
      </View>

      <IndicatorLegend activeIndicators={chart.activeIndicators} onEdit={chart.editIndicator} onRemove={chart.removeIndicator} />

      <ListSheet
        open={chart.isAssetPickerOpen}
        onOpenChange={chart.setIsAssetPickerOpen}
        title={t('chart.selectSymbolTitle')}
        items={chart.catalog}
        searchRelationName="symbol"
        searchPredicate={(item, q) =>
          item.symbol.toLowerCase().includes(q.toLowerCase()) ||
          item.name.toLowerCase().includes(q.toLowerCase())
        }
        onSelect={(item) => {
          chart.setIsAssetPickerOpen(false)
          chart.loadData(item.symbol, chart.interval)
        }}
        snapPoints={[80]}
      />

      <SaveLayoutDialog
        open={chart.isSaveModalOpen}
        onOpenChange={chart.setIsSaveModalOpen}
        layoutName={chart.newLayoutName}
        onSave={chart.handleSaveLayout}
      />

      <ListSheet
        open={chart.isLoadModalOpen}
        onOpenChange={chart.setIsLoadModalOpen}
        title={t('chart.loadLayoutTitle')}
        items={[
          { id: 'new', name: `+ ${t('chart.createChart', { defaultValue: 'Create Chart' })}`, isNew: true },
          ...chart.savedConfigs.map((cfg) => ({ ...cfg, id: String(cfg.id), isNew: false }))
        ]}
        snapPoints={[60]}
        renderItem={(cfg) => {
          const isNew = cfg.isNew
          return (
            <RowSurface key={cfg.id}>
              <YStack gap="$1" onPress={() => chart.handleLoadLayout(cfg)} cursor="pointer" flex={1}>
                <Text fontWeight="bold" color="$color12">
                  {cfg.name}
                </Text>
                {!isNew && (
                  <Text color="$color8" fontSize="$2">
                    {t('chart.intervalLabel')} {(cfg.interval || '1m').toUpperCase()} - {cfg.chart_config?.indicators?.length || 0} {t('chart.indicatorsTitle')}
                  </Text>
                )}
              </YStack>
              {!isNew && (
                <Button size="$2.5" chromeless circular theme="red" icon={Trash2} onPress={() => chart.handleDeleteLayout(Number(cfg.id))} />
              )}
            </RowSurface>
          )
        }}
        onSelect={() => {}}
      />

      <ListSheet
        open={chart.isIndicatorDrawerOpen}
        onOpenChange={chart.setIsIndicatorDrawerOpen}
        title={t('chart.indicatorsTitle')}
        items={chart.flatCategories}
        groupByKey="category"
        searchRelationName="indicator"
        searchPredicate={(item, q) => {
          const matchesSearch = `${item.name} ${item.description || ''}`.toLowerCase().includes(q.toLowerCase())
          return matchesSearch && !(chart.interval && item.supported_timeframes && !item.supported_timeframes.includes(chart.interval))
        }}
        renderItem={(item) => (
          <Button
            key={item.name}
            justifyContent="flex-start"
            bg="$surfaceCard"
            rounded="$3"
            hoverStyle={{ bg: '$surfaceHover' }}
            onPress={() => {
              if (Platform.OS !== 'web') {
                chart.setIsIndicatorDrawerOpen(false)
                setTimeout(() => {
                  Keyboard.dismiss();
                  chart.handleIndicatorSelect(item.name, item)
                }, 400);
              } else {
                chart.setIsIndicatorDrawerOpen(false)
                chart.handleIndicatorSelect(item.name, item)
              }
            }}
          >
            <Text color="$color12">{item.description || item.name.toUpperCase()}</Text>
          </Button>
        )}
        onSelect={() => {}}
        snapPoints={[85]}
      />

      {chart.modalIndicatorName && chart.modalIndicatorInfo && (
        <IndicatorModal
          isOpen={chart.isModalOpen}
          onOpenChange={chart.setIsModalOpen}
          indicatorName={chart.modalIndicatorName}
          indicatorInfo={chart.modalIndicatorInfo}
          initialParams={chart.initialParams}
          initialPane={chart.initialPane}
          initialColors={chart.initialColors}
          paneOptions={chart.buildPaneOptions()}
          onApply={chart.handleApplyIndicator}
        />
      )}

      <CustomAlert {...alertProps} />
    </ScreenContainer>
  )
}
