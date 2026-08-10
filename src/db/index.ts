import { Capacitor } from '@capacitor/core';
import * as webApi from './web.js';
import type { DbApi } from '../types/index.js';

// native.js imports @capacitor-community/sqlite directly. A static import here would
// ship it to the web bundle even though this branch only runs on native platforms, so
// load it lazily instead.
const impl: DbApi = Capacitor.isNativePlatform()
  ? await import('./native.js')
  : webApi;

export const {
  fetchCanWrite,
  fetchMeta,
  fetchAliyot,
  fetchReadings,
  fetchLocationStats,
  fetchHebcal,
  postReading,
  putReading,
  deleteReading,
  fetchOccasions,
  fetchOccasionAliyot,
  fetchSpecialReadings,
  postSpecialReading,
  deleteSpecialReading,
  fetchWeekdayAliyot,
  postWeekdayReading,
  putWeekdayReading,
  deleteWeekdayReading,
} = impl;
