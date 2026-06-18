import React from 'react';
import { Dialog, XStack, Button, Text, Theme } from 'tamagui';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from '@tamagui/lucide-icons-2';
import { useTranslation } from 'react-i18next';
import { DestructiveButtonText, PrimaryButtonText } from './ui';

interface CustomAlertProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  severity?: 'info' | 'warning' | 'error' | 'success';
  isConfirm?: boolean;
}

export function CustomAlert({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  severity = 'info',
  isConfirm = false
}: CustomAlertProps) {
  const { t } = useTranslation();
  const resolvedConfirmText = confirmText ?? t('common.ok');
  const resolvedCancelText = cancelText ?? t('common.cancel');
  const getIcon = () => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 size={24} color="$green9" />;
      case 'error':
        return <AlertCircle size={24} color="$red9" />;
      case 'warning':
        return <AlertTriangle size={24} color="$yellow9" />;
      case 'info':
      default:
        return <Info size={24} color="$brandSecondary" />;
    }
  };

  const getThemeName = () => {
    switch (severity) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'info':
      default:
        return 'blue';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          transition="quick"
          bg="$shadow6"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          key="content"
          transition="quick"
          bg="$surfaceCard"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$4"
          p="$4"
          gap="$4"
          width="90%"
          maxWidth={400}
          alignSelf="center"
          elevation="$4"
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.95 }}
          exitStyle={{ x: 0, y: -20, opacity: 0, scale: 0.95 }}
        >
          <XStack gap="$3" alignItems="center">
            {getIcon()}
            <Dialog.Title color="$color12" fontSize="$5" fontWeight="bold" fontFamily="$heading">
              {title}
            </Dialog.Title>
          </XStack>

          <Dialog.Description color="$color11" fontSize="$3" lineHeight={20}>
            {description}
          </Dialog.Description>

          <XStack gap="$3" justifyContent="flex-end" pt="$2">
            {isConfirm && (
              <Button
                size="$3.5"
                chromeless
                rounded="$3"
                onPress={() => onOpenChange(false)}
                hoverStyle={{ bg: '$surfaceHover' }}
                pressStyle={{ scale: 0.97 }}
              >
                <Text color="$color8">{resolvedCancelText}</Text>
              </Button>
            )}
            <Theme name={getThemeName()}>
              <Button
                size="$3.5"
                bg={severity === 'error' ? '$red9' : severity === 'success' ? '$green9' : '$brandPrimary'}
                hoverStyle={{ opacity: 0.9 }}
                pressStyle={{ scale: 0.97 }}
                rounded="$3"
                onPress={handleConfirm}
              >
                {severity === 'error' ? (
                  <DestructiveButtonText>{resolvedConfirmText}</DestructiveButtonText>
                ) : (
                  <PrimaryButtonText>{resolvedConfirmText}</PrimaryButtonText>
                )}
              </Button>
            </Theme>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
