import React, { useState, useMemo } from 'react';
import { YStack, XStack, Button, Text, Label } from 'tamagui';
import { Keyboard, Platform } from 'react-native';
import { Plus, Trash2 } from '@tamagui/lucide-icons-2';
import { ListSheet } from './ListSheet';
import { IndicatorModal, IndicatorInfo } from './IndicatorModal';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from './Button';
import { PrimaryButtonText } from './ui';

interface IndicatorEntry {
  name: string;
  params: Record<string, any>;
}

interface IndicatorListEditorProps {
  indicators: IndicatorEntry[];
  onAdd: (indicator: IndicatorEntry) => void;
  onRemove: (index: number) => void;
  categories: Record<string, IndicatorInfo[]>;
  /** Label shown above the list. Defaults to "Technical Indicators". */
  title?: string;
  /** Whether to show the pane selector in the modal. Defaults to false. */
  showPaneSelector?: boolean;
  /** Whether to show the timeframe field in the modal. */
  showTimeframe?: boolean;
  /** Pane options to show when showPaneSelector is true */
  paneOptions?: { value: string; label: string }[];
  /** Full onApply for advanced uses (chart page). Overrides default behavior. */
  onApplyFull?: (params: any, pane: string, colors: any, timeframe?: string) => void;
  /** Label for the add button */
  addButtonLabel?: string;
  /** Optional controlled open state for the indicator picker sheet. */
  isSelectOpen?: boolean;
  onSelectOpenChange?: (open: boolean) => void;
  /** Hide the local add button when an external toolbar owns adding. */
  hideAddButton?: boolean;
  /** Compact mode for dense builder surfaces. */
  compact?: boolean;
}

/**
 * Self-contained indicator list with add/remove and built-in select + config modals.
 * Replaces the duplicated indicator management flow across strategies, backtest, and index pages.
 */
export function IndicatorListEditor({
  indicators,
  onAdd,
  onRemove,
  categories,
  title,
  showPaneSelector = false,
  showTimeframe = false,
  paneOptions,
  onApplyFull,
  addButtonLabel,
  isSelectOpen: controlledSelectOpen,
  onSelectOpenChange,
  hideAddButton = false,
  compact = false,
}: IndicatorListEditorProps) {
  const { t } = useTranslation();

  const flatCategories = useMemo<any[]>(() => {
    return Object.entries(categories).flatMap(([catName, items]) =>
      items.map((item: any) => ({ ...item, category: catName }))
    );
  }, [categories]);

  const [uncontrolledSelectOpen, setUncontrolledSelectOpen] = useState(false);
  const [modalName, setModalName] = useState<string | null>(null);
  const [modalInfo, setModalInfo] = useState<IndicatorInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSelectOpen = controlledSelectOpen ?? uncontrolledSelectOpen;
  const setIsSelectOpen = onSelectOpenChange ?? setUncontrolledSelectOpen;

  const handleSelect = (name: string, info: IndicatorInfo) => {
    setModalName(name);
    setModalInfo(info);
    setIsModalOpen(true);
    setIsSelectOpen(false);
  };

  const handleApply = (params: any, pane?: string, colors?: any, timeframe?: string) => {
    if (onApplyFull) {
      onApplyFull(params, pane || 'main', colors, timeframe);
    } else {
      if (!modalName) return;
      onAdd({ name: modalName, params });
    }
  };

  return (
    <>
      {!compact && (
        <XStack justifyContent="space-between" alignItems="center">
          <Label color="$color11" fontWeight="600">
            {title || t('chart.indicatorsTitle')}
          </Label>
          {!hideAddButton && (
            <PrimaryButton
              size="$2.5"
              icon={Plus}
              onPress={() => setIsSelectOpen(true)}
              rounded="$3"
            >
              <PrimaryButtonText>{addButtonLabel || t('common.add')}</PrimaryButtonText>
            </PrimaryButton>
          )}
        </XStack>
      )}
      {compact && !hideAddButton && (
        <XStack justifyContent="flex-end" alignItems="center">
          <PrimaryButton
            size="$2.5"
            icon={Plus}
            onPress={() => setIsSelectOpen(true)}
            rounded="$3"
          >
            <PrimaryButtonText>{addButtonLabel || t('common.add')}</PrimaryButtonText>
          </PrimaryButton>
        </XStack>
      )}

      {/* Indicator list */}
      {indicators.length === 0 ? (
        <Text color="$color8" fontSize="$2" py="$2">
          {t('strategies.noIndicatorsConfigured')}
        </Text>
      ) : (
        <YStack gap="$2">
          {indicators.map((ind, idx) => (
            <XStack
              key={idx}
              justifyContent="space-between"
              alignItems="center"
              bg="$surfaceDeep"
              p="$2"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text color="$color12" fontSize="$3">
                {ind.name.toUpperCase()}(
                {Object.values(ind.params || {}).join(',')})
              </Text>
              <Button
                size="$2.5"
                chromeless
                circular
                theme="red"
                icon={Trash2}
                onPress={() => onRemove(idx)}
              />
            </XStack>
          ))}
        </YStack>
      )}

      {/* Indicator select sheet */}
      <ListSheet
        open={isSelectOpen}
        onOpenChange={setIsSelectOpen}
        title={title || t('watchlist.selectIndicator')}
        items={flatCategories}
        groupByKey="category"
        searchRelationName="indicator"
        renderItem={(item) => (
          <Button
            key={item.name}
            justifyContent="flex-start"
            bg="$surfaceCard"
            rounded="$3"
            hoverStyle={{ bg: "$surfaceHover" }}
            onPress={() => {
              if (Platform.OS !== 'web') {
                setIsSelectOpen(false);
                setTimeout(() => {
                  Keyboard.dismiss();
                  handleSelect(item.name, item);
                }, 400);
              } else {
                setIsSelectOpen(false);
                handleSelect(item.name, item);
              }
            }}
          >
            <Text color="$color12">
              {compact ? item.name.toUpperCase() : item.description || item.name.toUpperCase()}
            </Text>
          </Button>
        )}
        onSelect={() => {}}
        snapPoints={[85]}
      />

      {/* Indicator param config modal */}
      {modalName && modalInfo && (
        <IndicatorModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          indicatorName={modalName}
          indicatorInfo={modalInfo}
          showPaneSelector={showPaneSelector}
          showTimeframe={showTimeframe}
          paneOptions={paneOptions}
          onApply={handleApply}
        />
      )}
    </>
  );
}
