import React from 'react'
import { Platform } from 'react-native'
import { Button, Dialog, Text, XStack, YStack } from 'tamagui'
import { Download, ExternalLink, X } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { PrimaryButtonText } from '../ui'
import { PrimaryButton } from '../Button'

interface QuantStatsReportViewerProps {
  open: boolean
  reportUrl: string | null
  onOpenChange: (open: boolean) => void
  onDownload: () => void
}

export function QuantStatsReportViewer({
  open,
  reportUrl,
  onOpenChange,
  onDownload,
}: QuantStatsReportViewerProps) {
  const { t } = useTranslation()
  const canEmbed = Platform.OS === 'web' && !!reportUrl

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
          p="$3"
          gap="$3"
          width="94vw"
          maxWidth={1180}
          height="88vh"
        >
          <XStack alignItems="center" justifyContent="flex-end" gap="$3">
            <Dialog.Title style={{ display: 'none' }}>
              {t('backtest.quantStatsReport')}
            </Dialog.Title>
            <XStack gap="$1.5">
              {reportUrl && Platform.OS === 'web' && (
                <Button
                  size="$3"
                  circular
                  chromeless
                  icon={ExternalLink}
                  onPress={() => window.open(reportUrl, '_blank', 'noopener,noreferrer')}
                  aria-label={t('common.open', { defaultValue: 'Open' })}
                />
              )}
              <Button
                size="$3"
                circular
                chromeless
                icon={Download}
                onPress={onDownload}
                aria-label={t('common.download', { defaultValue: 'Download' })}
              />
              <Button
                size="$3"
                circular
                chromeless
                icon={X}
                onPress={() => onOpenChange(false)}
                aria-label={t('common.close', { defaultValue: 'Close' })}
              />
            </XStack>
          </XStack>

          {canEmbed ? (
            <YStack flex={1} borderWidth={1} borderColor="$borderSubtle" borderRadius="$3" overflow="hidden" bg="white">
              {React.createElement('iframe', {
                src: reportUrl,
                title: t('backtest.quantStatsReport'),
                style: {
                  border: 0,
                  width: '100%',
                  height: '100%',
                  background: 'white',
                },
              })}
            </YStack>
          ) : (
            <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" p="$4">
              <Text color="$color8" textAlign="center">
                {t('backtest.reportViewerUnavailable')}
              </Text>
              <PrimaryButton icon={Download} onPress={onDownload}>
                <PrimaryButtonText>
                  {t('backtest.reportHtml')}
                </PrimaryButtonText>
              </PrimaryButton>
            </YStack>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
