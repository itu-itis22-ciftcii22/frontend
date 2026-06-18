import React, { useEffect, useState } from 'react'
import { XStack, YStack, Button, Text } from 'tamagui'
import { Braces, Plus, Trash2 } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { CustomSelect } from './CustomSelect'
import { ExpressionEditorSheet } from './ExpressionEditorSheet'
import { ExpressionField } from './ExpressionField'
import { Expr, RuleNode, clone, defaultCondition, defaultRule, formatComparator } from '../lib/conditions'

interface RuleBuilderProps {
  title?: string
  value: RuleNode
  onChange: (value: RuleNode) => void
  availableColumns: string[]
  disabled?: boolean
}

const comparatorItems = [
  { value: 'gt', label: formatComparator('gt') },
  { value: 'lt', label: formatComparator('lt') },
  { value: 'gte', label: formatComparator('gte') },
  { value: 'lte', label: formatComparator('lte') },
  { value: 'eq', label: formatComparator('eq') },
  { value: 'neq', label: formatComparator('neq') },
  { value: 'crosses_above', label: formatComparator('crosses_above') },
  { value: 'crosses_below', label: formatComparator('crosses_below') },
]

type EditingExpression = {
  path: number[]
  side: 'left' | 'right'
  value: Expr
  title: string
} | null

export function RuleBuilder({
  title,
  value,
  onChange,
  availableColumns,
  disabled = false,
}: RuleBuilderProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<RuleNode>(value || defaultRule())
  const [editingExpression, setEditingExpression] = useState<EditingExpression>(null)
  const groupItems = [
    { value: 'all', label: t('strategies.groupAll') },
    { value: 'any', label: t('strategies.groupAny') },
    { value: 'not', label: t('strategies.groupNot') },
  ]

  useEffect(() => {
    setData(value || defaultRule())
  }, [value])

  const notify = (next: RuleNode) => {
    const cloned = clone(next)
    setData(cloned)
    onChange(cloned)
  }

  const getNode = (root: any, path: number[]) => {
    let current = root
    for (const index of path) {
      current = current.children[index]
    }
    return current
  }

  const updateNode = (path: number[], updater: (node: any) => void) => {
    if (disabled) return
    const next = clone(data)
    updater(getNode(next, path))
    notify(next)
  }

  const addCondition = (path: number[]) => {
    updateNode(path, (node) => {
      if (node.type !== 'group') return
      if (node.op === 'not' && node.children.length >= 1) return
      node.children.push(defaultCondition(availableColumns))
    })
  }

  const addGroup = (path: number[]) => {
    updateNode(path, (node) => {
      if (node.type !== 'group') return
      if (node.op === 'not' && node.children.length >= 1) return
      node.children.push(defaultRule())
    })
  }

  const removeNode = (path: number[]) => {
    if (disabled) return
    setEditingExpression(null)
    if (path.length === 0) {
      notify(defaultRule())
      return
    }
    const next = clone(data)
    const parent = getNode(next, path.slice(0, -1))
    parent.children.splice(path[path.length - 1], 1)
    notify(next)
  }

  const openExpressionEditor = (path: number[], side: 'left' | 'right', value: Expr) => {
    if (disabled) return
    setEditingExpression({
      path,
      side,
      value,
      title: side === 'left' ? t('strategies.editLeftExpression') : t('strategies.editRightExpression'),
    })
  }

  const applyExpression = (expr: Expr) => {
    if (!editingExpression) return
    updateNode(editingExpression.path, (target) => {
      target[editingExpression.side] = expr
    })
    setEditingExpression(null)
  }

  const renderNode = (node: RuleNode, path: number[] = []) => {
    if (node.type === 'condition') {
      return (
        <YStack
          key={path.join('-')}
          gap="$2"
          width="100%"
          p="$2"
          bg="$surfaceSubtle"
          rounded="$3"
        >
          <XStack gap="$2" alignItems="flex-end" flexWrap="nowrap" width="100%" overflow="hidden">
            <ExpressionField
              value={node.left}
              flex={1}
              onPress={() => openExpressionEditor(path, 'left', node.left)}
              disabled={disabled}
            />
            <CustomSelect
              value={node.comparator}
              onValueChange={(comparator) => updateNode(path, (target) => { target.comparator = comparator })}
              items={comparatorItems}
              flex={0.75}
              minWidth={0}
              size="$2.5"
              triggerProps={{ disabled }}
            />
          </XStack>
          <XStack gap="$2" alignItems="flex-end" flexWrap="nowrap" width="100%" overflow="hidden">
            <ExpressionField
              value={node.right}
              flex={1}
              onPress={() => openExpressionEditor(path, 'right', node.right)}
              disabled={disabled}
            />
            <Button
              size="$2"
              circular
              chromeless
              icon={Trash2}
              onPress={() => removeNode(path)}
              disabled={disabled}
              hoverStyle={{ bg: '$red4' }}
            />
          </XStack>
        </YStack>
      )
    }

    const childLimitReached = node.op === 'not' && node.children.length >= 1

    return (
      <YStack
        key={path.join('-') || 'root'}
        p={path.length > 0 ? '$2' : '$3'}
        borderWidth={1}
        borderColor="$borderColor"
        rounded="$3"
        gap="$2"
      >
        <XStack alignItems="center" gap="$2" flexWrap="nowrap" width="100%" overflow="hidden">
          <CustomSelect
            value={node.op}
            onValueChange={(op) => updateNode(path, (target) => {
              target.op = op
              if (op === 'not') target.children = target.children.slice(0, 1)
            })}
            items={groupItems}
            flex={0.55}
            minWidth={0}
            size="$2.5"
            triggerProps={{ disabled }}
          />
          <Button
            size="$2.5"
            circular
            chromeless
            icon={Plus}
            aria-label={t('strategies.addCondition')}
            onPress={() => addCondition(path)}
            disabled={disabled || childLimitReached}
            hoverStyle={{ bg: '$surfaceHover' }}
          />
          <Button
            size="$2.5"
            circular
            chromeless
            icon={Braces}
            aria-label={t('strategies.addGroup')}
            onPress={() => addGroup(path)}
            disabled={disabled || childLimitReached}
            hoverStyle={{ bg: '$surfaceHover' }}
          />
          {path.length > 0 && (
            <Button
              size="$2"
              circular
              chromeless
              icon={Trash2}
              onPress={() => removeNode(path)}
              disabled={disabled}
              hoverStyle={{ bg: '$red4' }}
            />
          )}
        </XStack>
        <YStack pl={path.length > 0 ? '$1' : '$2'} borderLeftWidth={1} borderColor="$borderColor" gap="$2">
          {node.children.length === 0 ? (
            <Text color="$textMuted" fontSize="$2">{t('strategies.noRulesConfigured')}</Text>
          ) : (
            node.children.map((child, index) => renderNode(child, [...path, index]))
          )}
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack gap="$2">
      {!!title && (
        <Text fontWeight="700" color="$textPrimary" fontSize="$4">
          {title}
        </Text>
      )}
      {renderNode(data)}
      {editingExpression && (
        <ExpressionEditorSheet
          open={!!editingExpression}
          onOpenChange={(open) => {
            if (!open) setEditingExpression(null)
          }}
          value={editingExpression.value}
          availableColumns={availableColumns}
          title={editingExpression.title}
          onApply={applyExpression}
        />
      )}
    </YStack>
  )
}
