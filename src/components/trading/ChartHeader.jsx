import React, { useState, useEffect } from "react";

const ChartHeader = () => {
  const [marketData, setMarketData] = useState({
    pair: "SOL-USD",
    mark: 194.02,
    oracle: 193.89,
    change24h: -2.43,
    changePercent24h: -1.24,
    volume24h: 228453884.7,
    openInterest: 283928994.96,
    funding: 0.0013,
    countdown: "00:27:00",
  });

  const [flashStates, setFlashStates] = useState({
    mark: null,
    change24h: null,
    funding: null,
  });

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "market_data") {
        setMarketData((prev) => {
          // Determine flash states
          const newFlashStates = {
            mark:
              message.data.mark > prev.mark
                ? "up"
                : message.data.mark < prev.mark
                ? "down"
                : null,
            change24h:
              message.data.change24h > prev.change24h
                ? "up"
                : message.data.change24h < prev.change24h
                ? "down"
                : null,
            funding:
              message.data.funding > prev.funding
                ? "up"
                : message.data.funding < prev.funding
                ? "down"
                : null,
          };
          setFlashStates(newFlashStates);

          // Clear flash states after animation
          setTimeout(() => {
            setFlashStates({
              mark: null,
              change24h: null,
              funding: null,
            });
          }, 1000);

          return message.data;
        });
      }
    };

    return () => ws.close();
  }, []);

  const formatNumber = (num) => {
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    }
    return num.toLocaleString();
  };

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-[#041318] border-b border-gray-800">
      {/* Coin Pair Selector */}
      <div className="flex items-center gap-2 min-w-[120px] px-3 py-1.5 bg-[#293233] rounded cursor-pointer hover:bg-[#2f393a]">
        <span className="text-[13px] text-white">SOL-USD</span>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        {/* Mark Price */}
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-1">
            Mark
          </span>
          <span
            className={`font-mono text-[13px] min-w-[80px] ${
              flashStates.mark === "up"
                ? "flash-green"
                : flashStates.mark === "down"
                ? "flash-red"
                : "text-white"
            }`}>
            {marketData.mark.toFixed(2)}
          </span>
        </div>

        {/* Oracle Price */}
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4">
            Oracle
          </span>
          <span className="font-mono text-[13px] text-white min-w-[80px]">
            {marketData.oracle.toFixed(2)}
          </span>
        </div>

        {/* 24h Change */}
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4">
            24h Change
          </span>
          <div className="flex items-center gap-1 min-w-[100px]">
            <span
              className={`font-mono text-[13px] ${
                flashStates.change24h === "up"
                  ? "flash-green"
                  : flashStates.change24h === "down"
                  ? "flash-red"
                  : marketData.change24h >= 0
                  ? "text-[#50d2c1]"
                  : "text-[#ED7088]"
              }`}>
              {marketData.change24h.toFixed(2)}
            </span>
            <span
              className={`font-mono text-[13px] ${
                marketData.changePercent24h >= 0
                  ? "text-[#50d2c1]"
                  : "text-[#ED7088]"
              }`}>
              ({marketData.changePercent24h.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* 24h Volume */}
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4">
            24h Volume
          </span>
          <span className="font-mono text-[13px] text-white min-w-[100px]">
            ${formatNumber(marketData.volume24h)}
          </span>
        </div>

        {/* Open Interest */}
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4">
            Open Interest
          </span>
          <span className="font-mono text-[13px] text-white min-w-[100px]">
            ${formatNumber(marketData.openInterest)}
          </span>
        </div>

        {/* Funding */}
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4">
            Funding
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`font-mono text-[13px] min-w-[60px] ${
                flashStates.funding === "up"
                  ? "flash-green"
                  : flashStates.funding === "down"
                  ? "flash-red"
                  : marketData.funding >= 0
                  ? "text-[#50d2c1]"
                  : "text-[#ED7088]"
              }`}>
              {(marketData.funding * 100).toFixed(4)}%
            </span>
            <span className="font-mono text-[13px] text-gray-400 min-w-[70px]">
              {marketData.countdown}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartHeader;
