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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AiOutlineSwap } from "react-icons/ai";

const ChartHeader = ({
  allCoins,
  firstAsset,
  secondAsset,
  setFirstAsset,
  setSecondAsset,
}) => {
  const [openFirst, setOpenFirst] = React.useState(false);
  const [openSecond, setOpenSecond] = React.useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  const [marketData, setMarketData] = useState({
    mark_price: 0,
    prev_day_price: 0,
    funding: 0,
    day_volume: 0,
    oracle_price: 0,
  });

  const [flashStates, setFlashStates] = useState({
    mark: null,
    change24h: null,
  });

  const handleSwap = () => {
    setRotationDegrees((prev) => prev + 180);
    const temp = firstAsset;
    setFirstAsset(secondAsset);
    setSecondAsset(temp);
  };

  useEffect(() => {
    const ws = new WebSocket("wss://peri-backend.suryansh.xyz/active_ctx");

    ws.onopen = () => {
      ws.send(JSON.stringify("clear"));
      ws.send(JSON.stringify([firstAsset + "/" + secondAsset]));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const data = Object.values(message)[0];
      if (data)
        setMarketData((prev) => {
          const newFlashStates = {
            mark: data.mark_price >= prev.mark_price ? "up" : "down",
            change24h: data.mark_price > data.prev_day_price ? "up" : "down",
          };
          setFlashStates(newFlashStates);

          setTimeout(() => {
            setFlashStates({
              mark: null,
              change24h: null,
            });
          }, 1000);

          return data;
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
              className="w-max justify-between border-[#041318]">
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
                  {allCoins
                    ?.filter((coin) => coin !== secondAsset)
                    .map((coin) => (
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
        <button
          onClick={handleSwap}
          className="text-xl font-bold text-white hover:text-[#50d2c1] transition-colors">
          <AiOutlineSwap
            className={`transition-transform duration-200`}
            style={{ transform: `rotate(${rotationDegrees}deg)` }}
          />
        </button>
        <Popover open={openSecond} onOpenChange={setOpenSecond}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openSecond}
              className="w-max justify-between border-[#041318]">
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
                  {allCoins
                    ?.filter((coin) => coin !== firstAsset)
                    .map((coin) => (
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
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {/* Mark Price */}
        <div className="flex flex-col">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-1 cursor-default">
                  Mark
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[180px]">
                <p className="text-xs">
                  Used for margining, computing unrealized PNL, liquidations,
                  and triggering TP/SL orders
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`font-mono text-[13px] ${
                    flashStates.mark === "up"
                      ? "flash-green"
                      : flashStates.mark === "down"
                      ? "flash-red"
                      : "text-white"
                  }`}>
                  {Number(marketData.mark_price).toFixed(2)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {Number(marketData.mark_price).toFixed(8)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Oracle Price */}
        <div className="flex flex-col">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4 cursor-default">
                  Oracle
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[180px]">
                <p className="text-xs">
                  The median of external prices reported by validators, used for
                  computing funding rates
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-mono text-[13px] text-white">
                  {Number(marketData.oracle_price).toFixed(2)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {Number(marketData.oracle_price).toFixed(8)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 24h Change */}
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4">
            24h Change
          </span>
          <div className="flex items-center gap-1 min-w-[100px]">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`font-mono text-[13px] ${
                      marketData.mark_price >= marketData.prev_day_price
                        ? "text-[#50d2c1]"
                        : "text-[#ED7088]"
                    }`}>
                    {(Number(marketData.mark_price) -
                      Number(marketData.prev_day_price) >=
                    0
                      ? "+"
                      : "") +
                      (
                        Number(marketData.mark_price) -
                        Number(marketData.prev_day_price)
                      ).toFixed(2) +
                      " / " +
                      (
                        ((Number(marketData.mark_price) -
                          Number(marketData.prev_day_price)) *
                          100) /
                        Number(marketData.prev_day_price)
                      ).toFixed(2) +
                      "%"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {(Number(marketData.mark_price) -
                      Number(marketData.prev_day_price) >=
                    0
                      ? "+"
                      : "") +
                      (
                        Number(marketData.mark_price) -
                        Number(marketData.prev_day_price)
                      ).toFixed(8) +
                      " / " +
                      (
                        ((Number(marketData.mark_price) -
                          Number(marketData.prev_day_price)) *
                          100) /
                        Number(marketData.prev_day_price)
                      ).toFixed(8) +
                      "%"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* 24h Volume */}
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4">
            24h Volume
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-mono text-[13px] text-white min-w-[100px]">
                  $
                  {Number(marketData.day_volume).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  ${Number(marketData.day_volume).toFixed(8)}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Funding */}
        <div className="flex flex-col">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[12px] text-gray-400 underline decoration-gray-400 underline-offset-4 cursor-default">
                  Funding
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[180px]">
                <p className="text-xs">
                  The hourly rate at which longs pay shorts (if negative, shorts
                  pay longs). There are no fees associated with funding, which
                  is a peer-to-peer transfer between users to push prices
                  towards the spot price.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {(marketData.funding * 100).toFixed(8)}%
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartHeader;
