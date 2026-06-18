import React from "react";
import { YStack, Separator } from "tamagui";
import { Surface } from "../Surface";
import { IndicatorListEditor } from "../IndicatorListEditor";
import { StrategyConditionsEditor } from "../StrategyConditionsEditor";
import { RuleNode, ScoreNode } from "../../lib/conditions";

interface StrategyBuilderLayoutProps {
  indicators: any[];
  setIndicators: (indicators: any[]) => void;
  entryRule: RuleNode;
  setEntryRule: (rule: RuleNode) => void;
  exitRule: RuleNode;
  setExitRule: (rule: RuleNode) => void;
  entryScore: ScoreNode;
  setEntryScore: (score: ScoreNode) => void;
  exitScore: ScoreNode;
  setExitScore: (score: ScoreNode) => void;
  availableColumns: string[];
  entryThreshold: string;
  onEntryThresholdChange: (val: string) => void;
  exitThreshold: string;
  onExitThresholdChange: (val: string) => void;
  categories: any;
  isIndicatorPickerOpen: boolean;
  setIsIndicatorPickerOpen: (open: boolean) => void;
}

export function StrategyBuilderLayout({
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
  onEntryThresholdChange,
  exitThreshold,
  onExitThresholdChange,
  categories,
  isIndicatorPickerOpen,
  setIsIndicatorPickerOpen,
}: StrategyBuilderLayoutProps) {
  return (
    <YStack gap="$4">
      <Surface p="$4" gap="$3">
        <IndicatorListEditor
          indicators={indicators}
          onAdd={(ind) => setIndicators([...indicators, ind])}
          onRemove={(idx) => {
            const updated = [...indicators];
            updated.splice(idx, 1);
            setIndicators(updated);
          }}
          categories={categories}
          isSelectOpen={isIndicatorPickerOpen}
          onSelectOpenChange={setIsIndicatorPickerOpen}
          hideAddButton
          compact
        />

        <Separator borderColor="$borderColor" />

        <StrategyConditionsEditor
          entryRule={entryRule}
          onEntryRuleChange={setEntryRule}
          exitRule={exitRule}
          onExitRuleChange={setExitRule}
          entryScore={entryScore}
          onEntryScoreChange={setEntryScore}
          exitScore={exitScore}
          onExitScoreChange={setExitScore}
          availableColumns={availableColumns}
          entryThreshold={entryThreshold}
          onEntryThresholdChange={onEntryThresholdChange}
          exitThreshold={exitThreshold}
          onExitThresholdChange={onExitThresholdChange}
        />
      </Surface>
    </YStack>
  );
}
