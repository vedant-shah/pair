import React, { useState, useEffect } from "react";

const OrderBook = () => {
  const [activeTab, setActiveTab] = useState("orderbook");
  const [orderBook, setOrderBook] = useState({
    bids: [],
    asks: [],
  });
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "orderbook") {
        setOrderBook(message.data);
      } else if (message.type === "trade") {
        setTrades((prevTrades) => {
          const newTrade = {
            id: Date.now(),
            ...message.data,
          };
          return [newTrade, ...prevTrades].slice(0, 25);
        });
      }
    };

    return () => ws.close();
  }, []);

  const OrderRow = ({ price, size, side, total }) => (
    <div className="grid grid-cols-3 h-[23px] text-sm items-center relative my-[3px]">
      <div
        className={`absolute top-0 left-0 h-full ${
          side === "bid" ? "bg-[#50d2c1]" : "bg-[#ED7088]"
        }`}
        style={{ width: `${Math.min(100, total)}%`, opacity: 0.15 }}
      />
      <span
        className={`font-mono pl-2 relative ${
          side === "bid" ? "text-[#50d2c1]" : "text-[#ED7088]"
        }`}>
        {price.toFixed(2)}
      </span>
      <span className="relative font-mono text-right text-white">
        {size.toFixed(2)}
      </span>
      <span className="relative pr-2 font-mono text-right text-gray-400">
        {total.toFixed(2)}%
      </span>
    </div>
  );

  const TradeRow = ({ price, size, time, type }) => (
    <div className="grid grid-cols-[1fr_1fr_auto] h-[23px] text-sm items-center gap-4">
      <span
        className={`font-mono pl-2 ${
          type === "buy" ? "text-[#50d2c1]" : "text-[#ED7088]"
        }`}>
        {price.toFixed(2)}
      </span>
      <span className="font-mono text-right text-white">{size.toFixed(2)}</span>
      <div className="flex items-center gap-2 pr-2 min-w-[120px] justify-end">
        <span className="font-mono text-gray-400 whitespace-nowrap">
          {time}
        </span>
        <svg
          className="w-3 h-3 text-[#50d2c1] cursor-pointer"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </div>
  );

  const calculateTotal = (orders, index) => {
    const totalVolume = orders.reduce((sum, order) => sum + order.size, 0);
    const volumeUpToIndex = orders
      .slice(0, index + 1)
      .reduce((sum, order) => sum + order.size, 0);
    return (volumeUpToIndex / totalVolume) * 100;
  };

  return (
    <div className="h-full flex flex-col bg-[#041318]">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === "orderbook"
              ? "text-white border-b-2 border-[#50d2c1]"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("orderbook")}>
          Order Book
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === "trades"
              ? "text-white border-b-2 border-[#50d2c1]"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("trades")}>
          Trades
        </button>
      </div>

      {activeTab === "orderbook" ? (
        <div className="flex flex-col ">
          {/* Headers */}
          <div className="grid grid-cols-3 px-2 py-1 text-xs text-gray-400 border-b border-gray-800">
            <span className="pl-2">Price</span>
            <span className="text-right">Size</span>
            <span className="pr-2 text-right">Total</span>
          </div>
          {/* Asks */}
          <div className="flex-1 overflow-hidden">
            {orderBook.asks
              .slice(0, 11)
              .reverse()
              .map((ask, i) => (
                <OrderRow
                  key={i}
                  price={ask.price}
                  size={ask.size}
                  side="ask"
                  total={calculateTotal(
                    orderBook.asks,
                    orderBook.asks.length - 1 - i
                  )}
                />
              ))}
          </div>

          {/* Spread */}
          <div className="bg-[#293233] px-2 py-1 text-sm flex justify-between text-gray-400">
            <span>Spread</span>
            <span>
              {orderBook.asks[0] && orderBook.bids[0]
                ? (orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)
                : "0.00"}{" "}
              (
              {orderBook.asks[0] && orderBook.bids[0]
                ? (
                    ((orderBook.asks[0].price - orderBook.bids[0].price) /
                      orderBook.asks[0].price) *
                    100
                  ).toFixed(2)
                : "0.00"}
              %)
            </span>
          </div>

          {/* Bids */}
          <div className="flex-1 overflow-hidden">
            {orderBook.bids.slice(0, 11).map((bid, i) => (
              <OrderRow
                key={i}
                price={bid.price}
                size={bid.size}
                side="bid"
                total={calculateTotal(orderBook.bids, i)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Trades Header */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-2 py-1 text-xs text-gray-400 border-b border-gray-800">
            <span className="pl-2">Price</span>
            <span className="text-right">Size</span>
            <span className="pr-2 min-w-[120px] text-right">Time</span>
          </div>
          {/* Trades List */}
          <div className="h-full py-1 overflow-y-auto">
            {trades.slice(0, 24).map((trade) => (
              <TradeRow key={trade.id} {...trade} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderBook;
