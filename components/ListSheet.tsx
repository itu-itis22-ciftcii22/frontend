import React, { useCallback, useMemo, useState } from 'react';
import { Sheet, YStack, Text, Input, ScrollView } from 'tamagui';
import { Keyboard, Platform } from 'react-native';
import { SectionTitle, SelectableRow, SelectableRowSubtext, SelectableRowText } from './ui';
import { useTranslation } from 'react-i18next';

export interface ListSheetProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  items: T[];
  
  /** Search configuration */
  searchRelationName?: string; // e.g. "symbol", "strategy", "indicator"
  searchPredicate?: (item: T, query: string) => boolean;
  searchPlaceholder?: string;
  
  /** Category grouping key (optional) */
  groupByKey?: keyof T;
  
  /** Item selection & rendering */
  onSelect: (item: T) => void;
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  
  /** Multi-select support */
  selectedItems?: T[];
  isMultiSelect?: boolean;
  
  /** Custom footer controls (e.g., Save/Cancel buttons) */
  footer?: React.ReactNode;
  
  /** Custom snap/height settings */
  snapPoints?: number[];
  zIndex?: number;
}

export function ListSheet<T extends { id?: string | number; symbol?: string; name?: string; [key: string]: any }>({
  open,
  onOpenChange,
  title,
  subtitle,
  items,
  searchRelationName,
  searchPredicate,
  searchPlaceholder,
  groupByKey,
  onSelect,
  renderItem,
  selectedItems = [],
  isMultiSelect = false,
  footer,
  snapPoints = [75],
  zIndex = 140000,
}: ListSheetProps<T>) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Default search predicate: filters by checking string fields or symbol/name matches
  const defaultPredicate = useCallback((item: T, query: string) => {
    const q = query.toLowerCase();
    if (item.symbol && item.symbol.toLowerCase().includes(q)) return true;
    if (item.name && item.name.toLowerCase().includes(q)) return true;
    return Object.values(item).some(
      (val) => typeof val === 'string' && val.toLowerCase().includes(q)
    );
  }, []);

  const activePredicate = useMemo(
    () => searchPredicate || defaultPredicate,
    [searchPredicate, defaultPredicate],
  );

  // Filter items
  const filtered = useMemo(() => {
    if (!searchRelationName || !searchQuery) return items;
    return items.filter((item) => activePredicate(item, searchQuery));
  }, [items, searchQuery, searchRelationName, activePredicate]);

  // Group items if key is provided
  const grouped = useMemo(() => {
    if (!groupByKey) return null;
    const groups: Record<string, T[]> = {};
    for (const item of filtered) {
      const key = String(item[groupByKey] || 'Other');
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [filtered, groupByKey]);

  // Clean state when closing
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      Keyboard.dismiss();
      setSearchQuery('');
    }
    if (!isOpen && Platform.OS !== 'web') {
      setTimeout(() => {
        onOpenChange(false);
      }, 250);
    } else {
      onOpenChange(isOpen);
    }
  };

  const defaultRenderItem = (item: T, isSelected: boolean) => {
    const itemTitle = item.symbol || item.name || item.description || String(item);
    const itemSubtitle = item.name && item.symbol ? item.name : item.description || '';
    
    return (
      <SelectableRow
        key={item.id || item.symbol || itemTitle}
        selected={isSelected}
        onPress={() => {
          if (Platform.OS !== 'web') {
            setTimeout(() => {
              Keyboard.dismiss();
              onSelect(item);
            }, 250);
          } else {
            onSelect(item);
          }
        }}
      >
        <SelectableRowText selected={isSelected}>
          {itemTitle}
        </SelectableRowText>
        {itemSubtitle && (
          <SelectableRowSubtext
            selected={isSelected}
            numberOfLines={1}
            textAlign="right"
            flex={1}
            ml="$2"
          >
            {itemSubtitle}
          </SelectableRowSubtext>
        )}
      </SelectableRow>
    );
  };

  const activeRenderItem = renderItem || defaultRenderItem;

  const placeholderText =
    searchPlaceholder ||
    (searchRelationName
      ? t('common.searchByRelation', { relation: searchRelationName, defaultValue: `Search by ${searchRelationName}...` })
      : t('common.search', { defaultValue: 'Search...' }));

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={handleOpenChange}
      snapPoints={snapPoints}
      snapPointsMode="percent"
      dismissOnSnapToBottom
      zIndex={zIndex}
      transition="lazy"
      disableDrag={true}
    >
      <Sheet.Overlay transition="lazy" bg="$shadow6" />
      <Sheet.Handle />
      <Sheet.Frame
        transition="lazy"
        p="$4"
        gap="$4"
        bg="$surfaceDeep"
        borderTopLeftRadius="$4"
        borderTopRightRadius="$4"
      >
        <YStack gap="$1.5">
          <SectionTitle>{title}</SectionTitle>
          {subtitle && (
            <Text color="$color8" fontSize="$2">
              {subtitle}
            </Text>
          )}
        </YStack>

        {searchRelationName && (
          <Input
            placeholder={placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            bg="$surfaceCard"
            borderColor="$borderColor"
            color="$color12"
            size="$3.5"
            rounded="$3"
          />
        )}

        <ScrollView
          flex={1}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          <YStack gap="$2" pb="$8" mt="$1">
            {grouped ? (
              // Grouped Render (e.g. for Indicators grouped by Category)
              Object.entries(grouped).map(([category, catItems]) => (
                <YStack key={category} gap="$2" mt="$2">
                  <Text
                    color="$color11"
                    fontSize="$2"
                    textTransform="uppercase"
                    letterSpacing={1}
                    fontWeight="bold"
                    px="$1"
                  >
                    {category}
                  </Text>
                  {catItems.map((item) => {
                    const isSelected = selectedItems.some((sel) => sel.id === item.id || (sel.symbol && sel.symbol === item.symbol));
                    return activeRenderItem(item, isSelected);
                  })}
                </YStack>
              ))
            ) : (
              // Flat Render
              filtered.length === 0 ? (
                <Text color="$color8" textAlign="center" py="$6">
                  {t('common.noResults', { defaultValue: 'No items found.' })}
                </Text>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedItems.some(
                    (sel) =>
                      sel.id === item.id ||
                      (sel.symbol && sel.symbol === item.symbol) ||
                      (item.id === undefined && sel.name === item.name)
                  );
                  return activeRenderItem(item, isSelected);
                })
              )
            )}
          </YStack>
        </ScrollView>

        {footer && <YStack mt="auto">{footer}</YStack>}
      </Sheet.Frame>
    </Sheet>
  );
}
