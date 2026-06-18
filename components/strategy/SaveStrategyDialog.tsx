import React, { useState, useEffect } from 'react'
import { Button, Dialog, Label, XStack, YStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../Button'
import { FormInput, FormInputContainer } from '../FormInput'
import { PrimaryButtonText } from '../ui'

interface SaveStrategyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  strategyName: string
  onSave: (name: string) => void
}

export function SaveStrategyDialog({
  open,
  onOpenChange,
  strategyName,
  onSave,
}: SaveStrategyDialogProps) {
  const { t } = useTranslation()
  const [localName, setLocalName] = useState(strategyName)

  useEffect(() => {
    if (open) {
      setLocalName(strategyName)
    }
  }, [open, strategyName])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay transition="quick" bg="$shadow6" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content transition="quick" bg="$surfaceCard" borderWidth={1} borderColor="$borderColor" borderRadius="$4" p="$4" gap="$4">
          <Dialog.Title color="$color12" fontFamily="$heading">
            {t('common.save')}
          </Dialog.Title>
          <YStack gap="$2">
            <Label color="$color11">{t('strategies.strategyName')}</Label>
            <FormInputContainer bg="$surfaceDeep">
              <FormInput value={localName} onChangeText={setLocalName} />
            </FormInputContainer>
          </YStack>
          <XStack gap="$3" justifyContent="flex-end">
            <Button onPress={() => onOpenChange(false)} chromeless rounded="$3">
              {t('common.cancel')}
            </Button>
            <PrimaryButton onPress={() => onSave(localName)} rounded="$3">
              <PrimaryButtonText>{t('common.save')}</PrimaryButtonText>
            </PrimaryButton>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
