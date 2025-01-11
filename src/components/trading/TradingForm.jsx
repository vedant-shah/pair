import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Slider } from "../ui/slider";
import { Checkbox } from "../ui/checkbox";
import LeverageModal from "./LeverageModal";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import SlippageModal from "./SlippageModal";

const TradingForm = ({
  buyOrSell,
  setBuyOrSell,
  firstAsset,
  secondAsset,
  meta,
}) => {
  const [orderType, setOrderType] = useState("market");

  const [webData2, setWebData2] = useState(null);
  const [size, setSize] = useState("");
  const [sizeUnit, setSizeUnit] = useState("BTC");
  const [sliderValue, setSliderValue] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpsl, setTpsl] = useState(false);
  const [leverage, setLeverage] = useState({
    firstAsset: 1,
    secondAsset: 1,
  });
  const [isLeverageModalOpen, setIsLeverageModalOpen] = useState(false);

  // New state variables for TP/SL
  const [tpPrice, setTpPrice] = useState("");
  const [tpGainPercent, setTpGainPercent] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [slLossPercent, setSlLossPercent] = useState("");

  const [slippage, setSlippage] = useState("1.00");
  const [isSlippageModalOpen, setIsSlippageModalOpen] = useState(false);

  const [price, setPrice] = useState("");

  const { ready, authenticated, user } = usePrivy();

  function formatPrice(price, precision) {
    // Use toPrecision to get the string representation with the desired precision
    const preciseValue = Number(price).toFixed(precision);

    // Split into integer and fractional parts for custom formatting
    const [integerPart, fractionalPart] = preciseValue.split(".");

    // Use toLocaleString for the integer part and reattach the fractional part manually
    const formattedIntegerPart = Number(integerPart).toLocaleString();

    if (fractionalPart) {
      // Reattach the fractional part without altering it
      return `${formattedIntegerPart}.${fractionalPart}`;
    }

    return formattedIntegerPart; // No fractional part, return just the integer part
  }

  useEffect(() => {
    if (ready && authenticated) {
      const ws = new WebSocket("wss://api.hyperliquid-testnet.xyz/ws");

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "webData2", user: user.wallet.address },
          })
        );
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setWebData2(message.data);
      };

      return () => {
        ws.close();
      };
    }
  }, [authenticated]);

  useEffect(() => {
    setLeverage({
      firstAsset: 1,
      secondAsset: 1,
    });
  }, [firstAsset, secondAsset]);

  // Reset TP/SL values when checkbox is unchecked
  useEffect(() => {
    if (!tpsl) {
      setTpPrice("");
      setTpGainPercent("");
      setSlPrice("");
      setSlLossPercent("");
    }
  }, [tpsl]);

  // Add new effect to calculate size based on slider, available funds, and leverage
  useEffect(() => {
    if (webData2?.clearinghouseState?.marginSummary) {
      const availableToTrade =
        Number(webData2.clearinghouseState.marginSummary.accountValue) -
        Number(webData2.clearinghouseState.marginSummary.totalMarginUsed);

      const currentLeverage =
        firstAsset === "BTC" ? leverage.firstAsset : leverage.secondAsset;
      const calculatedSize =
        availableToTrade * (sliderValue / 100) * currentLeverage;

      setSize(formatPrice(calculatedSize, 2));
    }
  }, [sliderValue, webData2, leverage, firstAsset]);

  // Reset values when order type changes
  useEffect(() => {
    setPrice("");
    setSize("");
    setSliderValue(1);
  }, [orderType]);

  const handlePlaceOrder = () => {
    // This will be implemented later
    console.log("Place order clicked");
  };

  return (
    <div className="flex flex-col h-full bg-[#041318] p-2 text-xs">
      {/* Cross and 20x buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          className="flex-1 bg-[#293233] hover:bg-[#2f393a] text-white border-0 text-xs">
          Cross
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsLeverageModalOpen(true)}
          className="flex-1 bg-[#293233] hover:bg-[#2f393a] text-white border-0 text-xs">
          {leverage.firstAsset}x / {leverage.secondAsset}x
        </Button>
      </div>

      {/* Order Type Tabs */}
      <Tabs defaultValue="market" className="mb-4" onValueChange={setOrderType}>
        <TabsList className="w-full p-0 text-xs bg-transparent border-b border-gray-800 rounded-none">
          <TabsTrigger
            value="market"
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#50d2c1] data-[state=active]:border-b-2 data-[state=active]:border-[#50d2c1] rounded-none text-xs">
            Market
          </TabsTrigger>
          <TabsTrigger
            value="limit"
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#50d2c1] data-[state=active]:border-b-2 data-[state=active]:border-[#50d2c1] rounded-none text-xs">
            Limit
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Buy/Sell Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={buyOrSell === "buy" ? "default" : "outline"}
          className={`flex-1 text-xs ${
            buyOrSell === "buy"
              ? "bg-[#50d2c1] hover:bg-[#50d2c1]/90 text-black"
              : "text-[#50d2c1] border-[#50d2c1] hover:bg-[#50d2c1]/10"
          }`}
          onClick={() => setBuyOrSell("buy")}>
          Buy / Long
        </Button>
        <Button
          variant={buyOrSell === "sell" ? "default" : "outline"}
          className={`flex-1 text-xs ${
            buyOrSell === "sell"
              ? "bg-[#ED7088] hover:bg-[#ED7088]/90 text-black"
              : "text-[#ED7088] border-[#ED7088] hover:bg-[#ED7088]/10"
          }`}
          onClick={() => setBuyOrSell("sell")}>
          Sell / Short
        </Button>
      </div>

      {/* Trading Info */}
      <div className="flex justify-between mb-4 text-xs">
        <span className="text-gray-400">Available to Trade</span>
        <span className="text-white">
          {formatPrice(
            Number(webData2?.clearinghouseState?.marginSummary?.accountValue) -
              Number(
                webData2?.clearinghouseState?.marginSummary?.totalMarginUsed
              ),
            2
          ) || "0.00"}{" "}
          USD
        </span>
      </div>
      <div className="flex justify-between mb-4 text-xs">
        <span className="text-gray-400">Current Position</span>
        <span className="text-[#50d2c1]">0.00014 BTC</span>
      </div>

      {/* Price Input for Limit Orders */}
      {orderType === "limit" && (
        <div className="relative mb-4">
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
          />
          <button
            onClick={() => {
              // Set price to mid price from webData2 if available
              if (webData2?.clearinghouseState?.marginSummary?.midPx) {
                setPrice(
                  formatPrice(
                    webData2.clearinghouseState.marginSummary.midPx,
                    2
                  )
                );
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#293233] rounded text-gray-400 hover:text-white text-xs">
            Mid
          </button>
        </div>
      )}

      {/* Size Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Size"
          className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
        />
        <button
          onClick={() => setSizeUnit(sizeUnit === "BTC" ? "USD" : "BTC")}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#293233] rounded text-white text-xs">
          {sizeUnit}
        </button>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <Slider
          value={[sliderValue]}
          onValueChange={([value]) => setSliderValue(value)}
          max={100}
          step={1}
        />
        <div className="flex justify-end mt-1 text-xs text-white">
          {sliderValue}%
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-2 mb-4">
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <Checkbox checked={reduceOnly} onCheckedChange={setReduceOnly} />
          Reduce Only
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <Checkbox checked={tpsl} onCheckedChange={setTpsl} />
          Take Profit / Stop Loss
        </label>
      </div>

      {/* TP/SL Input Fields */}
      {tpsl && (
        <div className="flex flex-col gap-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="text"
                value={tpPrice}
                onChange={(e) => setTpPrice(e.target.value)}
                placeholder="TP Price"
                className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={tpGainPercent}
                onChange={(e) => setTpGainPercent(e.target.value)}
                placeholder="Gain %"
                className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
              />
              <span className="absolute text-xs text-gray-400 -translate-y-1/2 right-3 top-1/2">
                %
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="text"
                value={slPrice}
                onChange={(e) => setSlPrice(e.target.value)}
                placeholder="SL Price"
                className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={slLossPercent}
                onChange={(e) => setSlLossPercent(e.target.value)}
                placeholder="Loss %"
                className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
              />
              <span className="absolute text-xs text-gray-400 -translate-y-1/2 right-3 top-1/2">
                %
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <hr className="my-2 border-gray-800" />
        <div className="flex justify-between mb-2 text-xs">
          <span className="text-gray-400">Liquidation Price</span>
          <span className="text-white">N/A</span>
        </div>
        <div className="flex justify-between mb-2 text-xs">
          <span className="text-gray-400">Order Value</span>
          <span className="text-white">N/A</span>
        </div>
        <div className="flex justify-between mb-2 text-xs">
          <span className="text-gray-400">Margin Required</span>
          <span className="text-white">N/A</span>
        </div>
        <div className="flex justify-between mb-2 text-xs">
          <span className="text-gray-400">Slippage</span>
          <span
            onClick={() => setIsSlippageModalOpen(true)}
            className="text-[#50d2c1] cursor-pointer hover:text-[#50d2c1]/80 group relative">
            Est: 0% / Max: {slippage}%
            <span className="absolute hidden group-hover:block right-0 -top-6 text-gray-400 whitespace-nowrap bg-[#293233] px-2 py-1 rounded text-xs">
              Click to Adjust
            </span>
          </span>
        </div>
        <div className="flex justify-between mb-4 text-xs">
          <span className="text-gray-400">Fees</span>
          <span className="text-white">0.0350% / 0.0100%</span>
        </div>

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          className={`w-full py-6 text-black font-medium text-xs ${
            buyOrSell === "buy"
              ? "bg-[#50d2c1] hover:bg-[#50d2c1]/90"
              : "bg-[#ED7088] hover:bg-[#ED7088]/90"
          }`}>
          Place Order
        </Button>
      </div>

      <LeverageModal
        open={isLeverageModalOpen}
        onOpenChange={setIsLeverageModalOpen}
        leverage={leverage}
        setLeverage={setLeverage}
        meta={meta}
        firstAsset={firstAsset}
        secondAsset={secondAsset}
      />

      <SlippageModal
        open={isSlippageModalOpen}
        onOpenChange={setIsSlippageModalOpen}
        slippage={slippage}
        setSlippage={setSlippage}
      />
    </div>
  );
};

export default TradingForm;
