import React from 'react';
import { View, XStack, ScrollView, Text, Button } from 'tamagui';
import { Trash2 } from '@tamagui/lucide-icons-2';

interface ActiveIndicator {
  id: string;
  indicator: string;
  params: Record<string, any>;
  seriesColors?: Record<string, string>;
}

interface IndicatorLegendProps {
  activeIndicators: ActiveIndicator[];
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

export function IndicatorLegend({
  activeIndicators,
  onEdit,
  onRemove,
}: IndicatorLegendProps) {
  if (activeIndicators.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      maxH={52}
      bg="$surfaceDeep"
      p="$2"
      borderTopWidth={1}
      borderTopColor="$borderColor"
    >
      <XStack gap="$2" alignItems="center">
        {activeIndicators.map((a) => {
          const paramStr = Object.values(a.params || {})
            .filter((v) => v !== '' && v !== null)
            .join(', ');
          const label = `${a.indicator.toUpperCase()}${paramStr ? `(${paramStr})` : ''}`;
          return (
            <XStack
              key={a.id}
              bg="$surfaceCard"
              px="$3"
              py="$2"
              rounded="$10"
              alignItems="center"
              gap="$2"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <XStack gap="$1">
                {a.seriesColors &&
                  Object.values(a.seriesColors).map((c: any, i) => (
                    <View key={i} width={8} height={8} rounded={4} bg={c} />
                  ))}
              </XStack>
              <Text fontSize="$2" color="$color12">
                {label}
              </Text>
              <XStack gap="$1">
                <Button
                  size="$1.5"
                  circular
                  chromeless
                  icon={<Text fontSize="$4">⚙</Text>}
                  onPress={() => onEdit(a.id)}
                />
                <Button
                  size="$1.5"
                  circular
                  chromeless
                  theme="red"
                  icon={Trash2}
                  onPress={() => onRemove(a.id)}
                />
              </XStack>
            </XStack>
          );
        })}
      </XStack>
    </ScrollView>
  );
}
