import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Slider } from "../ui/slider";
import LeverageModal from "./LeverageModal";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import SlippageModal from "./SlippageModal";
import { formatNumber } from "@/lib/utils";
import { ethers } from "ethers";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const LEVERAGE_STORAGE_KEY = "peri-leverage-values";

const TradingForm = ({
  buyOrSell,
  setBuyOrSell,
  firstAsset,
  secondAsset,
  meta,
}) => {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const [availableToTrade, setAvailableToTrade] = useState(0.0);

  // Helper function to get leverage from storage
  const getLeverageFromStorage = (asset) => {
    if (!authenticated || !user?.wallet?.address) return null;
    try {
      const stored = localStorage.getItem(LEVERAGE_STORAGE_KEY);
      if (!stored) return null;
      const values = JSON.parse(stored);
      return values[user.wallet.address]?.[asset] || null;
    } catch {
      return null;
    }
  };

  // Helper function to get initial leverage
  const getInitialLeverage = (asset) => {
    const maxLev = meta?.[asset]?.Perp?.max_leverage || 1;
    const stored = getLeverageFromStorage(asset);
    return stored !== null ? stored : Math.floor(maxLev / 2);
  };

  const [formState, setFormState] = useState({
    order: {
      type: "market",
      size: "",
      sizeUnit: "USD",
      price: "",
      sliderValue: 0,
    },
    takeProfitStopLoss: [
      {
        takeProfit: { price: "", percentage: "" },
        stopLoss: { price: "" },
      },
    ],
    leverage: {
      firstAsset: getInitialLeverage(firstAsset),
      secondAsset: getInitialLeverage(secondAsset),
    },
    slippage: "1.00",
    modals: { leverage: false, slippage: false },
    webData2: null,
  });

  const [userData, setUserData] = useState(null);
  // Add a ref to track if size is being manually edited
  const [isManualSizeInput, setIsManualSizeInput] = useState(false);
  // Add a timeout ref to handle delay between manual edits
  const manualInputTimeoutRef = React.useRef(null);

  // Get user data from sessionStorage
  useEffect(() => {
    if (authenticated) {
      try {
        const storedUserData = sessionStorage.getItem("peri-userData");
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, [authenticated]);

  useEffect(() => {
    if (ready && authenticated) {
      const ws = new WebSocket("wss://api.hyperliquid.xyz/ws");

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
        const temp =
          Number(message.data?.clearinghouseState?.marginSummary.accountValue) -
          Number(
            message.data?.clearinghouseState?.marginSummary.totalMarginUsed
          );
        if (temp !== availableToTrade) setAvailableToTrade(temp);
      };

      return () => {
        ws.close();
      };
    }
  }, [authenticated]);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      leverage: {
        firstAsset: getInitialLeverage(firstAsset),
        secondAsset: getInitialLeverage(secondAsset),
      },
    }));
  }, [firstAsset, secondAsset, authenticated, user?.wallet?.address]);

  const [builderApproved, setBuilderApproved] = useState(false);
  // Calculate size based on slider, available funds, and leverage
  useEffect(() => {
    // Skip this effect if manual size input is active
    if (isManualSizeInput) return;

    if (formState.webData2?.clearinghouseState?.marginSummary) {
      const calculatedSize = (
        (((2 * formState.order.sliderValue) / 100) *
          availableToTrade *
          (formState.leverage.firstAsset * formState.leverage.secondAsset)) /
        (formState.leverage.firstAsset + formState.leverage.secondAsset)
      ).toFixed(2);

      setFormState((prev) => ({
        ...prev,
        order: {
          ...prev.order,
          size: calculatedSize.toString(), // Convert to string for consistent handling
        },
      }));
    }
  }, [
    formState.order.sliderValue,
    formState.leverage,
    firstAsset,
    secondAsset, // Add dependency to ensure effect runs when manual mode changes
  ]);

  // Calculate slider value when size is manually entered
  const calculateSliderFromSize = (size) => {
    if (!formState.webData2?.clearinghouseState?.marginSummary) return 0;

    const availableToTrade =
      Number(formState.webData2.clearinghouseState.marginSummary.accountValue) -
      Number(
        formState.webData2.clearinghouseState.marginSummary.totalMarginUsed
      );

    if (availableToTrade <= 0) return 0;

    const leverageFactor =
      (formState.leverage.firstAsset * formState.leverage.secondAsset) /
      (formState.leverage.firstAsset + formState.leverage.secondAsset);

    const sizeNum = parseFloat(size) || 0;
    const sliderValue = (sizeNum * 100) / (availableToTrade * leverageFactor);
    return Math.round(Math.min(Math.max(sliderValue, 0), 100)); // Clamp between 0 and 100
  };

  // Handle size input change - revised to maintain string input
  const handleSizeChange = (e) => {
    const inputValue = e.target.value;
    // Only accept numbers and decimal point
    if (!/^[0-9]*\.?[0-9]*$/.test(inputValue) && inputValue !== "") return;

    // Set manual input mode
    setIsManualSizeInput(true);

    // Clear any existing timeout
    if (manualInputTimeoutRef.current) {
      clearTimeout(manualInputTimeoutRef.current);
    }

    const newSliderValue = calculateSliderFromSize(inputValue);

    setFormState((prev) => ({
      ...prev,
      order: {
        ...prev.order,
        size: inputValue, // Store as string to preserve input
        sliderValue: newSliderValue,
      },
    }));

    // Reset manual input mode after a delay
    manualInputTimeoutRef.current = setTimeout(() => {
      setIsManualSizeInput(false);
    }, 1000); // 1 second delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (manualInputTimeoutRef.current) {
        clearTimeout(manualInputTimeoutRef.current);
      }
    };
  }, []);

  // Handle slider change directly
  const handleSliderChange = (value) => {
    setIsManualSizeInput(false); // Ensure we're not in manual mode when slider changes
    setFormState((prev) => ({
      ...prev,
      order: { ...prev.order, sliderValue: value },
    }));
  };

  // Reset values when order type changes
  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      order: {
        ...prev.order,
        price: "",
        size: "", // Empty string instead of 0.0
        sliderValue: 0,
      },
    }));
  }, [formState.order.type]);

  const handleEnableTrading = async () => {
    try {
      if (!wallets.length) {
        toast.error("No wallet found");
        return;
      }
      // console.log("wallets", wallets[0]);
      // console.log(" providers:", providers);
      // console.log(" provider:", provider);
      const providers = await wallets[0].getEthereumProvider();
      const provider = new ethers.BrowserProvider(providers.walletProvider);
      const signer = await provider.getSigner();
      const date = Date.now();
      const message = {
        type: "approveBuilderFee",
        hyperliquidChain: "Mainnet",
        signatureChainId: "0x1",
        maxFeeRate: "0.1%",
        builder: "0xB599581FD94D34FcFD7D99566d13eC6b27D9E3b0",
        nonce: date,
      };

      const domain = {
        name: "HyperliquidSignTransaction",
        version: "1",
        chainId: "0x1",
        verifyingContract: "0x0000000000000000000000000000000000000000",
      };

      const types = {
        "HyperliquidTransaction:ApproveBuilderFee": [
          { name: "hyperliquidChain", type: "string" },
          { name: "maxFeeRate", type: "string" },
          { name: "builder", type: "address" },
          { name: "nonce", type: "uint64" },
        ],
      };
      const signature = await signer.signTypedData(domain, types, message);
      const { r, s, v } = ethers.Signature.from(signature);

      console.log({
        action: message,
        nonce: date,
        signature: { r, s, v },
      });

      const response = await fetch("https://api.hyperliquid.xyz/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: message,
          nonce: date,
          signature: { r, s, v },
        }),
      });

      const data = await response.json();
      console.log(" data:", data);

      if (data.status === "ok") {
        // Update the stored user data with builder approval
        setBuilderApproved(true);
        toast.success("Trading enabled successfully");
      } else {
        throw new Error("Failed to enable trading");
      }
    } catch (error) {
      console.error("Error enabling trading:", error);
      toast.error(error.message || "Failed to enable trading");
    }
  };

  const handlePlaceOrder = async () => {
    const cookies = document.cookie.split(";");
    const accessToken = cookies
      .find((cookie) => cookie.trim().startsWith("privy-token="))
      ?.split("=")[1];

    // Validate TP/SL entries
    const validTpEntries = formState.takeProfitStopLoss.filter(
      (entry) =>
        entry.takeProfit.price &&
        entry.takeProfit.percentage &&
        entry.stopLoss.price
    );

    if (validTpEntries.length === 0) {
      toast.error("At least one complete set of TP/SL is required");
      return;
    }

    // Calculate total TP percentage
    const totalTpPercentage = validTpEntries.reduce(
      (sum, entry) => sum + Number(entry.takeProfit.percentage),
      0
    );

    if (totalTpPercentage > 100) {
      toast.error("Total take profit percentages cannot exceed 100%");
      return;
    }

    const orderPayload = {
      direction: buyOrSell === "buy" ? "long" : "short",
      quote: firstAsset,
      base: secondAsset,
      restingUsdcSize: Number(formState.order.size),
      slippage: Number(formState.slippage),
      tp: formState.takeProfitStopLoss
        .filter(
          (entry) => entry.takeProfit.price && entry.takeProfit.percentage
        )
        .map((entry) => ({
          perc: Number(entry.takeProfit.percentage),
          price: Number(entry.takeProfit.price),
        })),
      sl: Number(formState.takeProfitStopLoss[0].stopLoss.price),
      quoteLeverage: Number(formState.leverage.firstAsset),
      baseLeverage: Number(formState.leverage.secondAsset),
    };

    if (formState.order.type === "limit") {
      orderPayload.entry = Number(formState.order.price);
    }

    try {
      const endpoint = formState.order.type === "market" ? "market" : "limit";
      const order = await fetch(`https://dev.peripair.trade/v1/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!order.ok) {
        throw new Error("Failed to place order");
      }

      toast.success("Order placed successfully");
      // Reset form state after successful order
      setFormState((prev) => ({
        ...prev,
        order: {
          ...prev.order,
          size: "",
          price: "",
          sliderValue: 0,
        },
        takeProfitStopLoss: [
          {
            takeProfit: { price: "", percentage: "" },
            stopLoss: { price: "" },
          },
        ],
      }));
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order");
    }
  };

  const handleButtonClick = () => {
    if (!authenticated) return;

    if (!builderApproved) {
      handleEnableTrading();
    } else {
      handlePlaceOrder();
    }
  };

  const verifyBuilderApproved = async () => {
    if (user) {
      const response = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "maxBuilderFee",
          user: user?.wallet?.address,
          builder: "0xB599581FD94D34FcFD7D99566d13eC6b27D9E3b0",
        }),
      });
      const data = await response.json();
      if (data === 100) {
        setBuilderApproved(true);
        return;
      }
      setBuilderApproved(false);
    }
  };

  useEffect(() => {
    console.log(verifyBuilderApproved());
  }, [user]);

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
          value={formState.order.size} // Use raw string value instead of formatted
          onChange={handleSizeChange}
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
          onValueChange={([value]) => handleSliderChange(value)}
          max={100}
          min={0}
          step={1}
        />
        <div className="flex justify-end mt-1 text-xs text-white">
          {formState.order.sliderValue}%
        </div>
      </div>

      {/* TP/SL Input Fields */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="max-h-[200px] overflow-y-auto pr-2">
          {formState.takeProfitStopLoss.map((entry, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 mb-2">
              <div className="relative">
                <input
                  type="text"
                  value={entry.takeProfit.price}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      takeProfitStopLoss: prev.takeProfitStopLoss.map(
                        (item, i) =>
                          i === index
                            ? {
                                ...item,
                                takeProfit: {
                                  ...item.takeProfit,
                                  price: e.target.value,
                                },
                              }
                            : item
                      ),
                    }))
                  }
                  placeholder="TP Price"
                  className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={entry.takeProfit.percentage}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      takeProfitStopLoss: prev.takeProfitStopLoss.map(
                        (item, i) =>
                          i === index
                            ? {
                                ...item,
                                takeProfit: {
                                  ...item.takeProfit,
                                  percentage: e.target.value,
                                },
                              }
                            : item
                      ),
                    }))
                  }
                  placeholder="Position %"
                  className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
                />
              </div>
              <div className="relative flex gap-2">
                <input
                  type="text"
                  value={entry.stopLoss.price}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      takeProfitStopLoss: prev.takeProfitStopLoss.map(
                        (item, i) =>
                          i === index
                            ? {
                                ...item,
                                stopLoss: {
                                  ...item.stopLoss,
                                  price: e.target.value,
                                },
                              }
                            : item
                      ),
                    }))
                  }
                  placeholder="SL Price"
                  className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
                />
                {index > 0 && (
                  <button
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        takeProfitStopLoss: prev.takeProfitStopLoss.filter(
                          (_, i) => i !== index
                        ),
                      }))
                    }
                    className="px-2 py-1 bg-[#ED7088] text-black rounded hover:bg-[#ED7088]/80 text-xs">
                    -
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {formState.takeProfitStopLoss.length < 5 && (
          <button
            onClick={() =>
              setFormState((prev) => ({
                ...prev,
                takeProfitStopLoss: [
                  ...prev.takeProfitStopLoss,
                  {
                    takeProfit: { price: "", percentage: "" },
                    stopLoss: { price: "" },
                  },
                ],
              }))
            }
            className="w-full px-3 py-2 bg-[#293233] text-white rounded hover:bg-[#293233]/80 text-xs">
            + Add TP/SL
          </button>
        )}
      </div>

      <div className="mt-auto">
        <hr className="my-2 border-gray-800" />

        <div className="flex justify-between mb-2 text-xs">
          <span className="text-gray-400">Margin Required</span>
          <span className="text-white">
            {formatNumber(
              (formState.order.sliderValue / 100) * availableToTrade,
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
          <span className="text-white">0.1%</span>
        </div>
        <div className="flex justify-between mb-2 text-xs">
          <span className="text-gray-400">Order Value</span>
          <span className="text-white">
            {formatNumber(
              parseFloat(formState.order.size || "0") -
                0.001 * parseFloat(formState.order.size || "0"),
              2
            )}
          </span>
        </div>
        {/* Place Order Button */}
        <Button
          onClick={handleButtonClick}
          size={"sm"}
          disabled={
            !authenticated ||
            (builderApproved &&
              (availableToTrade <= 0 ||
                formState.order.size === "0" ||
                formState.order.size === "" ||
                (formState.order.type === "limit" &&
                  formState.order.price === "")))
          }
          className={`w-full mt-2 text-black font-medium text-xs ${
            buyOrSell === "buy"
              ? "bg-[#50d2c1] hover:bg-[#50d2c1]/90"
              : "bg-[#ED7088] hover:bg-[#ED7088]/90"
          }`}>
          {authenticated
            ? builderApproved
              ? "Place Order"
              : "Enable Trading"
            : "Connect Wallet"}
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
