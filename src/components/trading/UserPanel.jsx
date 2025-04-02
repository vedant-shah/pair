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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

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

// Add these memoized cell components at the top with other components
const USDCell = React.memo(({ value }) => (
  <span className="text-white">{formatNumber(value)}</span>
));

const PriceCell = React.memo(({ value }) => (
  <span className="font-medium">{formatNumber(value)}</span>
));

const StatusCell = React.memo(({ value }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "resting":
        return "text-[#50d2c1]";
      case "filled":
        return "text-blue-400";
      case "cancelled":
        return "text-gray-400";
      default:
        return "text-white";
    }
  };

  return (
    <span className={`${getStatusColor(value)} font-medium`}>
      {value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}
    </span>
  );
});

const PnLCell = React.memo(({ value, percentage }) => {
  const formattedValue = formatNumber(Math.abs(value));
  const formattedPercentage = formatNumber(Math.abs(percentage));
  const isPositive = value >= 0;
  return (
    <div className="flex flex-col">
      <span className={`${isPositive ? "text-[#50d2c1]" : "text-[#ED7088]"}`}>
        {isPositive ? "+" : "-"}
        {formattedValue} ({isPositive ? "+" : "-"}
        {formattedPercentage}%)
      </span>
    </div>
  );
});

const MarginCell = React.memo(({ value }) => (
  <span className="text-white">{formatNumber(value)}</span>
));

const FundingCell = React.memo(({ value }) => {
  const isPositive = value >= 0;
  return (
    <span className={`${isPositive ? "text-[#50d2c1]" : "text-[#ED7088]"}`}>
      {isPositive ? "+" : "-"}
      {formatNumber(Math.abs(value))}
    </span>
  );
});

// Update the TPSLModal component
const TPSLModal = React.memo(({ open, onOpenChange, position, onSave }) => {
  const [editedPosition, setEditedPosition] = useState({
    sl: position?.sl || "",
    tp: position?.tp?.length ? position.tp : [{ price: "", perc: "" }],
  });

  // Initialize editedPosition when the modal opens
  useEffect(() => {
    if (open) {
      setEditedPosition({
        sl: position?.sl || "",
        tp: position?.tp?.length ? position.tp : [{ price: "", perc: "" }],
      });
    }
  }, [open, position]);

  const handleSave = async () => {
    // Validate total percentage
    const totalPercentage = editedPosition.tp.reduce(
      (sum, tp) => sum + Number(tp.perc),
      0
    );
    if (totalPercentage > 100) {
      toast.error("Total take profit percentages cannot exceed 100%");
      return;
    }

    // Validate all fields are filled
    if (
      !editedPosition.sl ||
      editedPosition.tp.some((tp) => !tp.price || !tp.perc)
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const cookies = document.cookie.split(";");
      const accessToken = cookies
        .find((cookie) => cookie.trim().startsWith("privy-token="))
        ?.split("=")[1];

      const response = await fetch(
        `https://dev.peripair.trade/v1/edit_position/${position.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            sl: Number(editedPosition.sl),
            tp: editedPosition.tp.map((tp) => ({
              price: Number(tp.price),
              perc: Number(tp.perc),
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update position");
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating position:", error);
      toast.error("Failed to update position");
    }
  };

  const addTakeProfit = () => {
    if (editedPosition.tp.length >= 5) return;
    setEditedPosition((prev) => ({
      ...prev,
      tp: [...prev.tp, { price: "", perc: "" }],
    }));
  };

  const removeTakeProfit = (index) => {
    setEditedPosition((prev) => ({
      ...prev,
      tp: prev.tp.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#041318] border-gray-800 text-white h-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex items-center justify-between p-6 border-b border-gray-800">
          <DialogTitle className="text-white">Edit TP/SL</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-400">
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Stop Loss Input - Fixed at top */}
          <div className="flex flex-col gap-2 px-6 py-4">
            <label className="text-sm text-gray-400">Stop Loss</label>
            <input
              type="text"
              value={editedPosition.sl}
              onChange={(e) => {
                if (
                  !/^[0-9]*\.?[0-9]*$/.test(e.target.value) &&
                  e.target.value !== ""
                )
                  return;
                setEditedPosition((prev) => ({
                  ...prev,
                  sl: e.target.value,
                }));
              }}
              className="px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white text-sm"
              placeholder="Enter stop loss price"
            />
          </div>

          {/* Scrollable Take Profit Section */}
          <div className="flex-1 overflow-y-auto border-gray-800 border-y">
            <div className="p-6 space-y-4">
              {/* Column Headers */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-sm text-gray-400">Take Profit Price</div>
                <div className="text-sm text-gray-400">Position Size %</div>
              </div>

              {editedPosition.tp.map((tp, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={tp.price}
                      onChange={(e) => {
                        if (
                          !/^[0-9]*\.?[0-9]*$/.test(e.target.value) &&
                          e.target.value !== ""
                        )
                          return;
                        setEditedPosition((prev) => ({
                          ...prev,
                          tp: prev.tp.map((item, i) =>
                            i === index
                              ? { ...item, price: e.target.value }
                              : item
                          ),
                        }));
                      }}
                      placeholder="Enter TP price"
                      className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white text-sm"
                    />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tp.perc}
                        onChange={(e) => {
                          if (
                            !/^[0-9]*\.?[0-9]*$/.test(e.target.value) &&
                            e.target.value !== ""
                          )
                            return;
                          setEditedPosition((prev) => ({
                            ...prev,
                            tp: prev.tp.map((item, i) =>
                              i === index
                                ? { ...item, perc: e.target.value }
                                : item
                            ),
                          }));
                        }}
                        placeholder="Enter percentage"
                        className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white text-sm"
                      />
                      {index > 0 && (
                        <button
                          onClick={() => removeTakeProfit(index)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-[#ED7088]/10 text-[#ED7088] hover:bg-[#ED7088]/20">
                          -
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Section - Fixed at bottom */}
          <div className="flex flex-col gap-4 p-6">
            {/* Add Take Profit Button */}
            {editedPosition.tp.length < 5 && (
              <button
                onClick={addTakeProfit}
                className="w-full px-3 py-2 bg-[#293233] text-white rounded hover:bg-[#293233]/80 text-sm">
                + Add Take Profit
              </button>
            )}

            {/* Total Percentage Display */}
            <div className="text-sm text-gray-400">
              Total Percentage:{" "}
              {editedPosition.tp.reduce(
                (sum, tp) => sum + Number(tp.perc || 0),
                0
              )}
              %
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full bg-[#50d2c1] text-black hover:bg-[#50d2c1]/90">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// Update the TPSLCell component
const TPSLCell = React.memo(({ tp, sl, position, openModal }) => {
  const handleEditClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    openModal(position);
  };

  // If there's only one TP, show it directly with edit icon
  if (tp?.length === 1) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-2">
          <span className="text-[#50d2c1]">{formatNumber(tp[0].price)}</span>
          <span className="text-[#ED7088]">{formatNumber(sl)}</span>
        </div>
        <button
          onClick={handleEditClick}
          className="p-1 transition-colors rounded hover:bg-white/10">
          <Pencil className="w-3 h-3 text-gray-400" />
        </button>
      </div>
    );
  }

  // If there are multiple TPs, show the View More button with edit icon
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleEditClick}
        className="text-[#50d2c1] hover:text-[#50d2c1]/80">
        View More
      </button>
      <button
        onClick={handleEditClick}
        className="p-1 transition-colors rounded hover:bg-white/10">
        <Pencil className="w-3 h-3 text-gray-400" />
      </button>
    </div>
  );
});

// Memoized table rows component
const TableRows = React.memo(({ columns, data }) => {
  return data.map((row) => (
    <TableRow key={Math.random()} className="border-0 hover:bg-transparent">
      {columns.map((column) => (
        <TableCell
          key={column.accessorKey}
          className="h-8 py-1 text-xs text-white">
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
      <ScrollArea className="w-full pb-2 whitespace-nowrap no-scrollbar">
        <div className="rounded-lg w-full min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.accessorKey}
                    className="h-8 py-1 text-xs border-0 font-medium text-gray-400 bg-[#041318]">
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

// Add a helper function for PnL calculations
const calculatePnL = (markPrice, entryPrice, restingUsdcSize, currentPrice) => {
  const positionSize = restingUsdcSize / currentPrice;
  const pnlValue = (markPrice - entryPrice) * positionSize;
  const pnlPercent = (pnlValue / restingUsdcSize) * 100;
  return { pnlValue, pnlPercent };
};

const UserPanel = () => {
  const [prices, setPrices] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

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
          cell: (row) => <span className="font-medium">{row.coinPair}</span>,
        },
        {
          accessorKey: "totalBalance",
          header: "Total Balance",
          cell: (row) => (
            <span className="font-medium">
              {formatNumber(row.totalBalance, 4)}
            </span>
          ),
        },
        {
          accessorKey: "availableBalance",
          header: "Available Balance",
          cell: (row) => (
            <span className="font-medium">
              {formatNumber(row.availableBalance, 4)}
            </span>
          ),
        },
        {
          accessorKey: "usdcValue",
          header: "USDC Value",
          cell: (row) => <USDCell value={row.usdcValue} />,
        },
        {
          accessorKey: "pnlPercentage",
          header: "PNL %",
          cell: (row) => (
            <PnLCell
              value={parseFloat(row.pnlPercentage)}
              percentage={parseFloat(row.pnlPercentage)}
            />
          ),
        },
      ],
      positions: [
        {
          accessorKey: "quote",
          header: "Pair",
          cell: (row) => (
            <span className="font-medium text-white">
              {row.quote}/{row.base}
            </span>
          ),
        },
        {
          accessorKey: "resting_usdc_size",
          header: "Size (USDC)",
          cell: (row) => <USDCell value={row.resting_usdc_size} />,
        },
        {
          accessorKey: "mark_price",
          header: "Mark Price",
          cell: (row) => {
            const price = prices[row.quote] / prices[row.base];
            return <PriceCell value={price || 0} />;
          },
        },
        {
          accessorKey: "entry",
          header: "Entry Price",
          cell: (row) => <PriceCell value={row.entry} />,
        },
        {
          accessorKey: "pnl",
          header: "PnL (ROE %)",
          cell: (row) => {
            const markPrice = prices[row.quote] / prices[row.base];
            const { pnlValue, pnlPercent } = calculatePnL(
              markPrice,
              row.entry,
              row.resting_usdc_size,
              markPrice
            );
            return <PnLCell value={pnlValue} percentage={pnlPercent} />;
          },
        },
        {
          accessorKey: "margin",
          header: "Margin",
          cell: (row) => <MarginCell value={row.margin} />,
        },
        {
          accessorKey: "funding",
          header: "Funding",
          cell: (row) => <FundingCell value={row.funding || 0.0} />,
        },
        {
          accessorKey: "tp/sl",
          header: "TP/SL",
          cell: (row) => (
            <TPSLCell
              tp={row.tp}
              sl={row.sl}
              position={row}
              openModal={(position) => {
                setSelectedPosition(position);
                setModalOpen(true);
              }}
            />
          ),
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
      const response = await fetch("https://dev.peripair.trade/v1/positions", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching positions:", error);
      return [];
    }
  };
  const {
    data: positions,
    isLoading: positionsLoading,
    refetch: refreshPositions,
  } = useQuery({
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
      {selectedPosition && (
        <TPSLModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          position={selectedPosition}
          onSave={() => {
            // Trigger a refetch instead of page reload
            refreshPositions();
          }}
        />
      )}
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
