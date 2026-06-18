import React from 'react'
import { YStack } from 'tamagui'
import { RuleBuilder } from './RuleBuilder'
import { ScoringMetricsEditor } from './ScoringMetricsEditor'
import { RuleNode, ScoreNode } from '../lib/conditions'

interface StrategyConditionsEditorProps {
  entryRule: RuleNode
  onEntryRuleChange: (rule: RuleNode) => void
  exitRule: RuleNode
  onExitRuleChange: (rule: RuleNode) => void
  entryScore: ScoreNode
  onEntryScoreChange: (score: ScoreNode) => void
  exitScore: ScoreNode
  onExitScoreChange: (score: ScoreNode) => void
  availableColumns: string[]
  entryThreshold: string
  onEntryThresholdChange: (threshold: string) => void
  exitThreshold: string
  onExitThresholdChange: (threshold: string) => void
}

export function StrategyConditionsEditor({
  entryRule,
  onEntryRuleChange,
  exitRule,
  onExitRuleChange,
  entryScore,
  onEntryScoreChange,
  exitScore,
  onExitScoreChange,
  availableColumns,
  entryThreshold,
  onEntryThresholdChange,
  exitThreshold,
  onExitThresholdChange,
}: StrategyConditionsEditorProps) {
  return (
    <YStack gap="$4">
      <RuleBuilder
        value={entryRule}
        onChange={onEntryRuleChange}
        availableColumns={availableColumns}
      />

      <ScoringMetricsEditor
        value={entryScore}
        onChange={onEntryScoreChange}
        availableColumns={availableColumns}
        threshold={entryThreshold}
        onThresholdChange={onEntryThresholdChange}
      />

      <RuleBuilder
        value={exitRule}
        onChange={onExitRuleChange}
        availableColumns={availableColumns}
      />

      <ScoringMetricsEditor
        value={exitScore}
        onChange={onExitScoreChange}
        availableColumns={availableColumns}
        threshold={exitThreshold}
        onThresholdChange={onExitThresholdChange}
      />
    </YStack>
  )
}
