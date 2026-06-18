import React, { useState, useEffect } from "react";
import { Keyboard, Platform } from "react-native";
import {
  Sheet,
  Button,
  Input,
  XStack,
  YStack,
  H4,
  Text,
  Label,
  ScrollView,
  Switch,
  Separator,
  Card,
  View,
} from "tamagui";
import { CustomSelect } from "./CustomSelect";
import { NumericInput } from "./FormInput";
import { useTranslation } from "react-i18next";
import { COLOR_PALETTE } from "../lib/chartHelpers";

export interface IndicatorParamInfo {
  name: string;
  type: "number" | "string" | "boolean";
  default: any;
  options?: string[];
}

export interface IndicatorInfo {
  category: string;
  description?: string;
  default_pane: string;
  params: IndicatorParamInfo[];
}

interface PaneOption {
  value: string;
  label: string;
}

interface IndicatorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  indicatorName: string | null;
  indicatorInfo: IndicatorInfo;
  initialParams?: Record<string, any>;
  initialPane?: string | null;
  initialColors?: Record<string, string>;
  initialTimeframe?: string;
  showTimeframe?: boolean;
  showPaneSelector?: boolean;
  paneOptions?: PaneOption[];
  sheetZIndex?: number;
  onApply: (
    params: Record<string, any>,
    pane: string,
    colors: Record<string, string> | null,
    timeframe?: string,
  ) => void;
}

export function IndicatorModal({
  isOpen,
  onOpenChange,
  indicatorName,
  indicatorInfo,
  initialParams,
  initialPane,
  initialColors,
  initialTimeframe,
  showTimeframe = false,
  showPaneSelector = true,
  paneOptions,
  sheetZIndex = 220000,
  onApply,
}: IndicatorModalProps) {
  const { t } = useTranslation();
  const [params, setParams] = useState<Record<string, any>>({});
  const [pane, setPane] = useState("separate");
  const [colors, setColors] = useState<Record<string, string>>({});
  const [timeframe, setTimeframe] = useState("1m");
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (isOpen && indicatorInfo) {
      setPane(
        initialPane || (indicatorInfo.default_pane === "main" ? "main" : "new"),
      );
      setColors(initialColors ? { ...initialColors } : {});
      setTimeframe(initialTimeframe || "1m");

      if (initialParams) {
        setParams({ ...initialParams });
      } else {
        const defaultParams: Record<string, any> = {};
        if (indicatorInfo.params) {
          indicatorInfo.params.forEach((p) => {
            defaultParams[p.name] = p.default !== null ? p.default : "";
          });
        }
        setParams(defaultParams);
      }
    }
  }, [
    isOpen,
    indicatorInfo,
    initialParams,
    initialPane,
    initialColors,
    initialTimeframe,
  ]);

  if (!indicatorInfo || !indicatorName) return null;

  const handleApply = () => {
    Keyboard.dismiss();
    if (Platform.OS !== 'web') {
      setTimeout(() => {
        onApply(
          params,
          pane,
          Object.keys(colors).length > 0 ? colors : null,
          showTimeframe ? timeframe : undefined,
        );
        onOpenChange(false);
      }, 250);
    } else {
      onApply(
        params,
        pane,
        Object.keys(colors).length > 0 ? colors : null,
        showTimeframe ? timeframe : undefined,
      );
      onOpenChange(false);
    }
  };

  const paramFields = indicatorInfo.params || [];
  const isEditing = !!initialParams;

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={(val) => {
        if (!val) {
          Keyboard.dismiss();
        }
        if (!val && Platform.OS !== 'web') {
          setTimeout(() => {
            onOpenChange(false);
          }, 250);
        } else {
          onOpenChange(val);
        }
      }}
      snapPoints={[80, 50]}
      snapPointsMode="percent"
      dismissOnSnapToBottom
      position={position}
      onPositionChange={setPosition}
      zIndex={sheetZIndex}
      transition="medium"
      disableDrag={true}
    >
      <Sheet.Overlay
        transition="lazy"
        bg="$shadow6"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Handle />
      <Sheet.Frame
        transition="lazy"
        p="$4"
        gap="$4"
        bg="$surfaceDeep"
        zIndex={sheetZIndex}
      >
        <H4 textTransform="uppercase" letterSpacing={1}>
          {isEditing ? t("indicator.editTitle", { name: indicatorName }) : t("indicator.addTitle", { name: indicatorName })}
        </H4>
        <ScrollView
          flex={1}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          nestedScrollEnabled
          showsVerticalScrollIndicator
          automaticallyAdjustKeyboardInsets={Platform.OS !== 'web'}
        >
          <YStack gap="$4">
            {/* Display Pane Selector - chart-only; hidden for strategy/backtest configuration */}
            {!showTimeframe && showPaneSelector ? (
              <Card
                borderWidth={1}
                borderColor="$borderColor"
                p="$4"
                bg="$surfaceCard"
                rounded="$3"
              >
                <YStack gap="$2">
                  <Label fontSize="$2" color="$color11">
                    {t("indicator.displayPane")}
                  </Label>
                  <CustomSelect
                    value={pane}
                    onValueChange={setPane}
                    items={
                      paneOptions && paneOptions.length > 0
                        ? paneOptions
                        : [
                            {
                              value: "main",
                              label: t("indicator.overlayLabel"),
                            },
                            { value: "new", label: t("chart.newPaneLabel") },
                          ]
                    }
                  />
                </YStack>
              </Card>
            ) : showTimeframe ? (
              <Card
                borderWidth={1}
                borderColor="$borderColor"
                p="$4"
                bg="$surfaceCard"
                rounded="$3"
              >
                <YStack gap="$2">
                  <Label fontSize="$2" color="$color11">
                    {t("indicator.timeframe")}
                  </Label>
                  <CustomSelect
                    value={timeframe}
                    onValueChange={setTimeframe}
                    items={[
                      { value: "1m", label: t("timeframes.1m") },
                      { value: "5m", label: t("timeframes.5m") },
                      { value: "15m", label: t("timeframes.15m") },
                      { value: "1h", label: t("timeframes.1h") },
                      { value: "1d", label: t("timeframes.1d") },
                    ]}
                  />
                </YStack>
              </Card>
            ) : null}

            {/* Parameter Fields */}
            {paramFields.length === 0 && (
              <Text color="$color8" textAlign="center" py="$4">
                {t("indicator.noParams")}
              </Text>
            )}

            {paramFields.length > 0 && (
              <Card
                borderWidth={1}
                borderColor="$borderColor"
                p="$4"
                bg="$surfaceCard"
                rounded="$3"
              >
                <YStack gap="$4">
                  <Label fontSize="$2" color="$color11">
                    {t("indicator.parametersTitle")}
                  </Label>
                  {paramFields.map((p, idx) => (
                    <YStack key={p.name} gap="$2">
                      {idx > 0 && <Separator />}
                      <Label fontSize="$2" color="$color11">
                        {p.name}{" "}
                        {p.default !== null && `(${t("common.default", { defaultValue: "Default" })}: ${p.default})`}
                      </Label>
                      {p.type === "boolean" ? (
                        <Switch
                          size="$3"
                          checked={
                            params[p.name] === true || params[p.name] === "true"
                          }
                          onCheckedChange={(val) =>
                            setParams({ ...params, [p.name]: val })
                          }
                        >
                          <Switch.Thumb transition="bouncy" />
                        </Switch>
                      ) : p.options && Array.isArray(p.options) ? (
                        <CustomSelect
                          value={String(params[p.name] ?? "")}
                          onValueChange={(val) =>
                            setParams({ ...params, [p.name]: val })
                          }
                          items={p.options.map((opt: string) => ({
                            value: opt,
                            label: opt,
                          }))}
                        />
                      ) : p.type === "number" ? (
                        <NumericInput
                          value={params[p.name] !== "" && params[p.name] !== undefined ? Number(params[p.name]) : undefined}
                          onChange={(val) => {
                            setParams({ ...params, [p.name]: val !== undefined ? val : "" });
                          }}
                          placeholder={String(p.default ?? "")}
                        />
                      ) : (
                        <Input
                          value={String(params[p.name] ?? "")}
                          rounded="$3"
                          onChangeText={(val) => {
                            setParams({ ...params, [p.name]: val });
                          }}
                        />
                      )}
                    </YStack>
                  ))}
                </YStack>
              </Card>
            )}

            {/* Style / Colors (Visible when editing or if colors exist, hidden in showTimeframe mode) */}
            {!showTimeframe && Object.keys(colors).length > 0 && (
              <Card
                borderWidth={1}
                borderColor="$borderColor"
                p="$4"
                bg="$surfaceCard"
                rounded="$3"
              >
                <YStack gap="$4">
                  <Label fontSize="$2" color="$color11">
                    {t("indicator.styleTitle")}
                  </Label>
                  {Object.keys(colors).map((lineName) => {
                    const currentColor = colors[lineName] || "#ffffff";
                    return (
                      <YStack key={lineName} gap="$2" pb="$2">
                        <XStack alignItems="center" justifyContent="space-between" gap="$3">
                          <XStack alignItems="center" gap="$2" flex={1}>
                            <View
                              width={20}
                              height={20}
                              rounded={10}
                              style={{ backgroundColor: currentColor }}
                              borderWidth={1}
                              borderColor="$borderColor"
                            />
                            <Label fontSize="$2" fontWeight="600" numberOfLines={1}>
                              {lineName}
                            </Label>
                          </XStack>
                          <Input
                            size="$2.5"
                            width={90}
                            value={currentColor}
                            onChangeText={(val) =>
                              setColors({ ...colors, [lineName]: val })
                            }
                            rounded="$3"
                            textAlign="center"
                            fontSize="$2"
                          />
                        </XStack>
                        <XStack gap="$2" flexWrap="wrap" mt="$1">
                          {COLOR_PALETTE.map((color) => {
                            const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                            return (
                              <Button
                                key={color}
                                width={24}
                                height={24}
                                rounded={12}
                                p={0}
                                minHeight={24}
                                minWidth={24}
                                style={{ backgroundColor: color }}
                                borderWidth={isSelected ? 2 : 1}
                                borderColor={isSelected ? "$color12" : "$borderColor"}
                                pressStyle={{ scale: 0.9 }}
                                onPress={() => setColors({ ...colors, [lineName]: color })}
                              />
                            );
                          })}
                        </XStack>
                      </YStack>
                    );
                  })}
                </YStack>
              </Card>
            )}
          </YStack>
        </ScrollView>
        <XStack gap="$3" justifyContent="flex-end" pt="$2">
          <Button
            onPress={() => {
              Keyboard.dismiss();
              if (Platform.OS !== 'web') {
                setTimeout(() => {
                  onOpenChange(false);
                }, 250);
              } else {
                onOpenChange(false);
              }
            }}
            chromeless
            rounded="$3"
            hoverStyle={{ bg: "$surfaceHover" }}
            pressStyle={{ scale: 0.97 }}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onPress={handleApply}
            bg="$brandPrimary"
            color="$brandPrimaryForeground"
            hoverStyle={{ bg: '$brandPrimaryHover' }}
            pressStyle={{ scale: 0.97 }}
            rounded="$3"
          >
            {isEditing ? t("indicator.updateBtn") : t("indicator.addBtn")}
          </Button>
        </XStack>
      </Sheet.Frame>
    </Sheet>
  );
}
