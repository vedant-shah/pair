import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Slider } from "../ui/slider";
import { Checkbox } from "../ui/checkbox";
import LeverageModal from "./LeverageModal";
import { usePrivy } from "@privy-io/react-auth";
import SlippageModal from "./SlippageModal";
import { formatNumber } from "@/lib/utils";

const TradingForm = ({
  buyOrSell,
  setBuyOrSell,
  firstAsset,
  secondAsset,
  meta,
}) => {
  const [formState, setFormState] = useState({
    order: {
      type: "market",
      size: "",
      sizeUnit: "USD",
      price: "",
      sliderValue: 0,
      reduceOnly: false,
    },
    takeProfitStopLoss: {
      enabled: false,
      takeProfit: { price: "", gainPercent: "" },
      stopLoss: { price: "", lossPercent: "" },
    },
    leverage: { firstAsset: 1, secondAsset: 1 },
    slippage: "1.00",
    modals: { leverage: false, slippage: false },
    webData2: null,
  });

  const { ready, authenticated, user } = usePrivy();

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
        setFormState((prev) => ({ ...prev, webData2: message.data }));
      };

      return () => {
        ws.close();
      };
    }
  }, [authenticated]);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      leverage: { firstAsset: 1, secondAsset: 1 },
    }));
  }, [firstAsset, secondAsset]);

  // Reset TP/SL values when checkbox is unchecked
  useEffect(() => {
    if (!formState.takeProfitStopLoss.enabled) {
      setFormState((prev) => ({
        ...prev,
        takeProfitStopLoss: {
          ...prev.takeProfitStopLoss,
          takeProfit: { price: "", gainPercent: "" },
          stopLoss: { price: "", lossPercent: "" },
        },
      }));
    }
  }, [formState.takeProfitStopLoss.enabled]);

  // Calculate size based on slider, available funds, and leverage
  useEffect(() => {
    if (formState.webData2?.clearinghouseState?.marginSummary) {
      const availableToTrade =
        Number(
          formState.webData2.clearinghouseState.marginSummary.accountValue
        ) -
        Number(
          formState.webData2.clearinghouseState.marginSummary.totalMarginUsed
        );

      const calculatedSize =
        ((formState.order.sliderValue / 100) *
          (2 *
            availableToTrade *
            (formState.leverage.firstAsset * formState.leverage.secondAsset))) /
        (formState.leverage.firstAsset + formState.leverage.secondAsset);

      setFormState((prev) => ({
        ...prev,
        order: {
          ...prev.order,
          size: calculatedSize,
        },
      }));
    }
  }, [
    formState.order.sliderValue,
    formState.webData2,
    formState.leverage,
    firstAsset,
  ]);

  // Reset values when order type changes
  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      order: {
        ...prev.order,
        price: "",
        size: 0.0,
        sliderValue: 0,
      },
    }));
  }, [formState.order.type]);

  const handlePlaceOrder = () => {
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
          onClick={() =>
            setFormState((prev) => ({
              ...prev,
              modals: { ...prev.modals, leverage: true },
            }))
          }
          className="flex-1 bg-[#293233] hover:bg-[#2f393a] text-white border-0 text-xs">
          {formState.leverage.firstAsset}x / {formState.leverage.secondAsset}x
        </Button>
      </div>

      {/* Order Type Tabs */}
      <Tabs
        defaultValue="market"
        className="mb-4"
        onValueChange={(value) =>
          setFormState((prev) => ({
            ...prev,
            order: { ...prev.order, type: value },
          }))
        }>
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
          {formatNumber(
            Number(
              formState.webData2?.clearinghouseState?.marginSummary
                ?.accountValue
            ) -
              Number(
                formState.webData2?.clearinghouseState?.marginSummary
                  ?.totalMarginUsed
              ),
            2
          ) || "0.00"}{" "}
          USD
        </span>
      </div>
      <div className="flex justify-between mb-4 text-xs">
        <span className="text-gray-400">Current Position</span>
        <span className="text-[#50d2c1]">
          0.00014 {`${firstAsset}/${secondAsset}`}
        </span>
      </div>

      {/* Price Input for Limit Orders */}
      {formState.order.type === "limit" && (
        <div className="relative mb-4">
          <input
            type="text"
            value={formState.order.price}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                order: { ...prev.order, price: e.target.value },
              }))
            }
            placeholder="Price"
            className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
          />
          <button
            onClick={() => {
              if (
                formState.webData2?.clearinghouseState?.marginSummary?.midPx
              ) {
                setFormState((prev) => ({
                  ...prev,
                  order: {
                    ...prev.order,
                    price: formatNumber(
                      formState.webData2.clearinghouseState.marginSummary.midPx,
                      2
                    ),
                  },
                }));
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
          value={formatNumber(formState.order.size, 2)}
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              order: { ...prev.order, size: Number(e.target.value) },
            }))
          }
          placeholder="Size"
          className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#293233] rounded text-white text-xs">
          {formState.order.sizeUnit}
        </button>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <Slider
          value={[formState.order.sliderValue]}
          onValueChange={([value]) =>
            setFormState((prev) => ({
              ...prev,
              order: { ...prev.order, sliderValue: value },
            }))
          }
          max={100}
          min={0}
          step={1}
        />
        <div className="flex justify-end mt-1 text-xs text-white">
          {formState.order.sliderValue}%
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col gap-2 mb-4">
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <Checkbox
            checked={formState.order.reduceOnly}
            onCheckedChange={(checked) =>
              setFormState((prev) => ({
                ...prev,
                order: { ...prev.order, reduceOnly: checked },
              }))
            }
          />
          Reduce Only
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <Checkbox
            checked={formState.takeProfitStopLoss.enabled}
            onCheckedChange={(checked) =>
              setFormState((prev) => ({
                ...prev,
                takeProfitStopLoss: {
                  ...prev.takeProfitStopLoss,
                  enabled: checked,
                },
              }))
            }
          />
          Take Profit / Stop Loss
        </label>
      </div>

      {/* TP/SL Input Fields */}
      {formState.takeProfitStopLoss.enabled && (
        <div className="flex flex-col gap-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="text"
                value={formState.takeProfitStopLoss.takeProfit.price}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    takeProfitStopLoss: {
                      ...prev.takeProfitStopLoss,
                      takeProfit: {
                        ...prev.takeProfitStopLoss.takeProfit,
                        price: e.target.value,
                      },
                    },
                  }))
                }
                placeholder="TP Price"
                className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={formState.takeProfitStopLoss.takeProfit.gainPercent}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    takeProfitStopLoss: {
                      ...prev.takeProfitStopLoss,
                      takeProfit: {
                        ...prev.takeProfitStopLoss.takeProfit,
                        gainPercent: e.target.value,
                      },
                    },
                  }))
                }
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
                value={formState.takeProfitStopLoss.stopLoss.price}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    takeProfitStopLoss: {
                      ...prev.takeProfitStopLoss,
                      stopLoss: {
                        ...prev.takeProfitStopLoss.stopLoss,
                        price: e.target.value,
                      },
                    },
                  }))
                }
                placeholder="SL Price"
                className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                value={formState.takeProfitStopLoss.stopLoss.lossPercent}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    takeProfitStopLoss: {
                      ...prev.takeProfitStopLoss,
                      stopLoss: {
                        ...prev.takeProfitStopLoss.stopLoss,
                        lossPercent: e.target.value,
                      },
                    },
                  }))
                }
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
          <span className="text-white">
            {formatNumber(
              (Number(formState.order.size) / 2) *
                (formState.leverage.firstAsset +
                  formState.leverage.secondAsset),
              2
            )}
          </span>
        </div>
        <div className="flex justify-between mb-2 text-xs">
          <span className="text-gray-400">Slippage</span>
          <span
            onClick={() =>
              setFormState((prev) => ({
                ...prev,
                modals: { ...prev.modals, slippage: true },
              }))
            }
            className="text-[#50d2c1] cursor-pointer hover:text-[#50d2c1]/80 group relative">
            Est: 0% / Max: {formState.slippage}%
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
        open={formState.modals.leverage}
        onOpenChange={(open) =>
          setFormState((prev) => ({
            ...prev,
            modals: { ...prev.modals, leverage: open },
          }))
        }
        leverage={formState.leverage}
        setLeverage={(newLeverage) =>
          setFormState((prev) => ({
            ...prev,
            leverage: newLeverage,
          }))
        }
        meta={meta}
        firstAsset={firstAsset}
        secondAsset={secondAsset}
      />

      <SlippageModal
        open={formState.modals.slippage}
        onOpenChange={(open) =>
          setFormState((prev) => ({
            ...prev,
            modals: { ...prev.modals, slippage: open },
          }))
        }
        slippage={formState.slippage}
        setSlippage={(newSlippage) =>
          setFormState((prev) => ({
            ...prev,
            slippage: newSlippage,
          }))
        }
      />
    </div>
  );
};

export default TradingForm;
