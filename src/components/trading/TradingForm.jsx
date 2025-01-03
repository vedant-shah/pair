import React, { useState } from "react";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { Checkbox } from "../ui/checkbox";

const TradingForm = ({ buyOrSell, setBuyOrSell }) => {
  const [orderType, setOrderType] = useState("market");
  const [size, setSize] = useState("");
  const [sizeUnit, setSizeUnit] = useState("BTC");
  const [sliderValue, setSliderValue] = useState(47);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpsl, setTpsl] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#041318] p-2">
      {/* Cross and 20x buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          className="flex-1 bg-[#293233] hover:bg-[#2f393a] text-white border-0">
          Cross
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-[#293233] hover:bg-[#2f393a] text-white border-0">
          20x
        </Button>
      </div>

      {/* Order Type Tabs */}
      <Tabs defaultValue="market" className="mb-4" onValueChange={setOrderType}>
        <TabsList className="w-full p-0 bg-transparent border-b border-gray-800 rounded-none">
          <TabsTrigger
            value="market"
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#50d2c1] data-[state=active]:border-b-2 data-[state=active]:border-[#50d2c1] rounded-none">
            Market
          </TabsTrigger>
          <TabsTrigger
            value="limit"
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#50d2c1] data-[state=active]:border-b-2 data-[state=active]:border-[#50d2c1] rounded-none">
            Limit
          </TabsTrigger>
          <TabsTrigger
            value="pro"
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[#50d2c1] data-[state=active]:border-b-2 data-[state=active]:border-[#50d2c1] rounded-none">
            Pro
            <svg
              className="w-4 h-4 ml-1"
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
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Buy/Sell Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={buyOrSell === "buy" ? "default" : "outline"}
          className={`flex-1 ${
            buyOrSell === "buy"
              ? "bg-[#50d2c1] hover:bg-[#50d2c1]/90 text-black"
              : "text-[#50d2c1] border-[#50d2c1] hover:bg-[#50d2c1]/10"
          }`}
          onClick={() => setBuyOrSell("buy")}>
          Buy / Long
        </Button>
        <Button
          variant={buyOrSell === "sell" ? "default" : "outline"}
          className={`flex-1 ${
            buyOrSell === "sell"
              ? "bg-[#ED7088] hover:bg-[#ED7088]/90 text-black"
              : "text-[#ED7088] border-[#ED7088] hover:bg-[#ED7088]/10"
          }`}
          onClick={() => setBuyOrSell("sell")}>
          Sell / Short
        </Button>
      </div>

      {/* Trading Info */}
      <div className="flex justify-between mb-4 text-sm">
        <span className="text-gray-400">Available to Trade</span>
        <span className="text-white">0.00</span>
      </div>
      <div className="flex justify-between mb-4 text-sm">
        <span className="text-gray-400">Current Position</span>
        <span className="text-white">0.00 BTC</span>
      </div>

      {/* Size Input */}
      <div className="relative mb-4">
        <div className="flex">
          <div className="w-full mt-2">
            <div className="flex items-center rounded-md bg-[#041318] pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
              <input
                type="text"
                name="price"
                id="price"
                className="block min-w-0 grow py-1.5 pl-1 pr-3 bg-[#041318] text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                placeholder="0.00"
              />
              <div className="grid grid-cols-1 shrink-0 focus-within:relative">
                <select
                  id="currency"
                  name="currency"
                  aria-label="Currency"
                  className="col-start-1 row-start-1 bg-[#041318] w-full appearance-none rounded-md py-1.5 pl-3 pr-7 text-base text-gray-500 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                  <option>SOL</option>
                  <option>USD</option>
                </select>
                <svg
                  className="self-center col-start-1 row-start-1 mr-2 text-gray-500 pointer-events-none size-5 justify-self-end sm:size-4"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  data-slot="icon">
                  <path
                    fillRule="evenodd"
                    d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <Slider
          value={[sliderValue]}
          onValueChange={([value]) => setSliderValue(value)}
          max={100}
          step={1}
        />
        <div className="flex justify-end mt-1 text-sm text-white">
          {sliderValue}%
        </div>
      </div>

      {/* Radio Options */}
      <div className="flex flex-col gap-2 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <Checkbox checked={reduceOnly} onCheckedChange={setReduceOnly} />
          Reduce Only
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <Checkbox checked={tpsl} onCheckedChange={setTpsl} />
          Take Profit / Stop Loss
        </label>
      </div>

      {/* Order Info */}
      <div className="mt-auto">
        <hr className="my-2 border-gray-800" />
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-gray-400">Liquidation Price</span>
          <span className="text-white">N/A</span>
        </div>
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-gray-400">Order Value</span>
          <span className="text-white">N/A</span>
        </div>
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-gray-400">Margin Required</span>
          <span className="text-white">N/A</span>
        </div>
        <div className="flex justify-between mb-2 text-sm">
          <span className="text-gray-400">Leverage</span>
          <span className="text-[#50d2c1]">Est: 0% / Max: 8.00%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Fees</span>
          <span className="text-white">0.0350% / 0.0100%</span>
        </div>
      </div>
    </div>
  );
};

export default TradingForm;
