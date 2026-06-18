import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

interface AlertState {
  isOpen: boolean;
  title: string;
  description: string;
  severity: AlertSeverity;
  isConfirm: boolean;
  onConfirm: () => void;
  confirmText: string;
  cancelText: string;
}

/**
 * Encapsulates all alert dialog state into a single hook.
 *
 * Usage:
 *   const { showAlert, alertProps } = useAlert();
 *   showAlert('Title', 'Description', 'error');
 *   // ...
 *   <CustomAlert {...alertProps} />
 */
export function useAlert() {
  const { t } = useTranslation();

  const [state, setState] = useState<AlertState>({
    isOpen: false,
    title: '',
    description: '',
    severity: 'info',
    isConfirm: false,
    onConfirm: () => {},
    confirmText: t('common.ok'),
    cancelText: t('common.cancel'),
  });

  const showAlert = useCallback(
    (
      title: string,
      description: string,
      severity: AlertSeverity = 'info',
      isConfirm = false,
      onConfirm: () => void = () => {},
      confirmText = t('common.ok'),
      cancelText = t('common.cancel'),
    ) => {
      setState({
        isOpen: true,
        title,
        description,
        severity,
        isConfirm,
        onConfirm,
        confirmText,
        cancelText,
      });
    },
    [t],
  );

  const setOpen = useCallback(
    (open: boolean) => setState((prev) => ({ ...prev, isOpen: open })),
    [],
  );

  const alertProps = {
    isOpen: state.isOpen,
    onOpenChange: setOpen,
    title: state.title,
    description: state.description,
    severity: state.severity,
    isConfirm: state.isConfirm,
    onConfirm: state.onConfirm,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
  };

  return { showAlert, alertProps } as const;
}
