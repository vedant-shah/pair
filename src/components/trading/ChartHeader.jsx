import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ChartHeader = ({
  allCoins,
  firstAsset,
  secondAsset,
  setFirstAsset,
  setSecondAsset,
}) => {
  const [openFirst, setOpenFirst] = React.useState(false);
  const [openSecond, setOpenSecond] = React.useState(false);
  let assetOneValues = {
    funding: 0.0,
    prevDayPx: 1,
    premium: 0.0,
    dayNtlVlm: 0.0,
    oraclePx: 1.0,
    markPx: 1,
    midPx: 0.0,
  };
  let assetTwoValues = {
    funding: 0.0,
    prevDayPx: 1,
    premium: 0.0,
    dayNtlVlm: 0.0,
    oraclePx: 1.0,
    markPx: 1,
    midPx: 0.0,
  };
  const [marketData, setMarketData] = useState({
    coin: "SOL",
    ctx: {
      funding: 0.0,
      prevDayPx: 0.0,
      oraclePx: 0.0,
      markPx: 0.0,
      dayNtlVlm: 0.0,
    },
  });

  const [flashStates, setFlashStates] = useState({
    mark: null,
    change24h: null,
  });

  useEffect(() => {
    const ws = new WebSocket("wss://api.hyperliquid.xyz/ws");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "activeAssetCtx", coin: firstAsset },
        })
      );
      ws.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "activeAssetCtx", coin: secondAsset },
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.channel !== "activeAssetCtx") return;

      const updateAssetValues = (asset, values) => {
        if (message.data.coin === asset) {
          return message.data.ctx;
        }
        return values;
      };

      assetOneValues = updateAssetValues(firstAsset, assetOneValues);
      assetTwoValues = updateAssetValues(secondAsset, assetTwoValues);

      if (!assetOneValues || !assetTwoValues) return;

      const pairAssetValues = {
        markPx: (assetOneValues.markPx / assetTwoValues.markPx).toFixed(2),
        prevDayPx: (
          Number(assetOneValues.prevDayPx) / Number(assetTwoValues.prevDayPx)
        ).toFixed(2),
        funding:
          Number(assetOneValues.funding) - Number(assetTwoValues.funding),
        dayNtlVlm: (
          Number(assetOneValues.dayNtlVlm) + Number(assetTwoValues.dayNtlVlm)
        ).toFixed(2),
        oraclePx: (assetOneValues.oraclePx / assetTwoValues.oraclePx).toFixed(
          2
        ),
      };

      setMarketData((prev) => {
        const newFlashStates = {
          mark: pairAssetValues.markPx >= prev.ctx.markPx ? "up" : "down",
          change24h:
            pairAssetValues.markPx > pairAssetValues.prevDayPx ? "up" : "down",
        };
        setFlashStates(newFlashStates);

        setTimeout(() => {
          setFlashStates({
            mark: null,
            change24h: null,
          });
        }, 1000);

        return {
          coin: message.data.coin,
          ctx: pairAssetValues,
        };
      });
    };

    return () => ws.close();
  }, [firstAsset, secondAsset]);

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-[#041318] border-b border-gray-800">
      {/* Coin Pair Selector */}
      <div className="flex items-center gap-2">
        <Popover open={openFirst} onOpenChange={setOpenFirst}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openFirst}
              className="w-[80px] justify-between">
              {firstAsset ? (
                <div className="flex items-center justify-center gap-1">
                  <img
                    src={`https://app.hyperliquid.xyz/coins/${firstAsset}.svg`}
                    alt={firstAsset}
                    onError={(e) => {
                      e.target.src =
                        "https://app.hyperliquid.xyz/coins/missing.svg";
                    }}
                    className="w-4 h-4 "
                  />
                  {firstAsset}
                </div>
              ) : (
                "Select Coin..."
              )}
              {/* <ChevronsUpDown className="opacity-50" /> */}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[100px] p-0 bg-[#041318]">
            <Command className="bg-[#041318] text-white">
              <CommandInput placeholder="Asset 1" />
              <CommandList>
                <CommandEmpty>No Coin found.</CommandEmpty>
                <CommandGroup>
                  {allCoins?.map((coin) => (
                    <CommandItem
                      key={coin}
                      value={coin}
                      className="text-white"
                      onSelect={(currentValue) => {
                        setFirstAsset(
                          currentValue === firstAsset ? "" : currentValue
                        );
                        setOpenFirst(false);
                      }}>
                      {coin}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <h1 className="text-xl font-bold text-white">-</h1>
        <Popover open={openSecond} onOpenChange={setOpenSecond}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSecond}
              className="w-[80px] justify-between">
              {secondAsset ? (
                <div className="flex items-center justify-center gap-1">
                  <img
                    src={`https://app.hyperliquid.xyz/coins/${secondAsset}.svg`}
                    alt={secondAsset}
                    onError={(e) => {
                      e.target.src =
                        "https://app.hyperliquid.xyz/coins/missing.svg";
                    }}
                    className="w-4 h-4 "
                  />
                  {secondAsset}
                </div>
              ) : (
                "Select Coin..."
              )}
              {/* <ChevronsUpDown className="opacity-50" /> */}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[100px] p-0 bg-[#041318]">
            <Command className="bg-[#041318] text-white">
              <CommandInput placeholder="Asset 1" />
              <CommandList>
                <CommandEmpty>No Coin found.</CommandEmpty>
                <CommandGroup>
                  {allCoins?.map((coin) => (
                    <CommandItem
                      key={coin}
                      value={coin}
                      className="text-white"
                      onSelect={(currentValue) => {
                        setSecondAsset(
                          currentValue === secondAsset ? "" : currentValue
                        );
                        setOpenSecond(false);
                      }}>
                      {coin}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {/* Stats */}

      {/* Mark Price */}
      <div className="flex flex-col">
        <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-1">
          Mark
        </span>
        <span
          className={`font-mono text-[13px]  ${
            flashStates.mark === "up"
              ? "flash-green"
              : flashStates.mark === "down"
              ? "flash-red"
              : "text-white"
          }`}>
          {Number(marketData.ctx.markPx).toFixed(2)}
        </span>
      </div>

      {/* Oracle Price */}
      <div className="flex flex-col">
        <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4">
          Oracle
        </span>
        <span className="font-mono text-[13px] text-white ">
          {Number(marketData.ctx.oraclePx).toFixed(2)}
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
              marketData.ctx.markPx >= marketData.ctx.prevDayPx
                ? "text-[#50d2c1]"
                : "text-[#ED7088]"
            }`}>
            {(Number(marketData.ctx.markPx) -
              Number(marketData.ctx.prevDayPx) >=
            0
              ? "+"
              : "") +
              (
                Number(marketData.ctx.markPx) - Number(marketData.ctx.prevDayPx)
              ).toFixed(2) +
              " / " +
              (
                ((Number(marketData.ctx.markPx) -
                  Number(marketData.ctx.prevDayPx)) *
                  100) /
                Number(marketData.ctx.prevDayPx)
              ).toFixed(2) +
              "%"}
          </span>
        </div>
      </div>

      {/* 24h Volume */}
      <div className="flex flex-col">
        <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4">
          24h Volume
        </span>
        <span className="font-mono text-[13px] text-white min-w-[100px]">
          $
          {Number(marketData.ctx.dayNtlVlm).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
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
            {(marketData.ctx.funding * 100).toFixed(4)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChartHeader;
