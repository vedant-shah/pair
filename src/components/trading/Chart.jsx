import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";

function Chart({ firstAsset, secondAsset, interval, setInterval }) {
  "use no memo";
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const lastFetchRef = useRef(null);
  const timeoutRef = useRef(null);

  const fetchHistoricalCandles = async (
    endTime = Date.now(),
    numCandles = 200
  ) => {
    try {
      const intervalInMs = {
        "5m": 5 * 60 * 1000,
        "15m": 15 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "4h": 4 * 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
        "1w": 7 * 24 * 60 * 60 * 1000,
        "1M": 30 * 24 * 60 * 60 * 1000,
      };

      const endTimeMs = Math.floor(endTime);
      const startTimeMs = endTimeMs - numCandles * intervalInMs[interval];

      const baseRequest = {
        type: "candleSnapshot",
        req: {
          endTime: endTimeMs,
          interval: interval,
          startTime: startTimeMs,
        },
      };
      const body = {
        quote: firstAsset,
        base: secondAsset,
        startTimestamp: Math.floor(startTimeMs / 1000),
        endTimestamp: Math.floor(endTimeMs / 1000),
        interval: interval,
      };

      const response = await fetch("https://hldata.suryansh.xyz/candle", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      return data
        .map((candle) => {
          return {
            t: new Date(candle[0]),
            o: candle[1],
            h: candle[2],
            l: candle[3],
            c: candle[4],
            v: candle[5],
          };
        })
        .filter(Boolean); // Remove any null values
    } catch (error) {
      console.error("Error fetching historical data:", error);
      return [];
    }
  };

  // Initial data query
  const {
    data: historicalCandleData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["candles", firstAsset, secondAsset, interval],
    queryFn: async () => {
      // Calculate a stable timestamp for the current interval
      const now = Date.now();
      const intervalInMs = {
        "5m": 5 * 60 * 1000,
        "15m": 15 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "4h": 4 * 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
        "1w": 7 * 24 * 60 * 60 * 1000,
        "1M": 30 * 24 * 60 * 60 * 1000,
      };

      // Round down to the nearest interval
      const roundedTimestamp =
        Math.floor(now / intervalInMs[interval]) * intervalInMs[interval];
      return fetchHistoricalCandles(roundedTimestamp, 200);
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Query for older data

  const testWebSocket = async (candlestickSeries, volumeSeries) => {
    try {
      // Variables to store latest candle data for each asset
      let latestFirstAssetCandle = null;
      let latestSecondAssetCandle = null;

      const ws = new WebSocket("wss://api.hyperliquid.xyz/ws");

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: {
              type: "candle",
              coin: firstAsset,
              interval: interval,
            },
          })
        );
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: {
              type: "candle",
              coin: secondAsset,
              interval: interval,
            },
          })
        );
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.channel === "candle") {
          const candle = data.data;

          // Store the latest candle data for each asset
          if (candle.s === firstAsset) {
            latestFirstAssetCandle = candle;
          } else if (candle.s === secondAsset) {
            latestSecondAssetCandle = candle;
          }

          // Only update the chart if we have data for both assets
          if (
            latestFirstAssetCandle &&
            latestSecondAssetCandle &&
            latestFirstAssetCandle.t === latestSecondAssetCandle.t
          ) {
            // Process combined candle data
            const combinedCandle = {
              time: Math.floor(latestFirstAssetCandle.t / 1000),
              open:
                Number(latestFirstAssetCandle.o) /
                Number(latestSecondAssetCandle.o),
              high:
                Number(latestFirstAssetCandle.h) /
                Number(latestSecondAssetCandle.h),
              low:
                Number(latestFirstAssetCandle.l) /
                Number(latestSecondAssetCandle.l),
              close:
                Number(latestFirstAssetCandle.c) /
                Number(latestSecondAssetCandle.c),
            };

            const volumeData = {
              time: Math.floor(latestFirstAssetCandle.t / 1000),
              value:
                Number(latestFirstAssetCandle.v) +
                Number(latestSecondAssetCandle.v),
              color:
                combinedCandle.close > combinedCandle.open
                  ? "#174d4a"
                  : "#833640",
            };
            candlestickSeries.update(combinedCandle);
            volumeSeries.update(volumeData);

            // Reset the latest candles after updating
            latestFirstAssetCandle = null;
            latestSecondAssetCandle = null;
          }
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Error connecting to Hyperliquid:", error);
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#041318" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#293233" },
        horzLines: { color: "#293233" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#50d2c1",
      downColor: "#ED7088",
      borderVisible: false,
      wickUpColor: "#50d2c1",
      wickDownColor: "#ED7088",
    });

    candlestickSeries.applyOptions({
      priceFormat: { type: "price", precision: 8, minMove: 0.00000001 },
    });
    candlestickSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.2, bottom: 0.3 },
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    if (historicalCandleData) {
      const formattedData = historicalCandleData.map((candle) => ({
        time: candle.t / 1000,
        open: Number(candle.o),
        high: Number(candle.h),
        low: Number(candle.l),
        close: Number(candle.c),
      }));

      const volumeData = historicalCandleData.map((candle) => ({
        time: candle.t / 1000,
        value: Number(candle.v),
        color: Number(candle.c) > Number(candle.o) ? "#174d4a" : "#833640",
      }));

      candlestickSeries.setData(formattedData);
      volumeSeries.setData(volumeData);

      chart.timeScale().setVisibleLogicalRange({
        from: formattedData.length - 30,
        to: formattedData.length,
      });

      const handleVisibleRangeChange = (logicalRange) => {
        if (!logicalRange) return;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          const data = candlestickSeries.data();
          if (
            logicalRange.from < data.length - 0.9 * data.length &&
            !isLoadingHistory
          ) {
            const oldestCandle = data.reduce((oldest, current) =>
              current.time < oldest.time ? current : oldest
            );

            if (lastFetchRef.current === oldestCandle.time) return;

            setIsLoadingHistory(true);
            lastFetchRef.current = oldestCandle.time;

            fetchHistoricalCandles(oldestCandle.time * 1000, 150)
              .then((historicalData) => {
                if (historicalData?.length) {
                  const formattedData = historicalData
                    .slice(0, -1)
                    .map((candle) => ({
                      time: candle.t / 1000,
                      open: Number(candle.o),
                      high: Number(candle.h),
                      low: Number(candle.l),
                      close: Number(candle.c),
                    }));

                  const volumeData = historicalData
                    .slice(0, -1)
                    .map((candle) => ({
                      time: candle.t / 1000,
                      value: Number(candle.v),
                      color:
                        Number(candle.c) > Number(candle.o)
                          ? "#174d4a"
                          : "#833640",
                    }));

                  candlestickSeries.setData([...formattedData, ...data]);
                  volumeSeries.setData([...volumeData, ...volumeSeries.data()]);
                }
              })
              .catch((error) => {
                console.error("Error fetching historical data:", error);
                lastFetchRef.current = null;
              })
              .finally(() => setIsLoadingHistory(false));
          }
        }, 300);
      };

      chart
        .timeScale()
        .subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

      const handleResize = () => {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      testWebSocket(candlestickSeries, volumeSeries);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        chart.remove();
      };
    }
  }, [historicalCandleData, firstAsset, secondAsset, interval]);

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center w-full flex-col bg-[#041318]">
        <img
          src="/android-chrome-512x512.png"
          alt="logo"
          className="w-1/6 animate-spin"
        />
      </div>
    );
  if (error)
    return (
      <div className="h-full flex flex-col bg-[#041318]">
        Error: {error.message}
      </div>
    );

  return (
    <div className="h-full w-full flex flex-col bg-[#041318]">
      <div className="inline-flex p-1 bg-gray-900 rounded-lg">
        {["5m", "15m", "1h", "4h", "1d", "1w", "1M"].map((int) => (
          <h1
            key={int}
            onClick={() => setInterval(int)}
            className={`${
              interval === int ? "text-[#50d2c1]" : "text-gray-400"
            } me-2 cursor-pointer hover:text-[#50d2c1]/80 last:me-0 text-sm`}>
            {int}
          </h1>
        ))}
      </div>
      <div
        id="chartContainer"
        ref={chartContainerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default Chart;
