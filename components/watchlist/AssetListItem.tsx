import React from "react";
import { XStack, YStack, Text, Button, Theme } from "tamagui";
import { Trash2, ChevronUp, ChevronDown, Pencil } from "@tamagui/lucide-icons-2";
import { useTranslation } from "react-i18next";
import { Surface } from "../Surface";
import { Badge } from "../Badge";
import { ValueText } from "../ui";
import { StrategyResponse, StrategySignalEvaluationResult } from "../../lib/api/generated";

interface PairedIndicator {
  name: string;
  params: Record<string, any>;
  timeframe: string;
  value?: number | null;
}

interface AssetListItemProps {
  symbol: string;
  name: string;
  sector: string;
  currency?: string;
  price1d: number | null;
  change1d: number | null;
  changePercent1d: number | null;
  price1m: number | null;
  change1m: number | null;
  changePercent1m: number | null;
  pairedIndicators: PairedIndicator[];
  onEdit: (symbol: string, pairedIndicators: PairedIndicator[]) => void;
  onDelete: (symbol: string) => void;

  // Reordering props
  index: number;
  totalCount: number;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;

  // Strategy Monitoring props
  associatedStrategyIds?: number[];
  strategiesList: StrategyResponse[];
  strategySignals?: Record<number, StrategySignalEvaluationResult[]>;
}

export const AssetListItem = React.memo(
  function AssetListItem({
    symbol,
    name,
    sector,
    currency,
    price1d,
    change1d,
    changePercent1d,
    price1m,
    change1m,
    changePercent1m,
    pairedIndicators,
    onEdit,
    onDelete,
    index,
    totalCount,
    onMoveUp,
    onMoveDown,
    associatedStrategyIds = [],
    strategiesList = [],
    strategySignals = {},
  }: AssetListItemProps) {
    const { t } = useTranslation();
    const isUp1d = change1d !== null ? change1d >= 0 : null;
    const isUp1m = change1m !== null ? change1m >= 0 : null;
    const companyDetail = [name, currency].filter(Boolean).join(" • ");

    const formatStrength = (value?: number | null) => (typeof value === "number" ? value.toFixed(2) : "--");
    const formatSignalTimestamp = (signal: StrategySignalEvaluationResult) => {
      if (!signal.timestamp) return t("watchlist.waitingForData");
      const date = new Date(signal.timestamp);
      if (signal.interval === "1d") {
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      }
      return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    };

    return (
      <Surface p="$2.5">
        <XStack gap="$3" alignItems="flex-start" justifyContent="space-between">
          {/* Main section: symbol and compact prices */}
          <YStack gap="$1.5" flex={1} minWidth={0}>
            <XStack alignItems="baseline" gap="$2" minWidth={0} width="100%">
              <ValueText fontSize="$5" numberOfLines={1}>
                {symbol}
              </ValueText>
              <Text fontSize="$1" color="$color8" numberOfLines={1} flex={1} minWidth={0}>
                {companyDetail}
              </Text>
            </XStack>

            <YStack gap="$0.5" width="100%">
              {/* 1D Price */}
              <XStack gap="$1.5" alignItems="center">
                <Text width={20} fontSize={11} lineHeight={14} fontWeight="700" color="$color8">
                  1D
                </Text>
                <Text
                  fontSize={11}
                  lineHeight={14}
                  fontWeight="700"
                  color="$color12"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {price1d !== null ? price1d.toFixed(2) : "—"}
                </Text>
                {change1d !== null && changePercent1d !== null ? (
                  <Theme name={isUp1d ? "green" : "red"}>
                    <Text
                      fontSize={11}
                      lineHeight={14}
                      fontWeight="600"
                      color="$color10"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {isUp1d ? "+" : ""}{changePercent1d.toFixed(2)}%
                    </Text>
                  </Theme>
                ) : (
                  <Text fontSize="$1" color="$color8">
                    —
                  </Text>
                )}
              </XStack>

              {/* 1M Price */}
              <XStack gap="$1.5" alignItems="center">
                <Text width={20} fontSize={11} lineHeight={14} fontWeight="700" color="$color8">
                  1M
                </Text>
                <Text
                  fontSize={11}
                  lineHeight={14}
                  fontWeight="700"
                  color="$color12"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {price1m !== null ? price1m.toFixed(2) : "—"}
                </Text>
                {change1m !== null && changePercent1m !== null ? (
                  <Theme name={isUp1m ? "green" : "red"}>
                    <Text
                      fontSize={11}
                      lineHeight={14}
                      fontWeight="600"
                      color="$color10"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {isUp1m ? "+" : ""}{changePercent1m.toFixed(2)}%
                    </Text>
                  </Theme>
                ) : (
                  <Text fontSize="$1" color="$color8">
                    —
                  </Text>
                )}
              </XStack>
            </YStack>
          </YStack>

          <XStack alignItems="center" gap="$2.5">
            {/* Action Buttons: Edit Configs & Delete */}
            <XStack gap="$1">
              <Button
                size="$2.5"
                chromeless
                circular
                icon={Pencil}
                hoverStyle={{ bg: "$surfaceHover" }}
                pressStyle={{ scale: 0.95 }}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(symbol, pairedIndicators);
                }}
              />
              <Button
                size="$2.5"
                chromeless
                circular
                theme="red"
                icon={Trash2}
                hoverStyle={{ bg: "$red4" }}
                pressStyle={{ scale: 0.95 }}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete(symbol);
                }}
              />
            </XStack>

            {/* Reordering Buttons: Up & Down stacked */}
            <YStack gap="$1" alignItems="center">
              <Button
                size="$1.5"
                circular
                disabled={index === 0}
                icon={ChevronUp}
                onPress={() => onMoveUp?.(index)}
                hoverStyle={{ bg: "$surfaceHover" }}
                pressStyle={{ scale: 0.95 }}
              />
              <Button
                size="$1.5"
                circular
                disabled={index === totalCount - 1}
                icon={ChevronDown}
                onPress={() => onMoveDown?.(index)}
                hoverStyle={{ bg: "$surfaceHover" }}
                pressStyle={{ scale: 0.95 }}
              />
            </YStack>
          </XStack>
        </XStack>

        {/* Paired Indicators Chips */}
        {pairedIndicators && pairedIndicators.length > 0 && (
          <XStack
            flexWrap="wrap"
            gap="$2"
            mt="$2"
            pt="$2"
            borderTopWidth={1}
            borderTopColor="$surfaceDeep"
          >
            {pairedIndicators.map((ind, i) => {
              const paramVal = Object.values(ind.params || {})
                .filter((v) => v !== "" && v !== null)
                .join(",");
              const label = `${ind.name.toUpperCase()}${paramVal ? `(${paramVal})` : ""} @ ${ind.timeframe}`;
              return (
                <Badge key={i} py="$1" gap="$1.5">
                  <Text fontSize="$1" color="$color11">
                    {label}
                  </Text>
                  {ind.value !== undefined && ind.value !== null && (
                    <Text
                      fontSize="$1"
                      fontWeight="bold"
                      color="$brandGold"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {ind.value.toFixed(2)}
                    </Text>
                  )}
                </Badge>
              );
            })}
          </XStack>
        )}

        {/* Monitored Strategies inline panel */}
        {associatedStrategyIds && associatedStrategyIds.length > 0 && (
          <YStack mt="$2" pt="$2" borderTopWidth={1} borderTopColor="$borderColor" gap="$2">
            <Text fontSize="$1" fontWeight="bold" color="$brandGold" letterSpacing={0.5}>
              {t("watchlist.monitoredStrategies")}
            </Text>
            <YStack gap="$2">
              {associatedStrategyIds.map((strategyId) => {
                const strategy = strategiesList.find((s) => s.id === strategyId);
                if (!strategy) return null;

                const matchingSignals = [...(strategySignals[strategyId] || [])].sort((a, b) => a.interval.localeCompare(b.interval));

                return (
                  <YStack
                    key={strategyId}
                    bg="$surfaceDeep"
                    p="$2"
                    borderRadius="$2"
                    gap="$1.5"
                  >
                    <Text fontSize="$2" fontWeight="bold" color="$brandGold" numberOfLines={1}>
                      {strategy.name}
                    </Text>
                    {matchingSignals.length > 0 ? (
                      matchingSignals.map((signal) => {
                        const entryActive = (signal.signals || []).includes("ENTRY");
                        const exitActive = (signal.signals || []).includes("EXIT");
                        return (
                          <XStack key={`${strategyId}-${signal.interval}`} alignItems="center" justifyContent="space-between" gap="$2">
                            <Text color="$color8" fontSize="$1" width={28} fontWeight="700">
                              {signal.interval.toUpperCase()}
                            </Text>
                            <Text color="$color8" fontSize="$1" flex={1} numberOfLines={1}>
                              {formatSignalTimestamp(signal)}
                            </Text>
                            <XStack gap="$1.5" alignItems="center">
                              <Text color={entryActive ? "$green10" : "$color10"} fontSize="$1" fontWeight="700">
                                E {formatStrength(signal.entry_strength)}
                              </Text>
                              <Text color={exitActive ? "$red10" : "$color10"} fontSize="$1" fontWeight="700">
                                X {formatStrength(signal.exit_strength)}
                              </Text>
                            </XStack>
                          </XStack>
                        );
                      })
                    ) : (
                      <Text color="$color8" fontSize="$1">
                        {t("watchlist.waitingForData")}
                      </Text>
                    )}
                  </YStack>
                );
              })}
            </YStack>
          </YStack>
        )}
      </Surface>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.symbol === nextProps.symbol &&
      prevProps.name === nextProps.name &&
      prevProps.sector === nextProps.sector &&
      prevProps.currency === nextProps.currency &&
      prevProps.price1d === nextProps.price1d &&
      prevProps.change1d === nextProps.change1d &&
      prevProps.changePercent1d === nextProps.changePercent1d &&
      prevProps.price1m === nextProps.price1m &&
      prevProps.change1m === nextProps.change1m &&
      prevProps.changePercent1m === nextProps.changePercent1m &&
      prevProps.index === nextProps.index &&
      prevProps.totalCount === nextProps.totalCount &&
      JSON.stringify(prevProps.pairedIndicators) === JSON.stringify(nextProps.pairedIndicators) &&
      JSON.stringify(prevProps.associatedStrategyIds) === JSON.stringify(nextProps.associatedStrategyIds) &&
      prevProps.strategiesList === nextProps.strategiesList &&
      JSON.stringify(prevProps.strategySignals) === JSON.stringify(nextProps.strategySignals)
    );
  }
);
