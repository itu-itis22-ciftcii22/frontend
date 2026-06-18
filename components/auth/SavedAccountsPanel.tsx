import React from 'react'
import { Accordion, Button, Text, YStack } from 'tamagui'
import { ChevronDown, Trash2 } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { SavedAccount } from '../../lib/auth'
import {
  AccordionCard,
  AccordionContentFrame,
  AccordionTriggerRow,
  InteractiveRow,
  SelectableRowText,
} from '../ui'

interface SavedAccountsPanelProps {
  accounts: SavedAccount[]
  onSwitchAccount: (email: string) => Promise<void>
  onRemoveAccount: (email: string) => Promise<void>
}

export function SavedAccountsPanel({
  accounts,
  onSwitchAccount,
  onRemoveAccount,
}: SavedAccountsPanelProps) {
  const { t } = useTranslation()

  if (accounts.length === 0) return null

  return (
    <Accordion type="single" collapsible defaultValue="saved-profiles" width="100%" mb="$4">
      <AccordionCard value="saved-profiles">
        <AccordionTriggerRow>
          {({ open }) => (
            <>
              <Text color="$color12" fontSize="$3" fontWeight="600">
                {t('auth.loginWithSavedProfile')}
              </Text>
              <ChevronDown
                size={16}
                color="$color8"
                style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
              />
            </>
          )}
        </AccordionTriggerRow>
        <Accordion.HeightAnimator>
          <AccordionContentFrame>
            <YStack gap="$2" p="$2.5">
              {accounts.map((account) => (
                <InteractiveRow
                  key={account.email}
                >
                  <SelectableRowText
                    fontWeight="bold"
                    fontSize="$3"
                    onPress={() => onSwitchAccount(account.email)}
                    style={{ cursor: 'pointer' }}
                    flex={1}
                  >
                    {account.email}
                  </SelectableRowText>
                  <Button
                    size="$2"
                    chromeless
                    circular
                    icon={<Trash2 size={13} color="$red10" />}
                    onPress={async (event) => {
                      event.stopPropagation()
                      await onRemoveAccount(account.email)
                    }}
                  />
                </InteractiveRow>
              ))}
            </YStack>
          </AccordionContentFrame>
        </Accordion.HeightAnimator>
      </AccordionCard>
    </Accordion>
  )
}
