import React from "react";
import Navbar from "./components/layout/Navbar";
import OrderBook from "./components/trading/OrderBook";
import TradingForm from "./components/trading/TradingForm";
import ChartHeader from "./components/trading/ChartHeader";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster position="top-right" theme="dark" richColors duration={3000} />
      <div className="min-h-screen bg-[#041318] text-white">
        <Navbar />
        <main className=" min-h-[90vh] mx-auto">
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-600">
            <div className="col-span-3 bg-[#041318] rounded-lg h-[670px] flex flex-col">
              <ChartHeader />
              <div className="flex-1 p-4">
                <div className="h-full">
                  {/* Chart component will go here */}
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
