import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function Chart() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [oldestTimestamp, setOldestTimestamp] = useState(null);
  const queryClient = useQueryClient();

  const fetchHistoricalCandles = async (
    startTime = Date.now() - 20 * 24 * 60 * 60 * 1000,
    endTime = Date.now()
  ) => {
    try {
      const response = await fetch(`https://api.hyperliquid.xyz/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          req: {
            coin: "SOL",
            endTime: endTime,
            interval: "1h",
            startTime: startTime,
          },
          type: "candleSnapshot",
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      return data;
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
    queryKey: ["candles", "initial"],
    queryFn: () =>
      fetchHistoricalCandles(Date.now() - 20 * 24 * 60 * 60 * 1000, Date.now()),
    refetchInterval: 1000 * 60 * 30, // 30 minutes
  });

  // Query for older data
  const fetchOlderData = useQuery({
    queryKey: ["candles", "older", oldestTimestamp],
    queryFn: async () => {
      console.log(oldestTimestamp);
      if (!oldestTimestamp) return null;
      const endTime = oldestTimestamp;
      const startTime = endTime - 20 * 24 * 60 * 60 * 1000;
      return fetchHistoricalCandles(startTime, endTime);
    },
    enabled: !!oldestTimestamp, // Only run when oldestTimestamp is set
    onSuccess: (newData) => {
      if (!newData) return;

      // Get the current chart and series
      const chart = chartRef.current;
      if (!chart) return;

      const series = chart
        .series()
        .find((s) => s.seriesType() === "Candlestick");
      const volumeSeries = chart
        .series()
        .find((s) => s.seriesType() === "Histogram");

      if (!series || !volumeSeries) return;

      // Format the new data
      const formattedData = newData.map((candle) => ({
        time: candle.t / 1000,
        open: Number(candle.o),
        high: Number(candle.h),
        low: Number(candle.l),
        close: Number(candle.c),
      }));

      const volumeData = newData.map((candle) => ({
        time: candle.t / 1000,
        value: Number(candle.v),
        color: Number(candle.c) > Number(candle.o) ? "#174d4a" : "#833640",
      }));

      // Update the series with the new data
      series.setData([...formattedData, ...series.data()]);
      volumeSeries.setData([...volumeData, ...volumeSeries.data()]);

      // Update the oldest timestamp
      const newOldestTime = Math.min(...formattedData.map((d) => d.time));
      setOldestTimestamp(newOldestTime * 1000);
    },
  });

  const testWebSocket = async (candlestickSeries, volumeSeries) => {
    try {
      const ws = new WebSocket("wss://api.hyperliquid.xyz/ws");

      ws.onopen = () => {
        console.log("connected");
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "candle", coin: "SOL", interval: "1h" },
          })
        );
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.channel === "candle") {
          candlestickSeries.update({
            time: data.data.t / 1000,
            open: Number(data.data.o),
            high: Number(data.data.h),
            low: Number(data.data.l),
            close: Number(data.data.c),
          });
          volumeSeries.update({
            time: data.data.t / 1000,
            value: Number(data.data.v),
          });
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
  }, [historicalCandleData]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
  );
}

export default Chart;
