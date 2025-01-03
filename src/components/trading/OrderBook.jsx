import React, { useState, useEffect, useCallback } from "react";

const OrderBook = ({ firstAsset, secondAsset, buyOrSell }) => {
  const [orderBook, setOrderBook] = useState({
    sell: [],
    buy: [],
  });

  // Separate the message processing logic
  const processOrderBookData = useCallback(
    (message) => {
      if (message.channel !== "l2Book") return;

      const updateOrderBook = (levels, isBuy) => {
        let cumSum = 0;
        const tempArray = levels.slice(0, 10).map((level) => {
          cumSum += Math.round(level.px * level.sz);
          return {
            price: level.px,
            size: Math.round(level.px * level.sz),
            total: cumSum,
          };
        });

        setOrderBook((prev) => ({
          ...prev,
          [isBuy ? "buy" : "sell"]: isBuy ? tempArray : tempArray.reverse(),
        }));
      };

      if (message.data.coin === firstAsset) {
        updateOrderBook(message.data.levels[1], buyOrSell !== "buy");
      } else if (message.data.coin === secondAsset) {
        updateOrderBook(message.data.levels[0], buyOrSell === "buy");
      }
    },
    [firstAsset, secondAsset, buyOrSell]
  );

  // WebSocket connection effect
  useEffect(() => {
    const ws = new WebSocket("wss://api.hyperliquid.xyz/ws");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "l2Book", coin: firstAsset },
        })
      );
      ws.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "l2Book", coin: secondAsset },
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      processOrderBookData(message);
    };

    return () => {
      ws.close();
    };
  }, [firstAsset, secondAsset, processOrderBookData]); // Remove buyOrSell from here

  const OrderRow = ({ price, size, side, total, maxTotal }) => {
    return (
      <div className="grid grid-cols-3 h-[23px] text-sm items-center relative my-[3px]">
        <div
          className={`absolute top-0 left-0 h-full ${
            side === "bid" ? "bg-[#50d2c1]" : "bg-[#ED7088]"
          }`}
          style={{ width: `${(total * 100) / maxTotal}%`, opacity: 0.15 }}
        />
        <span
          className={`font-mono pl-2 relative ${
            side === "bid" ? "text-[#50d2c1]" : "text-[#ED7088]"
          }`}>
          {Number(Number(price).toPrecision(5)).toLocaleString()}
        </span>
        <span className="relative font-mono text-right text-white">
          {Math.round(Number(size)).toLocaleString()}
        </span>
        <span className="relative pr-2 font-mono text-right text-gray-400">
          {Math.round(Number(total)).toLocaleString()}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#041318]">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${"text-white border-b-2 border-[#50d2c1]"}`}>
          Order Book
        </button>
      </div>

      <div className="flex flex-col ">
        <div className="bg-[#293233] px-2 py-1 text-sm flex justify-between text-gray-400">
          <span>BUY</span>
          <span>{buyOrSell === "buy" ? firstAsset : secondAsset}</span>
        </div>
        {/* Headers */}
        <div className="grid grid-cols-3 px-2 py-1 text-xs text-gray-400 border-b border-gray-800">
          <span className="pl-2">Price</span>
          <span className="text-right">Size (USD) </span>
          <span className="pr-2 text-right">Total (USD)</span>
        </div>
        {/* Asks */}
        <div className="flex-1 overflow-hidden">
          {orderBook.sell.map((ask, i) => (
            <OrderRow
              key={i}
              price={ask.price}
              size={ask.size}
              side="ask"
              total={ask.total}
              maxTotal={Math.max(...orderBook.sell.map((obj) => obj.total))}
            />
          ))}
        </div>

        {/* Spread */}
        <div className="bg-[#293233] px-2 py-1 text-sm flex justify-between text-gray-400">
          <span>SELL</span>
          <span>{buyOrSell === "buy" ? secondAsset : firstAsset}</span>
        </div>

        {/* Bids */}
        <div className="flex-1 overflow-hidden">
          {orderBook.buy.map((bid, i) => (
            <OrderRow
              key={i}
              price={bid.price}
              size={bid.size}
              side="bid"
              total={bid.total}
              maxTotal={Math.max(...orderBook.buy.map((obj) => obj.total))}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
