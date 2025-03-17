import React, { useMemo, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";

// Static data moved outside component
const TABS = [
  { id: "balances", label: "Balances" },
  { id: "positions", label: "Positions" },
  { id: "openOrders", label: "Open Orders" },
  { id: "twap", label: "TWAP" },
  { id: "tradeHistory", label: "Trade History" },
  { id: "fundingHistory", label: "Funding History" },
  { id: "orderHistory", label: "Order History" },
];

// Memoized cell components
const PnLCell = React.memo(({ value }) => {
  const formattedValue = formatNumber(Math.abs(value), 2);
  return (
    <span className={value >= 0 ? "text-[#50d2c1]" : "text-[#ED7088]"}>
      {value >= 0 ? "+" : "-"}
      {formattedValue}%
    </span>
  );
});

// Memoized table rows component
const TableRows = React.memo(({ columns, data }) => {
  return data.map((row) => (
    <TableRow key={Math.random()} className="border-0 hover:bg-transparent">
      {columns.map((column) => (
        <TableCell
          key={column.accessorKey}
          className="pt-1 text-xs text-white ">
          {column.cell ? column.cell(row) : row[column.accessorKey]}
        </TableCell>
      ))}
    </TableRow>
  ));
});

// Memoized data table component
const DataTable = React.memo(({ columns, data }) => {
  return (
    <div className="w-full">
      <ScrollArea className="w-full pb-4 whitespace-nowrap no-scrollbar">
        <div className="rounded-lg w-full min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.accessorKey}
                    className="text-xs h-4 border-0 font-medium text-gray-400 bg-[#041318] ">
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRows columns={columns} data={data} />
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
});

// Memoized tab content component
const TabContent = React.memo(({ id, columns, data, positions }) => {
  switch (id) {
    case "balances":
      return <DataTable columns={columns.balances} data={data.balances} />;
    case "positions":
      return positions ? (
        <DataTable columns={columns.positions} data={positions} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400">Loading positions...</div>
        </div>
      );
    default:
      return (
        <div className="h-full p-2">
          <div className="text-gray-400">No {id} to display</div>
        </div>
      );
  }
});

const UserPanel = () => {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const ws = new WebSocket("wss://dev.peripair.trade/prices");

    ws.onopen = () => {
      console.log("Connected to price feed");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setPrices((prevPrices) => ({
          ...prevPrices,
          ...message,
        }));
      } catch (error) {
        console.error("Error parsing price data:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const columns = useMemo(
    () => ({
      balances: [
        {
          accessorKey: "coinPair",
          header: "Coin Pair",
        },
        {
          accessorKey: "totalBalance",
          header: "Total Balance",
          cell: (row) => formatNumber(row.totalBalance, 4),
        },
        {
          accessorKey: "availableBalance",
          header: "Available Balance",
          cell: (row) => formatNumber(row.availableBalance, 4),
        },
        {
          accessorKey: "usdcValue",
          header: "USDC Value",
          cell: (row) => formatNumber(row.usdcValue, 2),
        },
        {
          accessorKey: "pnlPercentage",
          header: "PNL %",
          cell: (row) => <PnLCell value={parseFloat(row.pnlPercentage)} />,
        },
      ],
      positions: [
        {
          accessorKey: "quote",
          header: "Pair",
          cell: (row) => `${row.quote}/${row.base}`,
        },
        {
          accessorKey: "resting_usdc_size",
          header: "Size (USDC)",
          cell: (row) => formatNumber(row.resting_usdc_size, 2),
        },
        {
          accessorKey: "mark_price",
          header: "Mark Price",
          cell: (row) => {
            const price = prices[row.quote] / prices[row.base];
            return formatNumber(price || 0, 2);
          },
        },
        {
          accessorKey: "entry",
          header: "Entry Price",
          cell: (row) => formatNumber(row.entry, 2),
        },

        {
          accessorKey: "pnl",
          header: "PnL",
          cell: (row) => formatNumber(row.pnl, 2),
        },
        {
          accessorKey: "margin",
          header: "Margin",
          cell: (row) => formatNumber(row.margin, 2),
        },
        {
          accessorKey: "funding",
          header: "Funding",
          cell: (row) => formatNumber(row.funding, 2),
        },
        {
          accessorKey: "tp/sl",
          header: "TP/SL",
          cell: (row) =>
            `${formatNumber(row.tp, 2)}/${formatNumber(row.sl, 2)}`,
        },
      ],
    }),
    [prices]
  );

  // Sample data (to be replaced with WebSocket data)
  const data = useMemo(
    () => ({
      balances: [
        {
          coinPair: "BTC/USD",
          totalBalance: 1.2345,
          availableBalance: 1.0,
          usdcValue: 45678.9,
          pnlPercentage: 2.34,
        },
      ],
      positions: [
        {
          coinPair: "BTC/USD",
          size: 0.5,
          positionValue: 22345.67,
          entryPrice: 44567.89,
          markPrice: 45678.9,
          pnlPercentage: 2.34,
        },
        {
          coinPair: "ETH/USD",
          size: 0.5,
          positionValue: 22345.67,
          entryPrice: 44567.89,
          markPrice: 45678.9,
          pnlPercentage: -2.34,
        },
      ],
    }),
    []
  );
  const { authenticated, user, getAccessToken } = usePrivy();

  const fetchPositions = async () => {
    try {
      let accessToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("privy-token="))
        ?.split("=")[1];

      if (!accessToken) {
        if (!authenticated || !user?.wallet?.address) return [];
        accessToken = await getAccessToken();
        // create and store a cookie with the access token
        document.cookie = `privy-token=${accessToken}; path=/`;
      }
      const response = await fetch(
        "https://dev.peripair.trade/v1/positions/1",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching positions:", error);
      return [];
    }
  };
  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: () => fetchPositions(),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchIntervalInBackground: true,
    refetchOnReconnect: true,
  });

  return (
    <div className="flex flex-col h-full bg-[#041318] rounded-lg overflow-hidden p-2">
      <Tabs defaultValue="positions" className="flex flex-col h-full">
        <div className="">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-10 p-0 bg-transparent rounded-none">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-4 py-2 text-xs whitespace-nowrap data-[state=active]:text-[#50d2c1] data-[state=active]:border-b-2 data-[state=active]:border-[#50d2c1] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none text-gray-400 hover:text-white">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {TABS.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="flex-1 p-2 mt-0 overflow-auto">
            <TabContent
              id={tab.id}
              columns={columns}
              data={data}
              positions={positions}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default UserPanel;
