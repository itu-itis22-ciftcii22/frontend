import React, { useEffect, useState } from 'react'
import { Button, ScrollView, Sheet, XStack, YStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from './Button'
import { ExpressionBuilder } from './ExpressionBuilder'
import { Expr, clone, defaultExpression, formatExpression, normalizeExpression } from '../lib/conditions'
import { MutedText, PrimaryButtonText, SectionTitle } from './ui'

interface ExpressionEditorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: Expr
  availableColumns: string[]
  title: string
  onApply: (value: Expr) => void
}

export function ExpressionEditorSheet({
  open,
  onOpenChange,
  value,
  availableColumns,
  title,
  onApply,
}: ExpressionEditorSheetProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Expr>(value || defaultExpression(availableColumns))
  const availableColumnKey = availableColumns.join('|')

  useEffect(() => {
    if (open) setDraft(normalizeExpression(value || defaultExpression(availableColumns), availableColumns))
  }, [open, value, availableColumnKey])

  const handleApply = () => {
    onApply(clone(normalizeExpression(draft, availableColumns)))
    onOpenChange(false)
  }

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[85, 55]}
      snapPointsMode="percent"
      dismissOnSnapToBottom
      zIndex={180000}
      transition="lazy"
      disableDrag={true}
    >
      <Sheet.Overlay transition="lazy" bg="$shadow6" />
      <Sheet.Handle />
      <Sheet.Frame
        transition="lazy"
        p="$4"
        gap="$4"
        bg="$surfaceDeep"
        borderTopLeftRadius="$4"
        borderTopRightRadius="$4"
      >
        <YStack gap="$1.5">
          <SectionTitle>{title}</SectionTitle>
          <MutedText numberOfLines={2}>{formatExpression(draft)}</MutedText>
        </YStack>

        <ScrollView flex={1} keyboardShouldPersistTaps="always" keyboardDismissMode="none" nestedScrollEnabled showsVerticalScrollIndicator>
          <YStack gap="$4" pb="$8">
            <ExpressionBuilder
              value={draft}
              onChange={setDraft}
              availableColumns={availableColumns}
            />
          </YStack>
        </ScrollView>

        <XStack gap="$3" width="100%" mt="auto">
          <PrimaryButton flex={1} onPress={handleApply}>
            <PrimaryButtonText>{t('common.apply', { defaultValue: 'Apply' })}</PrimaryButtonText>
          </PrimaryButton>
          <Button flex={1} chromeless borderColor="$borderColor" borderWidth={1} onPress={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </XStack>
      </Sheet.Frame>
    </Sheet>
  )
}
