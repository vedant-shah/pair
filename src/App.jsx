import React, { useState, lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "./components/layout/Navbar";
import { Toaster } from "sonner";

// Lazy load components
const OrderBook = lazy(() => import("./components/trading/OrderBook"));
const TradingForm = lazy(() => import("./components/trading/TradingForm"));
const ChartHeader = lazy(() => import("./components/trading/ChartHeader"));
const Chart = lazy(() => import("./components/trading/Chart"));
const UserPanel = lazy(() => import("./components/trading/UserPanel"));
const RestrictedAccess = lazy(() =>
  import("./components/pages/RestrictedAccess")
);
const ApiWallet = lazy(() => import("./components/pages/ApiWallet"));
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

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#041318] flex items-center justify-center">
    <img
      src="/android-chrome-512x512.png"
      alt="Loading"
      className="w-16 h-16 animate-spin"
    />
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
    <Suspense fallback={<LoadingSpinner />}>
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
    </Suspense>
  </>
);

// Trading view component that includes the main trading interface
const TradingView = () => {
  const [firstAsset, setFirstAsset] = useState(() => {
    const stored = localStorage.getItem("peri-first-asset");
    return stored || "BTC";
  });
  const [secondAsset, setSecondAsset] = useState(() => {
    const stored = localStorage.getItem("peri-second-asset");
    return stored || "SOL";
  });
  const [buyOrSell, setBuyOrSell] = useState("buy");
  const [interval, setInterval] = useState("1h");
  const [activeTab, setActiveTab] = useState("chart");

  // Update localStorage when assets change
  useEffect(() => {
    localStorage.setItem("peri-first-asset", firstAsset);
  }, [firstAsset]);

  useEffect(() => {
    localStorage.setItem("peri-second-asset", secondAsset);
  }, [secondAsset]);

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
      fetch("https://dev.peripair.trade/meta", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
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
            <Suspense fallback={<LoadingSpinner />}>
              <OrderBook
                firstAsset={firstAsset}
                secondAsset={secondAsset}
                buyOrSell={buyOrSell}
              />
            </Suspense>
          </TradingLayout>

          {/* Trading Form */}
          <TradingLayout
            className={`col-span-full ${
              activeTab === "tradingForm" ? "flex flex-col" : "hidden"
            } lg:col-span-1 lg:flex lg:flex-col`}>
            <Suspense fallback={<LoadingSpinner />}>
              <TradingForm {...commonProps} />
            </Suspense>
          </TradingLayout>

          {/* Footer */}
          <div className="bg-[#041318] w-full lg:col-span-4 col-span-full overflow-x-hidden">
            <Suspense fallback={<LoadingSpinner />}>
              <UserPanel />
            </Suspense>
          </div>
          <div className="hidden lg:block bg-[#041318] lg:col-span-1" />
        </div>
      </main>
    </div>
  );
};

// Root component that handles IP check and routing
const Root = () => {
  // IP check query
  const { data: ipData, isLoading } = useQuery({
    queryKey: ["ipData"],
    queryFn: () =>
      fetch("https://ipapi.co/json/")
        .then((response) => response.json())
        .then((data) => {
          return data;
        })
        .catch((error) => {
          console.error("Error:", error);
          return null;
        }),
    refetchInterval: 1000 * 60 * 60 * 24,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#041318] flex items-center justify-center">
        <img
          src="/android-chrome-512x512.png"
          alt="Loading"
          className="w-16 h-16 animate-spin"
        />
      </div>
    );
  }

  const isRestrictedRegion =
    ipData?.country_code === "US" || ipData?.country_code === "HK";

  return (
    <Routes>
      <Route
        path="/"
        element={
          isRestrictedRegion ? (
            <Navigate
              to="/restricted"
              state={{ country: ipData?.country_code }}
              replace
            />
          ) : (
            <Suspense fallback={<LoadingSpinner />}>
              <TradingView />
            </Suspense>
          )
        }
      />
      <Route
        path="/restricted"
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <RestrictedAccess />
          </Suspense>
        }
      />
      <Route
        path="/API"
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <ApiWallet />
          </Suspense>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <>
      <Toaster position="top-right" theme="dark" richColors duration={3000} />
      <Router>
        <Root />
      </Router>
    </>
  );
}

export default App;
