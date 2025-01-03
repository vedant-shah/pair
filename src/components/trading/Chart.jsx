import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function Chart({ firstAsset, secondAsset, interval, setInterval }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [oldestTimestamp, setOldestTimestamp] = useState(null);

  const fetchHistoricalCandles = async (
    endTime = Date.now(),
    numCandles = 200
  ) => {
    try {
      // Calculate start time based on number of candles and interval
      const intervalInSeconds = {
        "5m": 5 * 60 * 1000,
        "15m": 15 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "4h": 4 * 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
        "1w": 7 * 24 * 60 * 60 * 1000,
        "1M": 30 * 24 * 60 * 60 * 1000,
      };

      const endTimeSeconds = Math.floor(endTime);
      const startTimeSeconds =
        endTimeSeconds - numCandles * intervalInSeconds[interval];

      const temp = {
        req: {
          coin: firstAsset,
          endTime: endTimeSeconds,
          interval: interval,
          startTime: startTimeSeconds,
        },
        type: "candleSnapshot",
      };

      let [assetOneCandles, assetTwoCandles] = await Promise.all([
        fetch(`https://api.hyperliquid.xyz/info`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(temp),
        }).then((response) => response.json()),
        fetch(`https://api.hyperliquid.xyz/info`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "candleSnapshot",
            req: {
              coin: secondAsset,
              endTime: endTimeSeconds,
              interval: interval,
              startTime: startTimeSeconds,
            },
          }),
        }).then((response) => response.json()),
      ]);

      // Process and combine the candle data
      const combinedCandles = assetOneCandles.map((candle1, index) => {
        const candle2 = assetTwoCandles[index];
        return {
          t: candle1.t,
          o: Number(candle1.o) / Number(candle2.o),
          h: Number(candle1.h) / Number(candle2.h),
          l: Number(candle1.l) / Number(candle2.l),
          c: Number(candle1.c) / Number(candle2.c),
          v: Number(candle1.v) + Number(candle2.v),
        };
      });

      return combinedCandles;
    } catch (error) {
      console.error("Error fetching historical data:", error);
      throw error;
    }
  };

  // Initial data query
  const {
    data: historicalCandleData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["candles", "initial", firstAsset, secondAsset, interval],
    queryFn: () => fetchHistoricalCandles(Date.now(), 200), // Fetch last 200 candles
    refetchInterval: 1000 * 60 * 30, // 30 minutes
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
        console.log("connected");
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
          if (candle.coin === firstAsset) {
            latestFirstAssetCandle = candle;
          } else if (candle.coin === secondAsset) {
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
    if (chartContainerRef.current) {
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

      candlestickSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.2,
          bottom: 0.3,
        },
      });

      const volumeSeries = chart.addHistogramSeries({
        color: "#26a69a",
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "",
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
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

        // Set initial oldest timestamp
        const oldestTime = Math.min(...formattedData.map((d) => d.time));
        setOldestTimestamp(oldestTime * 1000);

        chart.timeScale().setVisibleLogicalRange({
          from: formattedData.length - 30,
          to: formattedData.length,
        });

        // Subscribe to visible range changes
        chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
          if (!logicalRange) return;

          const data = candlestickSeries.data();
          if (logicalRange.from < data.length - 0.8 * data.length) {
            // Trigger the older data fetch
            setOldestTimestamp(oldestTime * 1000);
          }
        });
      }

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
        chart.remove();
      };
    }
  }, [historicalCandleData, firstAsset, secondAsset, interval]);

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center w-full flex-col bg-[#041318]">
        <img src="/logo.svg" alt="logo" className="w-1/6 animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="h-full flex flex-col bg-[#041318]">
        Error: {error.message}
      </div>
    );

  return (
    <div className="h-full flex flex-col bg-[#041318]">
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
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

export default Chart;
