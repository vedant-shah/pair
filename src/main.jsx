import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        // Display email and wallet as login methods
        loginMethods: ["google", "wallet"],
        // Customize Privy's appearance in your app
        appearance: {
          theme: "dark",
          accentColor: import.meta.env.VITE_PRIVY_ACCENT_COLOR,
          logo: import.meta.env.VITE_PRIVY_HEADER_LOGO,
          walletList: import.meta.env.VITE_PRIVY_WALLET_LIST.split(","),
          landingHeader: import.meta.env.VITE_PRIVY_HEADER_TITLE,
          loginMessage: import.meta.env.VITE_PRIVY_LOGIN_MESSAGE,
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: "off",
        },
      }}>
      <App />
    </PrivyProvider>
  </QueryClientProvider>
);
