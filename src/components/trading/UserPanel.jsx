import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const TABS = [
  { id: "balances", label: "Balances" },
  { id: "positions", label: "Positions" },
  { id: "openOrders", label: "Open Orders" },
  { id: "twap", label: "TWAP" },
  { id: "tradeHistory", label: "Trade History" },
  { id: "fundingHistory", label: "Funding History" },
  { id: "orderHistory", label: "Order History" },
];

const TabContent = ({ id }) => {
  // Placeholder content for each tab
  return (
    <div className="h-full p-2">
      <div className="text-gray-400">No {id} to display</div>
    </div>
  );
};

const UserPanel = () => {
  return (
    <div className="flex flex-col h-full bg-[#041318] rounded-lg overflow-hidden p-2">
      <Tabs defaultValue="balances" className="flex flex-col h-full">
        <div className="border-b border-gray-800">
          <div className="w-full overflow-x-auto no-scrollbar">
            <TabsList className="inline-flex justify-start h-10 min-w-full p-0 bg-transparent rounded-none">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-4 py-2 text-xs whitespace-nowrap data-[state=active]:text-[#50d2c1] data-[state=active]:border-b-2 data-[state=active]:border-[#50d2c1] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none text-gray-400 hover:text-white">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {TABS.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="flex-1 mt-0 overflow-auto">
            <TabContent id={tab.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default UserPanel;
