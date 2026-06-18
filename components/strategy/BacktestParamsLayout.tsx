import React from "react";
import { YStack, XStack, Button } from "tamagui";
import { Plus } from "@tamagui/lucide-icons-2";
import { useTranslation } from "react-i18next";
import { Surface } from "../Surface";
import { CustomSelect } from "../CustomSelect";
import { ParameterInput } from "../FormInput";
import { FieldLabel, ButtonText } from "../ui";

interface BacktestParamsLayoutProps {
  selectedSymbols: string[];
  setSelectedSymbols: (symbols: string[]) => void;
  setIsAssetPickerOpen: (open: boolean) => void;
  backtestInterval: string;
  setBacktestInterval: (interval: string) => void;
  initialCapital: string;
  setInitialCapital: (capital: string) => void;
  commission: string;
  setCommission: (commission: string) => void;
  stopLoss: string;
  setStopLoss: (stopLoss: string) => void;
  takeProfit: string;
  setTakeProfit: (takeProfit: string) => void;
}

export function BacktestParamsLayout({
  selectedSymbols,
  setSelectedSymbols,
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
}: BacktestParamsLayoutProps) {
  const { t } = useTranslation();

  return (
    <Surface p="$4" gap="$3">
      {/* Assets Picker */}
      <YStack gap="$1.5">
        <FieldLabel>{t("backtest.assetsToBacktest")}</FieldLabel>
        <XStack
          flexWrap="wrap"
          gap="$2"
          p="$2"
          bg="$surfaceDeep"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$borderColor"
        >
          {selectedSymbols.map((sym) => (
            <Button
              key={sym}
              size="$2"
              bg="$brandSecondarySoft"
              rounded="$6"
              onPress={() => setSelectedSymbols(selectedSymbols.filter((s) => s !== sym))}
            >
              <ButtonText color="$brandSecondaryForeground">{sym} x</ButtonText>
            </Button>
          ))}
          <Button
            size="$2"
            bg="$surfaceCard"
            borderRadius="$6"
            borderWidth={1}
            borderColor="$borderColor"
            icon={Plus}
            onPress={() => setIsAssetPickerOpen(true)}
          >
            <ButtonText>{t("common.add")}</ButtonText>
          </Button>
        </XStack>
      </YStack>

      {/* Timeframe & Capital */}
      <XStack gap="$3" flexWrap="nowrap" width="100%" overflow="hidden">
        <YStack gap="$1.5" flex={1} minWidth={0}>
          <FieldLabel>{t("backtest.interval")}</FieldLabel>
          <CustomSelect
            value={backtestInterval}
            onValueChange={setBacktestInterval}
            items={[
              { value: "1m", label: t("timeframes.1m") },
              { value: "5m", label: t("timeframes.5m") },
              { value: "15m", label: t("timeframes.15m") },
              { value: "1h", label: t("timeframes.1h") },
              { value: "1d", label: t("timeframes.1d") },
            ]}
            width="100%"
          />
        </YStack>
        <YStack gap="$1.5" flex={1} minWidth={0}>
          <FieldLabel>{t("backtest.initialCapital")}</FieldLabel>
          <ParameterInput
            width="100%"
            value={initialCapital}
            onChangeText={setInitialCapital}
            keyboardType="numeric"
            height={40}
          />
        </YStack>
      </XStack>

      {/* Commission & Stops */}
      <XStack gap="$3" flexWrap="nowrap" width="100%" overflow="hidden">
        <YStack gap="$1.5" flex={1} minWidth={0}>
          <FieldLabel>{t("backtest.commission")}</FieldLabel>
          <ParameterInput width="100%" value={commission} onChangeText={setCommission} keyboardType="numeric" height={40} />
        </YStack>
        <YStack gap="$1.5" flex={1} minWidth={0}>
          <FieldLabel>{t("backtest.stopLoss")}</FieldLabel>
          <ParameterInput width="100%" value={stopLoss} onChangeText={setStopLoss} keyboardType="numeric" height={40} />
        </YStack>
        <YStack gap="$1.5" flex={1} minWidth={0}>
          <FieldLabel>{t("backtest.takeProfit")}</FieldLabel>
          <ParameterInput width="100%" value={takeProfit} onChangeText={setTakeProfit} keyboardType="numeric" height={40} />
        </YStack>
      </XStack>
    </Surface>
  );
}
