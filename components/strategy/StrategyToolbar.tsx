import React from 'react'
import { Button } from 'tamagui'
import { Download, FolderOpen, Plus, Save } from '@tamagui/lucide-icons-2'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '../Button'
import { WorkspaceToolbar } from '../workspace/WorkspaceToolbar'

interface StrategyToolbarProps {
  strategyName: string
  loading: boolean
  onSelectStrategy: () => void
  onImportChartLayout: () => void
  onSaveStrategy: () => void
  onAddIndicator: () => void
}

export function StrategyToolbar({
  strategyName,
  loading,
  onSelectStrategy,
  onImportChartLayout,
  onSaveStrategy,
  onAddIndicator,
}: StrategyToolbarProps) {
  const { t } = useTranslation()

  return (
    <WorkspaceToolbar
      leftElement={null}
      actions={
        <>
          <Button
            size="$3.5"
            chromeless
            circular
            icon={FolderOpen}
            hoverStyle={{ bg: '$surfaceHover' }}
            onPress={onSelectStrategy}
            aria-label={t('strategies.title')}
          />
          <Button
            size="$3.5"
            chromeless
            circular
            icon={Download}
            hoverStyle={{ bg: '$surfaceHover' }}
            onPress={onImportChartLayout}
            aria-label={t('chart.loadLayoutTitle')}
          />
          <Button
            size="$3.5"
            chromeless
            circular
            icon={Save}
            disabled={loading}
            hoverStyle={{ bg: '$surfaceHover' }}
            onPress={onSaveStrategy}
            aria-label={t('common.save')}
          />
          <PrimaryButton
            size="$3.5"
            icon={Plus}
            circular
            onPress={onAddIndicator}
            aria-label={t('chart.indicatorsTitle')}
          />
        </>
      }
    />
  )
}

