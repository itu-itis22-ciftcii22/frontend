import React from 'react'
import { YStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { CustomSelect } from './CustomSelect'
import { ParameterInput, NumericInput } from './FormInput'
import { FieldLabel } from './ui'
import { Expr, defaultExpression, toNonNegativeInteger } from '../lib/conditions'

interface ExpressionBuilderProps {
  value: Expr
  onChange: (value: Expr) => void
  availableColumns: string[]
  disabled?: boolean
}

const binaryItems = [
  { value: 'add', label: '+' },
  { value: 'sub', label: '-' },
  { value: 'mul', label: '*' },
  { value: 'div', label: '/' },
  { value: 'pow', label: '^' },
]

function OperandFrame({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <YStack gap="$2" p="$3" bg="$surfaceSubtle" borderWidth={1} borderColor="$borderSubtle" rounded="$3">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </YStack>
  )
}

export function ExpressionBuilder({
  value,
  onChange,
  availableColumns,
  disabled = false,
}: ExpressionBuilderProps) {
  const { t } = useTranslation()
  const safeValue = value || defaultExpression(availableColumns)
  const exprTypeItems = [
    { value: 'column', label: t('strategies.expressionTypeColumn') },
    { value: 'const', label: t('strategies.expressionTypeNumber') },
    { value: 'binary', label: t('strategies.expressionTypeMath') },
    { value: 'unary', label: t('strategies.expressionTypeUnary') },
  ]
  const unaryItems = [
    { value: 'neg', label: t('strategies.unaryNegate') },
    { value: 'abs', label: t('strategies.unaryAbs') },
  ]

  const changeType = (type: string) => {
    if (type === 'column') onChange(defaultExpression(availableColumns))
    if (type === 'const') onChange({ type: 'const', value: 0 })
    if (type === 'binary') {
      onChange({
        type: 'binary',
        op: 'add',
        left: defaultExpression(availableColumns),
        right: { type: 'const', value: 0 },
      })
    }
    if (type === 'unary') {
      onChange({ type: 'unary', op: 'abs', expr: defaultExpression(availableColumns) })
    }
  }

  return (
    <YStack gap="$3" width="100%">
      <YStack gap="$1.5">
        <FieldLabel>{t('strategies.expressionType')}</FieldLabel>
        <CustomSelect
          value={safeValue.type}
          onValueChange={changeType}
          items={exprTypeItems}
          width="100%"
          size="$3"
          triggerProps={{ disabled }}
        />
      </YStack>

      {safeValue.type === 'column' && (
        <>
          <YStack gap="$1.5">
            <FieldLabel>{t('common.column')}</FieldLabel>
            <CustomSelect
              value={safeValue.column}
              onValueChange={(column) => onChange({ ...safeValue, column })}
              items={availableColumns.map((column) => ({ value: column, label: column }))}
              width="100%"
              size="$3"
              triggerProps={{ disabled }}
            />
          </YStack>
          <YStack gap="$1.5">
            <FieldLabel>{t('common.lag')}</FieldLabel>
            <ParameterInput
              value={String(toNonNegativeInteger(safeValue.lag ?? 0))}
              onChangeText={(text) => onChange({ ...safeValue, lag: toNonNegativeInteger(text) })}
              keyboardType="numeric"
              size="$3"
              disabled={disabled}
            />
          </YStack>
        </>
      )}

      {safeValue.type === 'const' && (
        <YStack gap="$1.5">
          <FieldLabel>{t('common.value')}</FieldLabel>
          <NumericInput
            value={safeValue.value}
            onChange={(val) => onChange({ ...safeValue, value: val })}
            size="$3"
            disabled={disabled}
            placeholder="0"
          />
        </YStack>
      )}

      {safeValue.type === 'binary' && (
        <>
          <YStack gap="$1.5">
            <FieldLabel>{t('strategies.operation')}</FieldLabel>
            <CustomSelect
              value={safeValue.op}
              onValueChange={(op) => onChange({ ...safeValue, op: op as any })}
              items={binaryItems}
              width="100%"
              size="$3"
              triggerProps={{ disabled }}
            />
          </YStack>
          <OperandFrame label={t('strategies.leftOperand')}>
            <ExpressionBuilder
              value={safeValue.left}
              onChange={(left) => onChange({ ...safeValue, left })}
              availableColumns={availableColumns}
              disabled={disabled}
            />
          </OperandFrame>
          <OperandFrame label={t('strategies.rightOperand')}>
            <ExpressionBuilder
              value={safeValue.right}
              onChange={(right) => onChange({ ...safeValue, right })}
              availableColumns={availableColumns}
              disabled={disabled}
            />
          </OperandFrame>
        </>
      )}

      {safeValue.type === 'unary' && (
        <>
          <YStack gap="$1.5">
            <FieldLabel>{t('strategies.operation')}</FieldLabel>
            <CustomSelect
              value={safeValue.op}
              onValueChange={(op) => onChange({ ...safeValue, op: op as any })}
              items={unaryItems}
              width="100%"
              size="$3"
              triggerProps={{ disabled }}
            />
          </YStack>
          <OperandFrame label={t('strategies.operand')}>
            <ExpressionBuilder
              value={safeValue.expr}
              onChange={(expr) => onChange({ ...safeValue, expr })}
              availableColumns={availableColumns}
              disabled={disabled}
            />
          </OperandFrame>
        </>
      )}
    </YStack>
  )
}
