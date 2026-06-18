import React, { useState, useEffect } from 'react';
import { YStack, XStack, Button, Dialog, Label } from 'tamagui';
import { FormInput, FormInputContainer } from '../FormInput';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../Button';
import { PrimaryButtonText } from '../ui';

interface SaveLayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layoutName: string;
  onSave: (name: string) => void;
}

export function SaveLayoutDialog({
  open,
  onOpenChange,
  layoutName,
  onSave,
}: SaveLayoutDialogProps) {
  const { t } = useTranslation();
  const [localName, setLocalName] = useState(layoutName);

  useEffect(() => {
    if (open) {
      setLocalName(layoutName);
    }
  }, [open, layoutName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          transition="quick"
          bg="$shadow6"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          transition="quick"
          bg="$surfaceCard"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          p="$4"
          gap="$4"
        >
          <Dialog.Title
            color="$color12"
            fontFamily="$heading"
          >
            {t('chart.saveLayoutTitle')}
          </Dialog.Title>

          <YStack gap="$2">
            <Label color="$color11">{t('chart.layoutNameLabel')}</Label>
            <FormInputContainer bg="$surfaceDeep">
              <FormInput
                value={localName}
                onChangeText={setLocalName}
              />
            </FormInputContainer>
          </YStack>
          <XStack gap="$3" justifyContent="flex-end">
            <Button
              onPress={() => onOpenChange(false)}
              chromeless
              rounded="$3"
            >
              {t('common.cancel')}
            </Button>
            <PrimaryButton onPress={() => onSave(localName)} rounded="$3">
              <PrimaryButtonText>
                {t('chart.saveLayoutBtn')}
              </PrimaryButtonText>
            </PrimaryButton>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
