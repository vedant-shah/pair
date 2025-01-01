const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

function generateMarketData() {
  return {
    type: "market_data",
    data: {
      pair: "SOL-USD",
      mark: 194.02 + (Math.random() * 2 - 1), // Random variation around 194.02
      oracle: 193.89 + (Math.random() * 2 - 1),
      change24h: -2.43 + (Math.random() * 0.5 - 0.25),
      changePercent24h: -1.24 + (Math.random() * 0.2 - 0.1),
      volume24h: 228453884.7 + Math.random() * 1000000,
      openInterest: 283928994.96 + Math.random() * 1000000,
      funding: 0.0013 + (Math.random() * 0.0002 - 0.0001),
      countdown: "00:27:00", // This should be properly managed with actual countdown
    },
  };
}

function generateOrderBookData() {
  const bids = Array.from({ length: 15 }, (_, i) => ({
    price: 193.5 - i * 0.1 + (Math.random() * 0.02 - 0.01),
    size: Math.random() * 1000 + 100,
  }));

  const asks = Array.from({ length: 15 }, (_, i) => ({
    price: 193.6 + i * 0.1 + (Math.random() * 0.02 - 0.01),
    size: Math.random() * 1000 + 100,
  }));

  return {
    type: "orderbook",
    data: { bids, asks },
  };
}

function generateTradeData() {
  return {
    type: "trade",
    data: {
      price: 193.55 + (Math.random() * 0.2 - 0.1),
      size: Math.random() * 100 + 10,
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      type: Math.random() > 0.5 ? "buy" : "sell",
    },
  };
}

wss.on("connection", function connection(ws) {
  console.log("New client connected");

  // Send initial market data
  ws.send(JSON.stringify(generateMarketData()));

  // Send market data every 1.5 seconds
  const marketInterval = setInterval(() => {
    ws.send(JSON.stringify(generateMarketData()));
  }, 1500);

  // Send order book updates every 500ms
  const orderBookInterval = setInterval(() => {
    ws.send(JSON.stringify(generateOrderBookData()));
  }, 500);

  // Send trades randomly (avg 1 per second)
  const tradeInterval = setInterval(() => {
    if (Math.random() < 0.5) {
      ws.send(JSON.stringify(generateTradeData()));
    }
  }, 200);

  ws.on("close", () => {
    clearInterval(marketInterval);
    clearInterval(orderBookInterval);
    clearInterval(tradeInterval);
    console.log("Client disconnected");
  });
});
