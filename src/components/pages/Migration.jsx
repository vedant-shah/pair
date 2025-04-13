import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { ethers } from "ethers";

const steps = [
  {
    id: 1,
    title: "Connect your wallet",
    description: "Connect your wallet to begin the migration process",
  },
  {
    id: 2,
    title: "Approve Builder Code",
    description: "Review and approve the builder code",
  },
  {
    id: 3,
    title: "Add your API Key",
    description: "Enter your API key for authentication",
  },
  {
    id: 4,
    title: "Review and Submit",
    description: "Review your migration details and submit",
  },
];

const approveBuilderCode = async (
  setIsBuilderApproved,
  onComplete,
  wallets,
  ready,
  authenticated
) => {
  try {
    if (!wallets.length || (ready && !authenticated)) {
      toast.error("No wallet found");
      return;
    }

    const providers = await wallets[0].getEthereumProvider();
    const provider = new ethers.BrowserProvider(providers.walletProvider);
    const signer = await provider.getSigner();
    const date = Date.now();
    const message = {
      type: "approveBuilderFee",
      hyperliquidChain: "Mainnet",
      signatureChainId: "0x1",
      maxFeeRate: "0.1%",
      builder: "0xB599581FD94D34FcFD7D99566d13eC6b27D9E3b0",
      nonce: date,
    };

    const domain = {
      name: "HyperliquidSignTransaction",
      version: "1",
      chainId: "0x1",
      verifyingContract: "0x0000000000000000000000000000000000000000",
    };

    const types = {
      "HyperliquidTransaction:ApproveBuilderFee": [
        { name: "hyperliquidChain", type: "string" },
        { name: "maxFeeRate", type: "string" },
        { name: "builder", type: "address" },
        { name: "nonce", type: "uint64" },
      ],
    };
    const signature = await signer.signTypedData(domain, types, message);
    const { r, s, v } = ethers.Signature.from(signature);

    const response = await fetch("https://api.hyperliquid.xyz/exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: message,
        nonce: date,
        signature: { r, s, v },
      }),
    });

    const data = await response.json();

    if (data.status === "ok") {
      // Update the stored user data with builder approval
      setIsBuilderApproved(true);
      toast.success("Builder code approved successfully");
      onComplete();
    } else {
      throw new Error("Failed to approve builder code");
    }
  } catch (error) {
    console.error("Error approving builder code:", error);
    toast.error(error.message || "Failed to approve builder code");
  }
};

const saveAPIKey = async (apiKey) => {
  const { getAccessToken } = usePrivy();

  console.log(apiKey);
  if (apiKey.length !== 66) {
    toast.error("Invalid API key");
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const response = await fetch("https://dev.peripair.trade/v1/api_key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: formData.walletName,
        apiPrivKey: formData.privateKey,
      }),
    });

    const data = await response.json();
    console.log(data);

    toast.success("API Wallet added successfully");
    setFormData({ walletName: "", privateKey: "" });
    // Invalidate and refetch API keys
    queryClient.invalidateQueries(["api-keys"]);
  } catch (error) {
    console.error("Error adding wallet:", error);
    toast.error("Failed to add wallet");
  } finally {
    setIsSubmitting(false);
  }
};

const StepContent = ({ step, onComplete }) => {
  const { ready, authenticated, login, user } = usePrivy();

  const { wallets } = useWallets();

  const [isBuilderApproved, setIsBuilderApproved] = useState(false);
  const [apiKey, setApiKey] = useState("");
  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <h2 className="text-xl font-semibold text-[#50d2c1]">
          Connect Your Wallet
        </h2>
        <img src="/mascot.png" alt="mascot" className="w-1/3" />
        <h1>Click the connect button on the navbar to connect your wallet. </h1>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <h2 className="text-xl font-semibold text-[#50d2c1]">
          Approve Builder Code
        </h2>

        <Button
          className="bg-[#50d2c1] text-[#041318]"
          onClick={() =>
            approveBuilderCode(
              setIsBuilderApproved,
              onComplete,
              wallets,
              ready,
              authenticated
            )
          }>
          Approve Builder Code
        </Button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <h2 className="text-xl font-semibold text-[#50d2c1]">
          Add your API Key
        </h2>
        <div className="flex flex-col items-center justify-center space-y-6">
          Please enter your API key for authentication. You can find your API
          key in the{" "}
          <a href="https://app.hyperliquid.xyz/API" className="text-[#50d2c1]">
            settings page
          </a>
        </div>
        <input
          className="w-[300px] px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
          placeholder="API Private Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <Button
          className="bg-[#50d2c1] text-[#041318]"
          onClick={() => saveAPIKey(apiKey)}>
          Submit
        </Button>
      </div>
    );
  }
  return null;
};

const Migration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { authenticated } = usePrivy();

  // Effect to auto-advance if wallet is already connected
  useEffect(() => {
    if (authenticated && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [authenticated]);

  const handleStepComplete = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  return (
    <div className="container px-10 py-8 mx-auto text-white">
      <h1 className="text-2xl text-center font-bold mb-8 text-[#50d2c1]">
        Migrate to Peri V2
      </h1>

      {/* Mobile Stepper (Horizontal) */}
      <div className="flex items-center justify-center mb-8 lg:hidden">
        <div className="flex items-center justify-between h-full">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn("flex flex-col items-center", "relative w-1/4")}>
              {step.id !== steps.length && (
                <div
                  className={cn(
                    "absolute top-4 -right-1/2 w-full h-[2px]",
                    currentStep > step.id ? "bg-[#50d2c1]" : "bg-gray-600"
                  )}
                />
              )}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  "border-2 transition-colors duration-200",
                  "relative z-10 bg-[#041318]",
                  currentStep >= step.id
                    ? "bg-[#50d2c1] border-[#50d2c1] text-[#041318]"
                    : "border-gray-600 text-gray-400"
                )}>
                {step.id}
              </div>
              <div className="hidden mt-2 text-xs text-center text-gray-400 sm:block">
                {step.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Stepper (Vertical) */}
      <div className="flex gap-12">
        <div className="hidden lg:block w-80">
          <div className="flex flex-col gap-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex gap-4 items-start relative",
                  "transition-colors duration-200"
                )}>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "border-2 shrink-0 transition-colors duration-200",
                    currentStep >= step.id
                      ? "bg-[#50d2c1] border-[#50d2c1] text-[#041318]"
                      : "border-gray-600 text-gray-400 bg-[#041318]"
                  )}>
                  {step.id}
                </div>
                <div className="flex flex-col">
                  <h3
                    className={cn(
                      "font-medium transition-colors duration-200",
                      currentStep >= step.id
                        ? "text-[#50d2c1]"
                        : "text-gray-400"
                    )}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                {index !== steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-4 top-8 w-[2px] h-16 transition-colors duration-200",
                      currentStep > step.id ? "bg-[#50d2c1]" : "bg-gray-600"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[400px] bg-[#041318] rounded-lg border border-gray-800 p-6">
          <StepContent step={currentStep} onComplete={handleStepComplete} />
        </div>
      </div>
    </div>
  );
};

export default Migration;
