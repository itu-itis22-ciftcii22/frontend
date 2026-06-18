import React from 'react';
import { XStack, Text, Theme } from 'tamagui';
import { useTranslation } from 'react-i18next';

interface SignalBadgeProps {
  signal: 'ENTRY' | 'EXIT';
}

export function SignalBadge({ signal }: SignalBadgeProps) {
  const { t } = useTranslation();
  const isEntry = signal === 'ENTRY';
  return (
    <Theme name={isEntry ? 'green' : 'red'}>
      <XStack
        bg="$surfaceSubtle"
        borderWidth={1}
        borderColor="$borderSubtle"
        px="$2.5"
        py="$1"
        borderRadius="$6"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="$2" fontWeight="700" color="$color10" letterSpacing={0.5}>
          {isEntry ? t('common.entrySignal') : t('common.exitSignal')}
        </Text>
      </XStack>
    </Theme>
  );
}
