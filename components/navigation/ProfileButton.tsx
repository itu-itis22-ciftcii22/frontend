import { Button } from 'tamagui'
import { User } from '@tamagui/lucide-icons-2'

interface ProfileButtonProps {
  onPress: () => void
}

export function ProfileButton({ onPress }: ProfileButtonProps) {
  return (
    <Button
      size="$3"
      circular
      bg="$brandPrimary"
      hoverStyle={{ bg: '$brandPrimaryHover' }}
      pressStyle={{ scale: 0.95 }}
      onPress={onPress}
      icon={<User size={18} color="$accentForeground" />}
    />
  )
}
