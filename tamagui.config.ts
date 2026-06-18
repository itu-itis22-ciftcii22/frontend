import { defaultConfig } from '@tamagui/config/v5'
import { animations } from '@tamagui/config/v5-rn'
import { createTamagui } from 'tamagui'
import { themes } from './theme/themes'

export const config = createTamagui({
  ...defaultConfig,
  themes,
  animations,
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
})

export default config

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
