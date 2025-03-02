import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Slider } from "../ui/slider";
import { toast } from "sonner";
import { usePrivy } from "@privy-io/react-auth";

const LEVERAGE_STORAGE_KEY = "peri-leverage-values";

const LeverageModal = React.memo(
  ({
    open,
    onOpenChange,
    leverage,
    setLeverage,
    meta,
    firstAsset,
    secondAsset,
  }) => {
    const prevOpenRef = useRef(open);
    const { user, authenticated } = usePrivy();

    // Helper functions for localStorage operations
    const getLeverageFromStorage = useCallback(
      (asset) => {
        // Skip storage operations if no user is logged in
        if (!authenticated || !user?.wallet?.address) return null;

        try {
          const stored = localStorage.getItem(LEVERAGE_STORAGE_KEY);
          if (!stored) return null;

          const values = JSON.parse(stored);
          return values[user.wallet.address]?.[asset] || null;
        } catch {
          return null;
        }
      },
      [authenticated, user?.wallet?.address]
    );

    const saveLeverageToStorage = useCallback(
      (asset, value) => {
        // Skip storage operations if no user is logged in
        if (!authenticated || !user?.wallet?.address) return;

        try {
          const stored = localStorage.getItem(LEVERAGE_STORAGE_KEY);
          const values = stored ? JSON.parse(stored) : {};

          values[user.wallet.address] = {
            ...values[user.wallet.address],
            [asset]: value,
          };

          localStorage.setItem(LEVERAGE_STORAGE_KEY, JSON.stringify(values));
        } catch (error) {
          console.error("Error saving leverage:", error);
        }
      },
      [authenticated, user?.wallet?.address]
    );

    // Memoize maxLeverage calculation
    const maxLeverage = useMemo(
      () => ({
        firstAsset: meta?.[firstAsset]?.Perp?.max_leverage || 1,
        secondAsset: meta?.[secondAsset]?.Perp?.max_leverage || 1,
      }),
      [meta, firstAsset, secondAsset]
    );

    // Get initial leverage values
    const getInitialLeverage = useCallback(
      (asset, maxLev) => {
        // If no user is logged in, just return default value without storing
        if (!authenticated || !user?.wallet?.address) {
          return Math.floor(maxLev / 2);
        }

        const stored = getLeverageFromStorage(asset);
        if (stored !== null) return stored;

        const defaultValue = Math.floor(maxLev / 2);
        saveLeverageToStorage(asset, defaultValue);
        return defaultValue;
      },
      [
        authenticated,
        user?.wallet?.address,
        getLeverageFromStorage,
        saveLeverageToStorage,
      ]
    );

    // Initialize tempLeverage state
    const [tempLeverage, setTempLeverage] = React.useState(() => ({
      firstAsset: getInitialLeverage(firstAsset, maxLeverage.firstAsset),
      secondAsset: getInitialLeverage(secondAsset, maxLeverage.secondAsset),
    }));

    // Update values when assets change
    useEffect(() => {
      setTempLeverage({
        firstAsset: getInitialLeverage(firstAsset, maxLeverage.firstAsset),
        secondAsset: getInitialLeverage(secondAsset, maxLeverage.secondAsset),
      });
    }, [firstAsset, secondAsset, maxLeverage, getInitialLeverage]);

    // Reset tempLeverage only when modal opens
    useEffect(() => {
      if (open && !prevOpenRef.current) {
        setTempLeverage({
          firstAsset: getInitialLeverage(firstAsset, maxLeverage.firstAsset),
          secondAsset: getInitialLeverage(secondAsset, maxLeverage.secondAsset),
        });
      }
      prevOpenRef.current = open;
    }, [open, firstAsset, secondAsset, maxLeverage, getInitialLeverage]);

    // Memoize handlers
    const handleFirstAssetChange = useCallback(([value]) => {
      setTempLeverage((prev) => ({ ...prev, firstAsset: value }));
    }, []);

    const handleSecondAssetChange = useCallback(([value]) => {
      setTempLeverage((prev) => ({ ...prev, secondAsset: value }));
    }, []);

    const handleConfirm = useCallback(() => {
      // Save both leverage values to storage if user is authenticated
      if (authenticated && user?.wallet?.address) {
        saveLeverageToStorage(firstAsset, tempLeverage.firstAsset);
        saveLeverageToStorage(secondAsset, tempLeverage.secondAsset);
      }

      setLeverage(tempLeverage);
      toast.success(
        `Leverage set to ${tempLeverage.firstAsset}x for ${firstAsset} and ${tempLeverage.secondAsset}x for ${secondAsset}`
      );
      onOpenChange(false);
    }, [
      authenticated,
      user?.wallet?.address,
      tempLeverage,
      firstAsset,
      secondAsset,
      saveLeverageToStorage,
      setLeverage,
      onOpenChange,
    ]);

    // Memoize the dialog content to prevent re-renders
    const dialogContent = useMemo(
      () => (
        <DialogContent
          className="bg-[#041318] border-gray-800 text-white"
          showCloseButton={true}>
          <DialogHeader>
            <DialogTitle className="text-lg font-normal">
              Adjust Leverage
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* First Asset Leverage */}
            <div>
              <p className="mb-1 text-sm text-gray-400">
                Control the leverage used for {firstAsset}. The maximum leverage
                is {maxLeverage.firstAsset}x.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[tempLeverage.firstAsset]}
                  onValueChange={handleFirstAssetChange}
                  max={maxLeverage.firstAsset}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <div className="bg-[#293233] px-3 py-1 rounded flex items-center gap-1">
                  <span className="text-white">{tempLeverage.firstAsset}</span>
                  <span className="text-gray-400">x</span>
                </div>
              </div>
            </div>

            {/* Second Asset Leverage */}
            <div>
              <p className="mb-1 text-sm text-gray-400">
                Control the leverage used for {secondAsset}. The maximum
                leverage is {maxLeverage.secondAsset}x.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={[tempLeverage.secondAsset]}
                  onValueChange={handleSecondAssetChange}
                  max={maxLeverage.secondAsset}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <div className="bg-[#293233] px-3 py-1 rounded flex items-center gap-1">
                  <span className="text-white">{tempLeverage.secondAsset}</span>
                  <span className="text-gray-400">x</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-red-400">
              Note that setting a higher leverage increases the risk of
              liquidation.
            </p>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-[#50d2c1] text-black py-2 rounded hover:bg-[#50d2c1]/90 font-medium">
            Confirm
          </button>
        </DialogContent>
      ),
      [
        firstAsset,
        secondAsset,
        maxLeverage,
        tempLeverage,
        handleFirstAssetChange,
        handleSecondAssetChange,
        handleConfirm,
      ]
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }
);

LeverageModal.displayName = "LeverageModal";

export default LeverageModal;
