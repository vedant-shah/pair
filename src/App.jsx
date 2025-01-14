import React, { useState } from "react";
import Navbar from "./components/layout/Navbar";
import OrderBook from "./components/trading/OrderBook";
import TradingForm from "./components/trading/TradingForm";
import ChartHeader from "./components/trading/ChartHeader";
import Chart from "./components/trading/Chart";
import UserPanel from "./components/trading/UserPanel";
import { Toaster } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Tab configuration
const TABS = [
  { id: "chart", label: "Chart" },
  { id: "orderBook", label: "Order Book" },
  { id: "tradingForm", label: "Trading Form" },
];

// Layout wrapper component
const TradingLayout = ({ children, className = "" }) => (
  <div className={`bg-[#041318] my-1 h-[670px] overflow-hidden ${className}`}>
    {children}
  </div>
);

// Tab button component
const TabButton = ({ isActive, onClick, children }) => (
  <button
    className={`flex-1 px-4 py-2 text-xs transition-colors ${
      isActive
        ? "text-[#50d2c1] border-b-2 border-[#50d2c1]"
        : "text-gray-400 hover:text-white"
    }`}
    onClick={onClick}>
    {children}
  </button>
);

// Mobile navigation component
const MobileNavigation = ({ activeTab, onTabChange }) => (
  <div className="lg:hidden bg-[#041318]">
    <div className="flex w-full border-b border-gray-800">
      {TABS.map((tab) => (
        <TabButton
          key={tab.id}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}>
          {tab.label}
        </TabButton>
      ))}
    </div>
  </div>
);

// Chart view component
const ChartView = ({
  allCoins,
  firstAsset,
  secondAsset,
  setFirstAsset,
  setSecondAsset,
  interval,
  setInterval,
}) => (
  <>
    <ChartHeader
      allCoins={allCoins}
      firstAsset={firstAsset}
      secondAsset={secondAsset}
      setFirstAsset={setFirstAsset}
      setSecondAsset={setSecondAsset}
    />
    <div className="flex-1 w-full p-4 overflow-hidden">
      <div className="w-full h-full" id="chart">
        <Chart
          firstAsset={firstAsset}
          secondAsset={secondAsset}
          interval={interval}
          setInterval={setInterval}
        />
      </div>
    </div>
  </>
);

function App() {
  const [firstAsset, setFirstAsset] = useState("BTC");
  const [secondAsset, setSecondAsset] = useState("SOL");
  const [buyOrSell, setBuyOrSell] = useState("buy");
  const [interval, setInterval] = useState("1h");
  const [activeTab, setActiveTab] = useState("chart");

  const { data: allCoins } = useQuery({
    queryKey: ["coinData"],
    queryFn: async () => {
      const response = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "allMids" }),
      });
      let temp = await response.json();
      return Object.keys(temp).filter((key) => !key.startsWith("@"));
    },
    refetchInterval: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const { data: meta } = useQuery({
    queryKey: ["meta"],
    queryFn: () =>
      fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "meta" }),
      }).then((res) => res.json()),
    refetchInterval: 1000 * 60 * 60 * 24,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Common props for components
  const commonProps = {
    firstAsset,
    secondAsset,
    setFirstAsset,
    setSecondAsset,
    buyOrSell,
    setBuyOrSell,
    interval,
    setInterval,
    allCoins,
    meta,
  };

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors duration={3000} />
      <div className="min-h-screen bg-[#041318] text-white">
        <Navbar />
        <main className="min-h-[90vh] mx-auto overflow-hidden">
          <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="grid max-w-full gap-1 bg-gray-600 lg:grid-cols-5">
            {/* Chart Section */}
            <TradingLayout
              className={`col-span-full ${
                !activeTab || activeTab === "chart" ? "flex flex-col" : "hidden"
              } lg:col-span-3 lg:flex lg:flex-col`}>
              <ChartView {...commonProps} />
            </TradingLayout>

            {/* Order Book */}
            <TradingLayout
              className={`col-span-full ${
                activeTab === "orderBook" ? "flex flex-col" : "hidden"
              } lg:col-span-1 lg:flex lg:flex-col`}>
              <OrderBook
                firstAsset={firstAsset}
                secondAsset={secondAsset}
                buyOrSell={buyOrSell}
              />
            </TradingLayout>

            {/* Trading Form */}
            <TradingLayout
              className={`col-span-full ${
                activeTab === "tradingForm" ? "flex flex-col" : "hidden"
              } lg:col-span-1 lg:flex lg:flex-col`}>
              <TradingForm {...commonProps} />
            </TradingLayout>

            {/* Footer */}
            <div className="bg-[#041318] w-full lg:col-span-4 col-span-full overflow-x-hidden">
              <UserPanel />
            </div>
            <div className="hidden lg:block bg-[#041318] lg:col-span-1" />
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
