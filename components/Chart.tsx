import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { View, Platform } from "react-native";
import { WebView } from "react-native-webview";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  BaselineSeries,
  createSeriesMarkers,
} from "lightweight-charts";
import { useTheme, Text } from "tamagui";
import { useTranslation } from "react-i18next";

export interface ChartRef {
  fitContent: () => void;
  scrollToRealTime: () => void;
  setTimeRange: (bars: number) => void;
  addIndicatorSeries: (
    id: string,
    seriesData: any[],
    paneIndex: number,
  ) => ISeriesApi<any>[];
  replaceIndicatorSeries: (
    indicators: { id: string; seriesData: any[]; paneIndex: number }[],
  ) => Record<string, ISeriesApi<any>[]>;
  updateIndicatorData: (id: string, seriesData: any[]) => void;
  removeSeries: (seriesRefs: ISeriesApi<any>[]) => void;
  resetChart: () => void;
  takeScreenshot: () => void;
  getIndicatorValue: (id: string) => number | null;
  setMarkers: (markers: any[]) => void;
  updateLastPoint: (id: string, dataPoint: any) => void;
}

interface ChartProps {
  symbol: string;
  ohlcv: any;
  onCrosshairMove?: (price: number | null, isUp: boolean | null) => void;
  interval?: string;
}

const SERIES_MAP: any = {
  Line: LineSeries,
  Area: AreaSeries,
  Histogram: HistogramSeries,
  Baseline: BaselineSeries,
  Candlestick: CandlestickSeries,
  Bar: BarSeries,
};

type ChartTimeValue = number | string;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

const parseTimeValue = (time: any): ChartTimeValue | null => {
  if (time === null || time === undefined || time === "") return null;

  if (typeof time === "number") {
    return Number.isFinite(time) ? time : null;
  }

  if (typeof time === "string") {
    const raw = time.trim();
    if (!raw) return null;

    const normalized = raw.includes(" ") ? raw.replace(" ", "T") : raw;
    const parsed = Date.parse(normalized);
    if (Number.isFinite(parsed)) {
      return Math.floor(parsed / 1000);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }
  }

  return null;
};

const sanitizeCandles = (candles: any[] = []): any[] =>
  candles.flatMap((candle) => {
    const time = parseTimeValue(candle?.time);
    const open = toFiniteNumber(candle?.open);
    const high = toFiniteNumber(candle?.high);
    const low = toFiniteNumber(candle?.low);
    const close = toFiniteNumber(candle?.close);

    if (
      time === null ||
      open === null ||
      high === null ||
      low === null ||
      close === null
    ) {
      return [];
    }

    return [{ time, open, high, low, close }];
  });

const sanitizeHistogram = (values: any[] = []): any[] =>
  values.flatMap((point) => {
    const time = parseTimeValue(point?.time);
    const value = toFiniteNumber(point?.value);

    if (time === null || value === null) {
      return [];
    }

    return [{ ...point, time, value }];
  });

const sanitizeSeriesData = (series: any) => {
  const data = Array.isArray(series?.data) ? series.data : [];
  if (series?.type === "Candlestick" || series?.type === "Bar") {
    return sanitizeCandles(data);
  }
  return data.flatMap((point: any) => {
    const time = parseTimeValue(point?.time);
    if (time === null) return [];

    const value = toFiniteNumber(point?.value);
    if (value !== null) {
      return [{ ...point, time, value }];
    }

    const open = toFiniteNumber(point?.open);
    const high = toFiniteNumber(point?.high);
    const low = toFiniteNumber(point?.low);
    const close = toFiniteNumber(point?.close);

    if (open === null || high === null || low === null || close === null) {
      return [];
    }

    return [{ time, open, high, low, close }];
  });
};

const sanitizeLivePoint = (point: any) => {
  const time = parseTimeValue(point?.time);
  if (time === null) return null;

  const value = toFiniteNumber(point?.value);
  if (value !== null) {
    return { ...point, time, value };
  }

  const open = toFiniteNumber(point?.open);
  const high = toFiniteNumber(point?.high);
  const low = toFiniteNumber(point?.low);
  const close = toFiniteNumber(point?.close);

  if (open === null || high === null || low === null || close === null) {
    return null;
  }

  return { time, open, high, low, close };
};

const MOBILE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: transparent;
    }
    #chart {
      width: 100%;
      height: 100%;
    }
  </style>
  <script src="https://unpkg.com/lightweight-charts@5.2.0/dist/lightweight-charts.standalone.production.js"></script>
</head>
<body>
  <div id="chart"></div>
  <script>
    var chart = null;
    var candleSeries = null;
    var volumeSeries = null;
    var indicatorSeriesMap = new Map();
    var theme = null;
    var lastLoadedKey = null;

    var SERIES_MAP = {
      'Line': LightweightCharts.LineSeries,
      'Area': LightweightCharts.AreaSeries,
      'Histogram': LightweightCharts.HistogramSeries,
      'Baseline': LightweightCharts.BaselineSeries,
      'Candlestick': LightweightCharts.CandlestickSeries,
      'Bar': LightweightCharts.BarSeries
    };

    window.initChart = function(symbol, interval, themeConfig, isIntraday) {
      if (chart) {
        try {
          chart.remove();
        } catch(e) {}
      }
      theme = themeConfig;
      indicatorSeriesMap.clear();
      volumeSeries = null;
      lastLoadedKey = null;

      chart = LightweightCharts.createChart(document.getElementById('chart'), {
        layout: {
          background: { type: LightweightCharts.ColorType.Solid, color: theme.backgroundColor },
          textColor: theme.textColor,
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: theme.borderColor },
          horzLines: { color: theme.borderColor },
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
          vertLine: {
            color: theme.blue9,
            width: 1,
            style: LightweightCharts.LineStyle.Dashed,
            labelBackgroundColor: theme.blue10,
          },
          horzLine: {
            color: theme.blue9,
            width: 1,
            style: LightweightCharts.LineStyle.Dashed,
            labelBackgroundColor: theme.blue10,
          },
        },
        rightPriceScale: {
          borderColor: theme.borderColor,
          scaleMargins: { top: 0.1, bottom: 0.2 },
        },
        timeScale: {
          borderColor: theme.borderColor,
          timeVisible: !!isIntraday,
          secondsVisible: false,
        },
        autoSize: true,
      });

      candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
        upColor: theme.green9,
        downColor: theme.red9,
        borderVisible: false,
        wickUpColor: theme.green9,
        wickDownColor: theme.red9,
        lastValueVisible: false,
      });

      chart.subscribeCrosshairMove(function(param) {
        if (!param.time) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'crosshair', price: null, isUp: null }));
          return;
        }

        var candleData = param.seriesData.get(candleSeries);
        var price = null;
        var isUp = null;
        if (candleData) {
          price = candleData.close !== undefined ? candleData.close : candleData.value;
          isUp = candleData.open !== undefined ? price >= candleData.open : null;
        }

        var indicatorValues = {};
        indicatorSeriesMap.forEach(function(seriesList, id) {
          var firstSeries = seriesList[0];
          if (firstSeries) {
            var sData = param.seriesData.get(firstSeries);
            if (sData) {
              var val = sData.value !== undefined ? sData.value : sData.close;
              if (val !== undefined) {
                indicatorValues[id] = val;
              }
            }
          }
        });

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'crosshair',
          price: price,
          isUp: isUp,
          indicatorValues: indicatorValues
        }));
      });
    };

    window.setOhlcvData = function(candles, volume, symbol, interval) {
      if (!chart || !candleSeries) return;
      candleSeries.setData(candles || []);

      if (volume && volume.length > 0) {
        if (!volumeSeries) {
          volumeSeries = chart.addSeries(LightweightCharts.HistogramSeries, {
            priceFormat: { type: 'volume' },
            lastValueVisible: false,
          }, 1);
        }
        volumeSeries.setData(volume);
      } else if (volumeSeries) {
        try {
          chart.removeSeries(volumeSeries);
        } catch(e) {}
        volumeSeries = null;
      }

      var currentKey = symbol + '_' + interval;
      if (lastLoadedKey !== currentKey) {
        chart.timeScale().fitContent();
        lastLoadedKey = currentKey;
      }
    };

    window.setMarkersData = function(markers) {
      if (!candleSeries) return;
      LightweightCharts.createSeriesMarkers(candleSeries, markers || []);
    };

    window.addIndicatorSeries = function(id, seriesList, paneIndex) {
      if (!chart) return;
      var seriesRefs = [];

      for (var i = 0; i < seriesList.length; i++) {
        var s = seriesList[i];
        var seriesDef = SERIES_MAP[s.type] || LightweightCharts.LineSeries;

        var seriesOptions = {
          lastValueVisible: false,
          priceLineVisible: false,
          title: "",
        };

        if (s.type === 'Line') {
          seriesOptions.color = s.color || theme.blue10;
          seriesOptions.lineWidth = 2;
        } else if (s.type === 'Histogram') {
          seriesOptions.color = s.color || theme.blue10;
        } else if (s.type === 'Area') {
          seriesOptions.lineColor = s.color || theme.blue10;
          seriesOptions.topColor = (s.color || theme.blue10) + '40';
          seriesOptions.bottomColor = (s.color || theme.blue10) + '05';
        } else if (s.type === 'Candlestick') {
          seriesOptions.upColor = theme.green9;
          seriesOptions.downColor = theme.red9;
          seriesOptions.borderVisible = false;
          seriesOptions.wickUpColor = theme.green9;
          seriesOptions.wickDownColor = theme.red9;
        }

        var series = chart.addSeries(
          seriesDef,
          seriesOptions,
          paneIndex === 0 ? undefined : paneIndex
        );
        series.setData(s.data || []);
        seriesRefs.push(series);
      }

      indicatorSeriesMap.set(id, seriesRefs);
    };

    window.updateIndicatorData = function(id, seriesList) {
      var seriesRefs = indicatorSeriesMap.get(id);
      if (seriesRefs && seriesRefs.length === seriesList.length) {
        for (var i = 0; i < seriesList.length; i++) {
          seriesRefs[i].setData(seriesList[i].data || []);
        }
      }
    };

    window.removeEmptyIndicatorPanes = function() {
      if (!chart) return;
      var panes = chart.panes();
      for (var index = panes.length - 1; index > 1; index--) {
        if (panes[index] && panes[index].getSeries().length === 0) {
          try {
            chart.removePane(index);
          } catch(e) {}
        }
      }
    };

    window.replaceIndicatorSeries = function(indicators) {
      if (!chart) return;
      indicatorSeriesMap.forEach(function(seriesRefs) {
        seriesRefs.forEach(function(s) {
          try {
            chart.removeSeries(s);
          } catch(e) {}
        });
      });
      indicatorSeriesMap.clear();
      window.removeEmptyIndicatorPanes();

      for (var i = 0; i < indicators.length; i++) {
        var indicator = indicators[i];
        window.addIndicatorSeries(indicator.id, indicator.seriesData, indicator.paneIndex);
      }
    };

    window.resetChart = function() {
      if (!chart) return;
      indicatorSeriesMap.forEach(function(seriesRefs) {
        seriesRefs.forEach(function(s) {
          try {
            chart.removeSeries(s);
          } catch(e) {}
        });
      });
      indicatorSeriesMap.clear();

      try {
        if (candleSeries) candleSeries.setData([]);
        if (volumeSeries) volumeSeries.setData([]);
      } catch(e) {}
    };

    window.setTimeRange = function(bars) {
      if (!chart || !candleSeries) return;
      var data = candleSeries.data();
      if (!data) return;
      var totalBars = data.length;
      if (totalBars === 0) return;

      if (bars >= totalBars) {
        chart.timeScale().fitContent();
      } else {
        chart.timeScale().setVisibleLogicalRange({
          from: totalBars - bars,
          to: totalBars - 1
        });
      }
    };

    window.takeScreenshot = function() {
      if (!chart) return;
      var canvas = chart.takeScreenshot();
      if (canvas) {
        var dataUrl = canvas.toDataURL('image/png');
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'screenshot', data: dataUrl }));
      }
    };

    window.updateLastPoint = function(id, dataPoint) {
      if (!chart) return;
      if (id === 'candles') {
        if (candleSeries) candleSeries.update(dataPoint);
        return;
      }
      if (id === 'volume') {
        if (volumeSeries) volumeSeries.update(dataPoint);
        return;
      }
      var seriesList = indicatorSeriesMap.get(id);
      if (seriesList) {
        if (Array.isArray(dataPoint)) {
          for (var i = 0; i < dataPoint.length; i++) {
            if (seriesList[i]) {
              seriesList[i].update(dataPoint[i]);
            }
          }
        } else {
          if (seriesList[0]) seriesList[0].update(dataPoint);
        }
      }
    };
  </script>
</body>
</html>
`;

export const Chart = forwardRef<ChartRef, ChartProps>(
  ({ symbol, ohlcv, onCrosshairMove, interval }, ref) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const indicatorValuesMap = useRef<Map<string, number>>(new Map());

    // ─────────────────────────────────────────────────────────────────
    // WEB IMPLEMENTATION
    // ─────────────────────────────────────────────────────────────────
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const mainCandleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const indicatorSeriesMap = useRef<Map<string, ISeriesApi<any>[]>>(
      new Map(),
    );
    const lastSymbolIntervalRef = useRef<{ symbol: string; interval?: string } | null>(null);

    const addSeriesToPane = (
      id: string,
      seriesList: any[],
      paneIndex: number,
    ) => {
      const seriesRefs: ISeriesApi<any>[] = [];
      if (!chartRef.current) return seriesRefs;

      for (let i = 0; i < seriesList.length; i++) {
        const s = seriesList[i];
        const seriesDef = SERIES_MAP[s.type] || LineSeries;

        const seriesOptions: any = {
          lastValueVisible: false,
          priceLineVisible: false,
          title: "",
        };

        if (s.type === "Line") {
          seriesOptions.color = s.color || theme.blue10.val;
          seriesOptions.lineWidth = 2;
        } else if (s.type === "Histogram") {
          seriesOptions.color = s.color || theme.blue10.val;
        } else if (s.type === "Area") {
          seriesOptions.lineColor = s.color || theme.blue10.val;
          seriesOptions.topColor = (s.color || theme.blue10.val) + "40";
          seriesOptions.bottomColor = (s.color || theme.blue10.val) + "05";
        } else if (s.type === "Candlestick") {
          seriesOptions.upColor = theme.green9.val;
          seriesOptions.downColor = theme.red9.val;
          seriesOptions.borderVisible = false;
          seriesOptions.wickUpColor = theme.green9.val;
          seriesOptions.wickDownColor = theme.red9.val;
        }

        const series = chartRef.current.addSeries(
          seriesDef,
          seriesOptions,
          paneIndex === 0 ? undefined : paneIndex,
        );
        series.setData(sanitizeSeriesData(s));
        seriesRefs.push(series);
      }

      indicatorSeriesMap.current.set(id, seriesRefs);
      return seriesRefs;
    };

    const removeEmptyIndicatorPanes = () => {
      const chart = chartRef.current;
      if (!chart) return;

      const panes = chart.panes();
      for (let index = panes.length - 1; index > 1; index--) {
        if (panes[index]?.getSeries().length === 0) {
          chart.removePane(index);
        }
      }
    };

    useEffect(() => {
      if (Platform.OS !== "web") return;
      if (!chartContainerRef.current) return;

      const isIntraday = interval && interval !== "1d" && interval !== "1w";

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: "solid" as any, color: theme.background.val },
          textColor: theme.color11.val,
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: theme.borderColor.val },
          horzLines: { color: theme.borderColor.val },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: theme.blue9.val,
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: theme.blue10.val,
          },
          horzLine: {
            color: theme.blue9.val,
            width: 1,
            style: LineStyle.Dashed,
            labelBackgroundColor: theme.blue10.val,
          },
        },
        rightPriceScale: {
          borderColor: theme.borderColor.val,
          scaleMargins: { top: 0.1, bottom: 0.2 },
        },
        timeScale: {
          borderColor: theme.borderColor.val,
          timeVisible: !!isIntraday,
          secondsVisible: false,
        },
        autoSize: true,
      });
      chartRef.current = chart;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: theme.green9.val,
        downColor: theme.red9.val,
        borderVisible: false,
        wickUpColor: theme.green9.val,
        wickDownColor: theme.red9.val,
        lastValueVisible: false,
      });
      mainCandleSeriesRef.current = candleSeries;

      const hasVolume = Array.isArray(ohlcv?.volume) && ohlcv.volume.length > 0;
      let volSeries: ISeriesApi<"Histogram"> | null = null;
      if (hasVolume) {
        volSeries = chart.addSeries(
          HistogramSeries,
          {
            priceFormat: { type: "volume" },
            lastValueVisible: false,
          },
          1,
        );
      }
      volumeSeriesRef.current = volSeries;

      chart.subscribeCrosshairMove((param) => {
        if (!param.time) {
          onCrosshairMove?.(null, null);
          indicatorValuesMap.current.clear();
          return;
        }

        const candleData: any = param.seriesData.get(candleSeries);
        if (candleData) {
          const price =
            candleData.close !== undefined
              ? candleData.close
              : candleData.value;
          const isUp =
            candleData.open !== undefined ? price >= candleData.open : null;
          onCrosshairMove?.(price, isUp);
        }

        indicatorSeriesMap.current.forEach((seriesList, id) => {
          const firstSeries = seriesList[0];
          if (firstSeries) {
            const sData: any = param.seriesData.get(firstSeries);
            if (sData) {
              const val = sData.value !== undefined ? sData.value : sData.close;
              if (val !== undefined) indicatorValuesMap.current.set(id, val);
            }
          }
        });
      });

      return () => {
        chart.remove();
      };
    }, [theme]);

    useEffect(() => {
      if (Platform.OS !== "web") return;
      if (chartRef.current) {
        const isIntraday = interval && interval !== "1d" && interval !== "1w";
        chartRef.current.applyOptions({
          timeScale: {
            timeVisible: !!isIntraday,
          },
        });
      }
    }, [interval]);

    useEffect(() => {
      if (Platform.OS !== "web") return;
      if (ohlcv && mainCandleSeriesRef.current) {
        const candles = sanitizeCandles(ohlcv.candles);
        mainCandleSeriesRef.current.setData(candles);

        if (volumeSeriesRef.current) {
          const volume = sanitizeHistogram(ohlcv.volume);
          volumeSeriesRef.current.setData(volume);
        }

        const isNewSymbolOrInterval =
          !lastSymbolIntervalRef.current ||
          lastSymbolIntervalRef.current.symbol !== symbol ||
          lastSymbolIntervalRef.current.interval !== interval;

        if (isNewSymbolOrInterval) {
          chartRef.current?.timeScale().fitContent();
          lastSymbolIntervalRef.current = { symbol, interval };
        }

        if (candles.length > 0) {
          const last = candles[candles.length - 1];
          const price = last.close;
          const isUp = last.open !== undefined ? price >= last.open : null;
          onCrosshairMove?.(price, isUp);
        }
      }
    }, [ohlcv, symbol, interval]);

    // ─────────────────────────────────────────────────────────────────
    // MOBILE WEBVIEW IMPLEMENTATION
    // ─────────────────────────────────────────────────────────────────
    const webViewRef = useRef<any>(null);
    const [isWebViewReady, setIsWebViewReady] = useState(false);

    const initWebViewChart = () => {
      if (!webViewRef.current) return;
      const themeConfig = {
        backgroundColor: theme.background.val,
        textColor: theme.color11.val,
        borderColor: theme.borderColor.val,
        blue9: theme.blue9.val,
        blue10: theme.blue10.val,
        green9: theme.green9.val,
        red9: theme.red9.val,
      };
      const isIntraday = interval && interval !== "1d" && interval !== "1w";
      const candles = sanitizeCandles(ohlcv?.candles);
      const volume = sanitizeHistogram(ohlcv?.volume);

      const script = `
        if (window.initChart) {
          window.initChart(${JSON.stringify(symbol)}, ${JSON.stringify(interval)}, ${JSON.stringify(themeConfig)}, ${!!isIntraday});
          window.setOhlcvData(${JSON.stringify(candles)}, ${JSON.stringify(volume)}, ${JSON.stringify(symbol)}, ${JSON.stringify(interval)});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
      setIsWebViewReady(true);
    };

    useEffect(() => {
      if (Platform.OS === "web") return;
      if (!isWebViewReady || !webViewRef.current) return;

      const candles = sanitizeCandles(ohlcv?.candles);
      const volume = sanitizeHistogram(ohlcv?.volume);

      const script = `
        if (window.setOhlcvData) {
          window.setOhlcvData(${JSON.stringify(candles)}, ${JSON.stringify(volume)}, ${JSON.stringify(symbol)}, ${JSON.stringify(interval)});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }, [ohlcv, symbol, interval, isWebViewReady]);

    const handleMessage = (event: any) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message.type === "crosshair") {
          const { price, isUp, indicatorValues } = message;
          onCrosshairMove?.(price, isUp);
          if (indicatorValues) {
            Object.entries(indicatorValues).forEach(([id, val]) => {
              indicatorValuesMap.current.set(id, val as number);
            });
          } else {
            indicatorValuesMap.current.clear();
          }
        } else if (message.type === "screenshot") {
          console.log("[WebView Chart] Screenshot taken, base64 size:", message.data?.length);
        }
      } catch (e) {
        console.error("[Chart WebView Message Error]:", e);
      }
    };

    // ─────────────────────────────────────────────────────────────────
    // REF FORWARDING (BRIDGED BETWEEN WEB & WEBVIEW)
    // ─────────────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => {
      if (Platform.OS === "web") {
        return {
          fitContent: () => {
            chartRef.current?.timeScale().fitContent();
          },
          scrollToRealTime: () => {
            chartRef.current?.timeScale().scrollToRealTime();
          },
          setTimeRange: (bars: number) => {
            const data = mainCandleSeriesRef.current?.data();
            if (!data) return;
            const totalBars = data.length;
            if (totalBars === 0) return;

            if (bars >= totalBars) {
              chartRef.current?.timeScale().fitContent();
            } else {
              chartRef.current?.timeScale().setVisibleLogicalRange({
                from: totalBars - bars,
                to: totalBars - 1,
              });
            }
          },
          addIndicatorSeries: (id: string, seriesList: any[], paneIndex: number) =>
            addSeriesToPane(id, seriesList, paneIndex),
          updateIndicatorData: (id: string, seriesList: any[]) => {
            const seriesRefs = indicatorSeriesMap.current.get(id);
            if (seriesRefs && seriesRefs.length === seriesList.length) {
              seriesList.forEach((s, idx) => {
                const cleanData = sanitizeSeriesData(s);
                seriesRefs[idx]?.setData(cleanData);
              });
            }
          },
          replaceIndicatorSeries: (indicators) => {
            indicatorSeriesMap.current.forEach((seriesRefs) => {
              seriesRefs.forEach((s) => {
                try {
                  chartRef.current?.removeSeries(s);
                } catch (e) {
                  // Ignore
                }
              });
            });
            indicatorSeriesMap.current.clear();
            indicatorValuesMap.current.clear();
            removeEmptyIndicatorPanes();

            const refsById: Record<string, ISeriesApi<any>[]> = {};
            indicators.forEach((indicator) => {
              refsById[indicator.id] = addSeriesToPane(
                indicator.id,
                indicator.seriesData,
                indicator.paneIndex,
              );
            });
            return refsById;
          },
          removeSeries: (seriesRefs: ISeriesApi<any>[]) => {
            for (const s of seriesRefs) {
              try {
                chartRef.current?.removeSeries(s);
              } catch (e) {
                // Ignore
              }
            }
            removeEmptyIndicatorPanes();
          },
          resetChart: () => {
            if (!chartRef.current) return;
            indicatorSeriesMap.current.forEach((seriesRefs) => {
              seriesRefs.forEach((s) => {
                try {
                  chartRef.current?.removeSeries(s);
                } catch (e) {
                  // Ignore
                }
              });
            });
            indicatorSeriesMap.current.clear();
            indicatorValuesMap.current.clear();

            try {
              mainCandleSeriesRef.current?.setData([]);
              volumeSeriesRef.current?.setData([]);
            } catch (e) {
              // Ignore
            }
          },
          takeScreenshot: () => {
            const canvas = chartRef.current?.takeScreenshot() as
              | HTMLCanvasElement
              | undefined;
            if (canvas) {
              canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${symbol}_chart.png`;
                a.click();
                URL.revokeObjectURL(url);
              });
            }
          },
          getIndicatorValue: (id: string) => {
            return indicatorValuesMap.current.get(id) ?? null;
          },
          setMarkers: (markers: any[]) => {
            if (mainCandleSeriesRef.current) {
              const cleanMarkers = markers.flatMap((marker) => {
                const time = parseTimeValue(marker?.time);
                return time === null ? [] : [{ ...marker, time }];
              });
              createSeriesMarkers(mainCandleSeriesRef.current, cleanMarkers);
            }
          },
          updateLastPoint: (id: string, dataPoint: any) => {
            if (id === "candles") {
              const cleanPt = sanitizeCandles([dataPoint])[0];
              if (cleanPt) {
                mainCandleSeriesRef.current?.update(cleanPt);
              }
              return;
            }
            if (id === "volume") {
              const cleanPt = sanitizeHistogram([dataPoint])[0];
              if (cleanPt) {
                volumeSeriesRef.current?.update(cleanPt);
              }
              return;
            }
            const seriesList = indicatorSeriesMap.current.get(id);
            if (seriesList) {
              if (Array.isArray(dataPoint)) {
                dataPoint.forEach((pt, idx) => {
                  if (seriesList[idx]) {
                    const cleanPt = sanitizeLivePoint(pt);
                    if (cleanPt) {
                      seriesList[idx].update(cleanPt);
                    }
                  }
                });
              } else {
                const cleanPt = sanitizeLivePoint(dataPoint);
                if (cleanPt) {
                  seriesList[0]?.update(cleanPt);
                }
              }
            }
          },
        };
      } else {
        return {
          fitContent: () => {
            webViewRef.current?.injectJavaScript(`
              if (window.chart) window.chart.timeScale().fitContent();
              true;
            `);
          },
          scrollToRealTime: () => {
            webViewRef.current?.injectJavaScript(`
              if (window.chart) window.chart.timeScale().scrollToRealTime();
              true;
            `);
          },
          setTimeRange: (bars: number) => {
            webViewRef.current?.injectJavaScript(`
              if (window.setTimeRange) window.setTimeRange(${bars});
              true;
            `);
          },
          addIndicatorSeries: (id: string, seriesList: any[], paneIndex: number) => {
            const serialized = JSON.stringify(
              seriesList.map((s) => ({ ...s, data: sanitizeSeriesData(s) }))
            );
            webViewRef.current?.injectJavaScript(`
              if (window.addIndicatorSeries) window.addIndicatorSeries(${JSON.stringify(id)}, ${serialized}, ${paneIndex});
              true;
            `);
            return [];
          },
          updateIndicatorData: (id: string, seriesList: any[]) => {
            const serialized = JSON.stringify(
              seriesList.map((s) => ({ ...s, data: sanitizeSeriesData(s) }))
            );
            webViewRef.current?.injectJavaScript(`
              if (window.updateIndicatorData) window.updateIndicatorData(${JSON.stringify(id)}, ${serialized});
              true;
            `);
          },
          replaceIndicatorSeries: (indicators) => {
            const serialized = JSON.stringify(
              indicators.map((indicator) => ({
                id: indicator.id,
                paneIndex: indicator.paneIndex,
                seriesData: indicator.seriesData.map((s) => ({
                  ...s,
                  data: sanitizeSeriesData(s),
                })),
              }))
            );
            webViewRef.current?.injectJavaScript(`
              if (window.replaceIndicatorSeries) window.replaceIndicatorSeries(${serialized});
              true;
            `);
            return {};
          },
          removeSeries: (seriesRefs: any[]) => {
            // Safe no-op on mobile
          },
          resetChart: () => {
            webViewRef.current?.injectJavaScript(`
              if (window.resetChart) window.resetChart();
              true;
            `);
          },
          takeScreenshot: () => {
            webViewRef.current?.injectJavaScript(`
              if (window.takeScreenshot) window.takeScreenshot();
              true;
            `);
          },
          getIndicatorValue: (id: string) => {
            return indicatorValuesMap.current.get(id) ?? null;
          },
          setMarkers: (markers: any[]) => {
            const cleanMarkers = markers.flatMap((marker) => {
              const time = parseTimeValue(marker?.time);
              return time === null ? [] : [{ ...marker, time }];
            });
            webViewRef.current?.injectJavaScript(`
              if (window.setMarkersData) window.setMarkersData(${JSON.stringify(cleanMarkers)});
              true;
            `);
          },
          updateLastPoint: (id: string, dataPoint: any) => {
            webViewRef.current?.injectJavaScript(`
              if (window.updateLastPoint) window.updateLastPoint(${JSON.stringify(id)}, ${JSON.stringify(dataPoint)});
              true;
            `);
          },
        };
      }
    }, [isWebViewReady, symbol, interval, ohlcv]);

    if (Platform.OS !== "web") {
      return (
        <View style={{ flex: 1, width: "100%", height: "100%" }}>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: MOBILE_HTML }}
            style={{ backgroundColor: "transparent", flex: 1 }}
            onLoadEnd={initWebViewChart}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      );
    }

    return (
      <div
        ref={chartContainerRef}
        style={{ width: "100%", height: "100%", position: "relative" }}
      />
    );
  },
);
