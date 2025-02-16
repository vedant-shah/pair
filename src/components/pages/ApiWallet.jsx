import React, { useState, useEffect } from "react";
import BackLines from "../../../public/back_lines.svg";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Navbar from "../layout/Navbar";
import {
  IoArrowBack,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCopyOutline,
} from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";

function ApiWallet() {
  const [formData, setFormData] = useState({
    walletName: "",
    privateKey: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInputPassword, setShowInputPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ready && !authenticated) {
      navigate("/");
    }
  }, [ready, authenticated, navigate]);

  // Query for fetching API keys
  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ["api-keys", user?.wallet?.address],
    queryFn: async () => {
      if (!authenticated || !user?.wallet?.address) return [];
      const accessToken = await getAccessToken();
      const response = await fetch("https://dev.peripair.trade/v1/api_keys", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.json();
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.walletName || !formData.privateKey) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!window.ethereum) {
      return;
    }

    await window.ethereum.send("eth_requestAccounts");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(
      JSON.stringify(
        {
          name: formData.walletName,
          api_key: formData.privateKey,
          nonce: Date.now(),
        },
        null,
        "\t"
      )
    );
    const address = await signer.getAddress();

    // return;
    setIsSubmitting(true);
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

  const handleMakeDefault = async (walletId) => {
    try {
      const accessToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("privy-accessToken="))
        ?.split("=")[1];

      const response = await fetch(
        `https://dev.peripair.trade/v1/set_default_api_key`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: walletId,
          }),
        }
      );
      const res = await response.json();
      toast.success("Default wallet updated");
      // Invalidate and refetch API keys
      queryClient.invalidateQueries(["api-keys"]);
    } catch (error) {
      console.error("Error setting default wallet:", error);
      toast.error("Failed to set default wallet");
    }
  };

  const handleRemove = async (walletId) => {
    try {
      const accessToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("privy-accessToken="))
        ?.split("=")[1];
      const response = await fetch(`https://dev.peripair.trade/v1/api_key`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: walletId,
        }),
      });
      const res = await response.json();
      toast.success("Wallet removed successfully");
      // Invalidate and refetch API keys
      queryClient.invalidateQueries(["api-keys"]);
    } catch (error) {
      console.error("Error removing wallet:", error);
      toast.error("Failed to remove wallet");
    }
  };

  const handleCopyPrivateKey = (walletId) => {
    navigator.clipboard.writeText(walletId).then(() => {
      toast.success("Wallet ID copied to clipboard");
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#041318]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#041318]">
      <div className="relative">
        <img
          src={BackLines}
          alt="backlines"
          className="fixed inset-0 w-full h-full bg-cover opacity-50"
        />
        <div className="relative z-10">
          <Navbar />
          <div className="container max-w-3xl px-4 py-16 mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 mb-8 text-gray-400 hover:text-white">
              <IoArrowBack className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <h2 className="mb-8 text-2xl font-medium text-white">
              Add New API Key
            </h2>
            {/* Form Section */}
            <div className="flex flex-col items-center mb-16">
              <p className="mb-12 text-gray-400">
                API wallets (also known as agent wallets) can perform actions on
                behalf of your account without having withdrawal permissions.
                You can create one{" "}
                <a
                  href="https://app.hyperliquid.xyz/API"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#50d2c1] hover:text-[#50d2c1]/80 underline">
                  here
                </a>
                .
              </p>
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-6">
                <div>
                  <label className="block mb-2 text-sm text-gray-400">
                    Key Name
                  </label>
                  <input
                    type="text"
                    name="walletName"
                    value={formData.walletName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-sm"
                    placeholder="Enter key name"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-400">
                    Private Key
                  </label>
                  <div className="relative">
                    <input
                      type={showInputPassword ? "text" : "password"}
                      name="privateKey"
                      value={formData.privateKey}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-sm"
                      placeholder="Enter private key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowInputPassword(!showInputPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-white">
                      {showInputPassword ? (
                        <IoEyeOffOutline className="w-5 h-5" />
                      ) : (
                        <IoEyeOutline className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    !formData.walletName || !formData.privateKey || isSubmitting
                  }
                  className="w-full py-6 bg-[#50d2c1] text-black hover:bg-[#50d2c1]/90 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? "Adding..." : "Add API Key"}
                </Button>
              </form>
            </div>

            {/* Table Section */}
            <div>
              <h2 className="mb-8 text-2xl font-medium text-white">
                Your API Keys
              </h2>
              <div className="overflow-hidden border border-gray-800 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-gray-400">Name</TableHead>
                      <TableHead className="text-right text-gray-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.map((wallet) => (
                      <TableRow
                        key={wallet.id}
                        className="hover:bg-transparent">
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            {wallet.name}
                            {wallet.isDefault && (
                              <span className="px-2 py-0.5 text-xs bg-[#50d2c1]/10 text-[#50d2c1] rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          {!wallet.isDefault && (
                            <Button
                              onClick={() => handleMakeDefault(wallet.id)}
                              variant="outline"
                              className="text-[#50d2c1] border-[#50d2c1] hover:bg-[#50d2c1]/10">
                              Make Default
                            </Button>
                          )}
                          <Button
                            onClick={() => handleRemove(wallet.id)}
                            variant="outline"
                            className="text-[#ED7088] border-[#ED7088] hover:bg-[#ED7088]/10">
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiWallet;
