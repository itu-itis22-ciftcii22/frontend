import React, { useEffect, useState } from 'react'
import { XStack, YStack, Button, Text } from 'tamagui'
import { Hash, Plus, Sigma, Trash2 } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { CustomSelect } from './CustomSelect'
import { ExpressionEditorSheet } from './ExpressionEditorSheet'
import { ExpressionField } from './ExpressionField'
import { ParameterInput, NumericInput } from './FormInput'
import { Expr, ScoreNode, clone, defaultExpression, defaultMetric, defaultScore } from '../lib/conditions'

interface ScoringMetricsEditorProps {
  title?: string
  value: ScoreNode
  onChange: (value: ScoreNode) => void
  availableColumns: string[]
  threshold?: string
  onThresholdChange?: (threshold: string) => void
}

type EditingMetricExpression = {
  index: number
  value: Expr
} | null

function asScoreGroup(value: ScoreNode | undefined, availableColumns: string[]): Extract<ScoreNode, { type: 'score_group' }> {
  if (value?.type === 'score_group') return value
  return {
    type: 'score_group',
    combine: 'weighted_average',
    children: [{ weight: 1, node: value || defaultMetric(availableColumns) }],
  }
}

export function ScoringMetricsEditor({
  title,
  value,
  onChange,
  availableColumns,
  threshold,
  onThresholdChange,
}: ScoringMetricsEditorProps) {
  const { t } = useTranslation()
  const [data, setData] = useState(asScoreGroup(value, availableColumns))
  const [editingExpression, setEditingExpression] = useState<EditingMetricExpression>(null)
  const combineItems = [
    { value: 'weighted_average', label: t('strategies.weightedAverage') },
    { value: 'min', label: t('strategies.minimum') },
    { value: 'max', label: t('strategies.maximum') },
  ]
  const methodItems = [
    { value: 'threshold_distance', label: t('strategies.thresholdDistance') },
    { value: 'percentile_rank', label: t('strategies.percentileRank') },
  ]
  const directionItems = [
    { value: 'higher', label: t('strategies.higherStronger') },
    { value: 'lower', label: t('strategies.lowerStronger') },
  ]

  useEffect(() => {
    setData(asScoreGroup(value, availableColumns))
  }, [value])

  const notify = (next: typeof data) => {
    const cloned = clone(next)
    setData(cloned)
    onChange(cloned)
  }

  const updateChild = (index: number, updater: (child: typeof data.children[number]) => void) => {
    const next = clone(data)
    updater(next.children[index])
    notify(next)
  }

  const addMetric = () => {
    notify({
      ...data,
      children: [...data.children, { weight: 1, node: defaultMetric(availableColumns) }],
    })
  }

  const addConstant = () => {
    notify({
      ...data,
      children: [...data.children, { weight: 1, node: defaultScore() }],
    })
  }

  const removeChild = (index: number) => {
    setEditingExpression(null)
    notify({ ...data, children: data.children.filter((_, idx) => idx !== index) })
  }

  const applyExpression = (expr: Expr) => {
    if (!editingExpression) return
    updateChild(editingExpression.index, (target) => {
      if (target.node.type === 'metric') target.node.expr = expr
    })
    setEditingExpression(null)
  }

  return (
    <YStack gap="$2">
      <XStack gap="$2" alignItems="center" flexWrap="nowrap" width="100%" overflow="hidden">
        {onThresholdChange && (
          <ParameterInput
            flex={0.55}
            minWidth={0}
            value={threshold || ''}
            onChangeText={onThresholdChange}
            keyboardType="numeric"
            size="$2.5"
            placeholder={t('strategies.threshold')}
            height={38}
          />
        )}
        {!!title && (
          <Text fontWeight="700" color="$textPrimary" fontSize="$4">
            {title}
          </Text>
        )}
        <CustomSelect
          value={data.combine}
          onValueChange={(combine) => notify({ ...data, combine: combine as any })}
          items={combineItems}
          flex={0.8}
          minWidth={0}
          size="$2.5"
        />
        <Button
          size="$2.5"
          circular
          chromeless
          icon={Sigma}
          aria-label={t('strategies.addMetric')}
          onPress={addMetric}
          hoverStyle={{ bg: '$surfaceHover' }}
        />
        <Button
          size="$2.5"
          circular
          chromeless
          icon={Hash}
          aria-label={t('strategies.addConstant')}
          onPress={addConstant}
          hoverStyle={{ bg: '$surfaceHover' }}
        />
      </XStack>

      <YStack gap="$2">
        {data.children.length === 0 ? (
          <Text color="$textMuted" fontSize="$2">{t('strategies.noScoringMetricsConfigured')}</Text>
        ) : (
          data.children.map((child, index) => (
            <YStack
              key={index}
              gap="$2"
              p="$3"
              bg="$surfaceSubtle"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$3"
            >
              {child.node.type === 'constant' && (
                <XStack gap="$2" alignItems="flex-end" flexWrap="nowrap" width="100%" overflow="hidden">
                  <NumericInput
                    flex={0.75}
                    minWidth={0}
                    value={child.weight}
                    onChange={(val) => updateChild(index, (target) => { target.weight = val })}
                    size="$2.5"
                    placeholder={t('common.weight')}
                  />
                  <NumericInput
                    flex={1}
                    minWidth={0}
                    value={child.node.type === 'constant' ? child.node.value : undefined}
                    onChange={(val) => updateChild(index, (target) => {
                      if (target.node.type === 'constant') target.node.value = val as any
                    })}
                    size="$2.5"
                    placeholder={t('strategies.score')}
                  />
                  <Button size="$2" circular chromeless icon={Trash2} onPress={() => removeChild(index)} hoverStyle={{ bg: '$red4' }} mb="$0.5" />
                </XStack>
              )}

              {child.node.type === 'metric' && (
                <YStack gap="$2">
                  <XStack gap="$2" alignItems="flex-end" flexWrap="nowrap" width="100%" overflow="hidden">
                    <NumericInput
                      flex={0.55}
                      minWidth={0}
                      value={child.weight}
                      onChange={(val) => updateChild(index, (target) => { target.weight = val })}
                      size="$2.5"
                      placeholder={t('common.weight')}
                    />
                    <ExpressionField
                      value={child.node.expr}
                      flex={2.4}
                      onPress={() => setEditingExpression({ index, value: child.node.type === 'metric' ? child.node.expr : defaultExpression(availableColumns) })}
                    />
                    <Button size="$2" circular chromeless icon={Trash2} onPress={() => removeChild(index)} hoverStyle={{ bg: '$red4' }} mb="$0.5" />
                  </XStack>
                  <XStack gap="$2" flexWrap="nowrap" alignItems="flex-end" width="100%" overflow="hidden">
                    <CustomSelect
                      value={child.node.method}
                      onValueChange={(method) => updateChild(index, (target) => {
                        if (target.node.type === 'metric') target.node.method = method as any
                      })}
                      items={methodItems}
                      flex={1.2}
                      minWidth={0}
                      size="$2.5"
                    />
                    <CustomSelect
                      value={child.node.direction}
                      onValueChange={(direction) => updateChild(index, (target) => {
                        if (target.node.type === 'metric') target.node.direction = direction as any
                      })}
                      items={directionItems}
                      flex={1}
                      minWidth={0}
                      size="$2.5"
                    />
                    {child.node.method === 'threshold_distance' && (
                      <>
                        <NumericInput
                          flex={0.75}
                          minWidth={0}
                          value={child.node.type === 'metric' ? child.node.threshold : undefined}
                          onChange={(val) => updateChild(index, (target) => {
                            if (target.node.type === 'metric') target.node.threshold = val
                          })}
                          size="$2.5"
                          placeholder={t('strategies.threshold')}
                        />
                        <NumericInput
                          flex={0.75}
                          minWidth={0}
                          value={child.node.type === 'metric' ? child.node.target : undefined}
                          onChange={(val) => updateChild(index, (target) => {
                            if (target.node.type === 'metric') target.node.target = val
                          })}
                          size="$2.5"
                          placeholder={t('strategies.target')}
                        />
                      </>
                    )}
                    {child.node.method === 'percentile_rank' && (
                      <NumericInput
                        flex={0.75}
                        minWidth={0}
                        value={child.node.type === 'metric' ? child.node.window : undefined}
                        onChange={(val) => updateChild(index, (target) => {
                          if (target.node.type === 'metric') target.node.window = val
                        })}
                        size="$2.5"
                        placeholder={t('strategies.window')}
                      />
                    )}
                  </XStack>
                </YStack>
              )}
            </YStack>
          ))
        )}
      </YStack>

      {editingExpression && (
        <ExpressionEditorSheet
          open={!!editingExpression}
          onOpenChange={(open) => {
            if (!open) setEditingExpression(null)
          }}
          value={editingExpression.value}
          availableColumns={availableColumns}
          title={t('strategies.editScoreExpression')}
          onApply={applyExpression}
        />
      )}
    </YStack>
  )
}
