import React from 'react';
import { ScrollView, XStack, Button, Text } from 'tamagui';
import { Download, RefreshCw } from '@tamagui/lucide-icons-2';
import { ChartRef } from '../Chart';
import { useTranslation } from 'react-i18next';

const CHART_INTERVALS = [
  { value: '1m', label: '1 Minute' },
  { value: '1d', label: '1 Day' },
];

const VIEW_RANGE_SHORTCUTS: Record<string, { label: string; bars: number }[]> =
  {
    '1m': [
      { label: '1H', bars: 60 },
      { label: '4H', bars: 240 },
      { label: '1D', bars: 390 },
      { label: '1W', bars: 1950 },
    ],
    '1d': [
      { label: '1M', bars: 21 },
      { label: '3M', bars: 63 },
      { label: '6M', bars: 126 },
      { label: '1Y', bars: 252 },
    ],
  };

interface ChartIntervalBarProps {
  interval: string;
  chartRef: React.RefObject<ChartRef | null>;
  onRefresh: () => void;
}

export function ChartIntervalBar({
  interval,
  chartRef,
  onRefresh,
}: ChartIntervalBarProps) {
  const { t } = useTranslation();
  return (
    <XStack
      bg="$surfaceRaised"
      borderBottomWidth={1}
      borderBottomColor="$borderSubtle"
      alignItems="center"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        flex={1}
        contentContainerStyle={{ alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 8 }}
      >
        {(VIEW_RANGE_SHORTCUTS[interval] || VIEW_RANGE_SHORTCUTS['1m']).map(
          (tf) => (
            <Button
              key={tf.label}
              size="$2.5"
              chromeless
              rounded="$6"
              onPress={() => chartRef.current?.setTimeRange(tf.bars)}
            >
              <Text color="$textMuted" fontWeight="bold">
                {tf.label}
              </Text>
            </Button>
          ),
        )}

        <Button
          size="$2.5"
          chromeless
          rounded="$6"
          onPress={() => chartRef.current?.fitContent()}
        >
          <Text color="$textMuted" fontWeight="bold">
            {t("chart.all")}
          </Text>
        </Button>
      </ScrollView>

      <XStack gap="$1" pr="$2" alignItems="center">
        <Button
          size="$2.5"
          chromeless
          circular
          icon={Download}
          onPress={() => chartRef.current?.takeScreenshot()}
        />
        <Button
          size="$2.5"
          chromeless
          circular
          icon={RefreshCw}
          onPress={onRefresh}
        />
      </XStack>
    </XStack>
  );
}

export { CHART_INTERVALS, VIEW_RANGE_SHORTCUTS };
