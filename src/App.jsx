import React, { useState } from "react";
import Navbar from "./components/layout/Navbar";
import OrderBook from "./components/trading/OrderBook";
import TradingForm from "./components/trading/TradingForm";
import ChartHeader from "./components/trading/ChartHeader";
import Chart from "./components/trading/Chart";
import { Toaster } from "sonner";
import { useQuery } from "@tanstack/react-query";

function App() {
  const [firstAsset, setFirstAsset] = React.useState("SOL");
  const [secondAsset, setSecondAsset] = React.useState("BTC");

  const getAllCoinData = async () => {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "allMids",
      }),
    });
    let temp = await response.json();
    temp = Object.keys(temp).filter((key) => !key.startsWith("@"));
    return temp;
  };

  const {
    data: allCoins,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["coinData"],
    queryFn: getAllCoinData,
    refetchInterval: 1000 * 60 * 30, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors duration={3000} />
      <div className="min-h-screen bg-[#041318] text-white">
        <Navbar />
        <main className=" min-h-[90vh] mx-auto">
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-600">
            <div className="col-span-3 bg-[#041318] rounded-lg h-[670px] flex flex-col">
              <ChartHeader
                allCoins={allCoins}
                firstAsset={firstAsset}
                secondAsset={secondAsset}
                setFirstAsset={setFirstAsset}
                setSecondAsset={setSecondAsset}
              />
              <div className="flex-1 p-4">
                <div className="h-full" id="chart">
                  {/* Chart component will go here */}
                  <Chart />
                </div>
              </div>
            </div>
            <div className="col-span-1 bg-[#041318] rounded-lg h-[670px]">
              <OrderBook />
            </div>
            <div className="col-span-1 bg-[#041318] rounded-lg  h-[670px]">
              <TradingForm />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
