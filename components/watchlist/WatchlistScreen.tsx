import React from 'react'
import { YStack, Button, Text, ScrollView, Spinner } from 'tamagui'
import { Plus } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../hooks/useAlert'
import { useWatchlistController } from '../../hooks/useWatchlistController'
import { AssetListItem } from './AssetListItem'
import { ListSheet } from '../ListSheet'
import { ScreenContainer } from '../ScreenContainer'
import { CustomAlert } from '../CustomAlert'
import { MutedText, PrimaryButtonText } from '../ui'
import { HeaderBar } from '../navigation/HeaderBar'
import { WatchlistConfigSheet } from './WatchlistConfigSheet'
import { PrimaryButton } from '../Button'

export function WatchlistScreen() {
  const { t } = useTranslation()
  const { showAlert, alertProps } = useAlert()
  const controller = useWatchlistController(showAlert)

  return (
    <ScreenContainer>
      <HeaderBar title={t('watchlist.title', { defaultValue: 'Watchlist' })} />

      <ScrollView flex={1} p="$3" $xs={{ p: '$2' }} contentContainerStyle={{ pb: '$10' }}>
        {controller.loading ? (
          <YStack py="$8" alignItems="center" justifyContent="center">
            <Spinner size="large" color="$brandSecondary" />
          </YStack>
        ) : (
          <YStack gap="$4">
            {controller.watchlist.length === 0 ? (
              <YStack py="$12" alignItems="center" gap="$3">
                <MutedText textAlign="center" fontSize="$4">
                  {t('watchlist.emptyState')}
                </MutedText>
                <PrimaryButton size="$3.5" rounded="$3" onPress={() => controller.setIsWatchlistPickerOpen(true)}>
                  <PrimaryButtonText>
                    {t('watchlist.catalogSearch')}
                  </PrimaryButtonText>
                </PrimaryButton>
              </YStack>
            ) : (
              <YStack gap="$3">
                {controller.watchlist.map((entry, index) => {
                  const priceInfo1d = controller.watchlistPrices1d[entry.symbol] || { price: null, change: null, pct: null }
                  const priceInfo1m = controller.watchlistPrices1m[entry.symbol] || { price: null, change: null, pct: null }
                  const catalogMeta = controller.catalog.find((asset) => asset.symbol === entry.symbol)
                  const meta = {
                    name: entry.name || catalogMeta?.name || entry.symbol,
                    sector: entry.sector || catalogMeta?.sector || '',
                    currency: entry.currency || catalogMeta?.currency || '',
                  }
                  return (
                    <AssetListItem
                      key={entry.symbol}
                      symbol={entry.symbol}
                      name={meta.name}
                      sector={meta.sector}
                      currency={meta.currency}
                      price1d={priceInfo1d.price}
                      change1d={priceInfo1d.change}
                      changePercent1d={priceInfo1d.pct}
                      price1m={priceInfo1m.price}
                      change1m={priceInfo1m.change}
                      changePercent1m={priceInfo1m.pct}
                      pairedIndicators={entry.pairedIndicators || []}
                      onEdit={controller.openAssetConfigs}
                      onDelete={controller.deleteWatchlistAsset}
                      index={index}
                      totalCount={controller.watchlist.length}
                      onMoveUp={(itemIndex) => controller.moveWatchlistAsset(itemIndex, -1)}
                      onMoveDown={(itemIndex) => controller.moveWatchlistAsset(itemIndex, 1)}
                      associatedStrategyIds={entry.associatedStrategies}
                      strategiesList={controller.strategies}
                      strategySignals={controller.strategySignals[entry.symbol]}
                    />
                  )
                })}
              </YStack>
            )}
          </YStack>
        )}
      </ScrollView>

      <Button
        position="absolute"
        bottom="$4"
        right="$4"
        size="$4.5"
        circular
        bg="$brandPrimary"
        hoverStyle={{ bg: '$brandPrimaryHover' }}
        pressStyle={{ scale: 0.9 }}
        icon={<Plus size={24} color="$accentForeground" />}
        elevation="$3"
        zIndex={100}
        onPress={() => controller.setIsWatchlistPickerOpen(true)}
      />

      <ListSheet
        open={controller.isWatchlistPickerOpen}
        onOpenChange={controller.setIsWatchlistPickerOpen}
        title={t('watchlist.addAssetToTrack')}
        items={controller.catalog}
        searchRelationName="symbol"
        searchPredicate={(item, q) =>
          item.symbol.toLowerCase().includes(q.toLowerCase()) ||
          item.name.toLowerCase().includes(q.toLowerCase())
        }
        onSelect={() => {}}
        renderItem={(item) => {
          const isAlreadyAdded = controller.watchlist.some((entry) => entry.symbol === item.symbol)
          return (
            <Button
              key={item.symbol}
              justifyContent="space-between"
              bg="$surfaceCard"
              rounded="$3"
              opacity={isAlreadyAdded ? 0.4 : 1}
              disabled={isAlreadyAdded}
              mb="$2"
              onPress={async () => {
                if (isAlreadyAdded) return
                controller.setIsWatchlistPickerOpen(false)
                await controller.addWatchlistAsset(item.symbol)
              }}
              hoverStyle={isAlreadyAdded ? {} : { bg: '$surfaceHover' }}
            >
              <Text fontWeight="bold" color="$color12">
                {item.symbol}
              </Text>
              <Text color="$color8" fontSize="$2">
                {isAlreadyAdded ? t('watchlist.alreadyAdded') : item.name}
              </Text>
            </Button>
          )
        }}
      />

      <WatchlistConfigSheet
        open={controller.isEditConfigsOpen}
        onOpenChange={controller.setIsEditConfigsOpen}
        editingAssetSymbol={controller.editingAssetSymbol}
        chartConfigs={controller.chartConfigs}
        strategies={controller.strategies}
        selectedConfigIds={controller.tempSelectedConfigIds}
        onSelectedConfigIdsChange={controller.setTempSelectedConfigIds}
        selectedStrategyIds={controller.tempSelectedStrategyIds}
        onSelectedStrategyIdsChange={controller.setTempSelectedStrategyIds}
        onSave={controller.saveAssetConfigs}
        onCancel={controller.closeAssetConfigs}
      />

      <CustomAlert {...alertProps} />
    </ScreenContainer>
  )
}
