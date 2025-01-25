import React, { useMemo } from "react";
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
    <TableRow key={row.coinPair} className="hover:bg-transparent">
      {columns.map((column) => (
        <TableCell
          key={column.accessorKey}
          className="py-2 text-xs text-white border-b border-gray-800">
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
      <ScrollArea className="w-full whitespace-nowrap no-scrollbar">
        <div className="border border-gray-800 rounded-lg w-full min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.accessorKey}
                    className="text-xs font-medium text-gray-400 bg-[#041318] border-b border-gray-800">
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
const TabContent = React.memo(({ id, columns, data }) => {
  switch (id) {
    case "balances":
      return <DataTable columns={columns.balances} data={data.balances} />;
    case "positions":
      return <DataTable columns={columns.positions} data={data.positions} />;
    default:
      return (
        <div className="h-full p-2">
          <div className="text-gray-400">No {id} to display</div>
        </div>
      );
  }
});

const UserPanel = () => {
  // Memoized columns configuration
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
          accessorKey: "coinPair",
          header: "Coin Pair",
        },
        {
          accessorKey: "size",
          header: "Size",
          cell: (row) => formatNumber(row.size, 4),
        },
        {
          accessorKey: "positionValue",
          header: "Position Value",
          cell: (row) => formatNumber(row.positionValue, 2),
        },
        {
          accessorKey: "entryPrice",
          header: "Entry Price",
          cell: (row) => formatNumber(row.entryPrice, 2),
        },
        {
          accessorKey: "markPrice",
          header: "Mark Price",
          cell: (row) => formatNumber(row.markPrice, 2),
        },
        {
          accessorKey: "pnlPercentage",
          header: "PNL %",
          cell: (row) => <PnLCell value={parseFloat(row.pnlPercentage)} />,
        },
      ],
    }),
    []
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

  return (
    <div className="flex flex-col h-full bg-[#041318] rounded-lg overflow-hidden p-2">
      <Tabs defaultValue="positions" className="flex flex-col h-full">
        <div className="border-b border-gray-800">
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
            <TabContent id={tab.id} columns={columns} data={data} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default UserPanel;
