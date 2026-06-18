import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAuth from './locales/en/auth.json'
import enBacktest from './locales/en/backtest.json'
import enChart from './locales/en/chart.json'
import enCommon from './locales/en/common.json'
import enIndicator from './locales/en/indicator.json'
import enNotFound from './locales/en/notFound.json'
import enProfile from './locales/en/profile.json'
import enStrategies from './locales/en/strategies.json'
import enTimeframes from './locales/en/timeframes.json'
import enWatchlist from './locales/en/watchlist.json'
import trAuth from './locales/tr/auth.json'
import trBacktest from './locales/tr/backtest.json'
import trChart from './locales/tr/chart.json'
import trCommon from './locales/tr/common.json'
import trIndicator from './locales/tr/indicator.json'
import trNotFound from './locales/tr/notFound.json'
import trProfile from './locales/tr/profile.json'
import trStrategies from './locales/tr/strategies.json'
import trTimeframes from './locales/tr/timeframes.json'
import trWatchlist from './locales/tr/watchlist.json'

const en = {
  common: enCommon,
  auth: enAuth,
  watchlist: enWatchlist,
  chart: enChart,
  backtest: enBacktest,
  strategies: enStrategies,
  timeframes: enTimeframes,
  profile: enProfile,
  indicator: enIndicator,
  notFound: enNotFound,
}

const tr = {
  common: trCommon,
  auth: trAuth,
  watchlist: trWatchlist,
  chart: trChart,
  backtest: trBacktest,
  strategies: trStrategies,
  timeframes: trTimeframes,
  profile: trProfile,
  indicator: trIndicator,
  notFound: trNotFound,
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
