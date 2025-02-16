import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Slider } from "../ui/slider";
import { toast } from "sonner";

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

    // Memoize maxLeverage calculation
    const maxLeverage = useMemo(
      () => ({
        firstAsset: meta?.[firstAsset]?.Perp?.max_leverage || 1,
        secondAsset: meta?.[secondAsset]?.Perp?.max_leverage || 1,
      }),
      [meta, firstAsset, secondAsset]
    );

    // Memoize initial state calculation
    const initialLeverage = useMemo(
      () => ({
        firstAsset: Math.floor(maxLeverage.firstAsset / 2),
        secondAsset: Math.floor(maxLeverage.secondAsset / 2),
      }),
      [maxLeverage]
    );

    const [tempLeverage, setTempLeverage] = React.useState(initialLeverage);

    // Reset tempLeverage only when modal opens
    useEffect(() => {
      if (open && !prevOpenRef.current) {
        setTempLeverage(initialLeverage);
      }
      prevOpenRef.current = open;
    }, [open, initialLeverage]);

    // Memoize handlers
    const handleFirstAssetChange = useCallback(([value]) => {
      setTempLeverage((prev) => ({ ...prev, firstAsset: value }));
    }, []);

    const handleSecondAssetChange = useCallback(([value]) => {
      setTempLeverage((prev) => ({ ...prev, secondAsset: value }));
    }, []);

    const handleConfirm = useCallback(() => {
      setLeverage(tempLeverage);
      toast.success(
        `Leverage set to ${tempLeverage.firstAsset}x for ${firstAsset} and ${tempLeverage.secondAsset}x for ${secondAsset}`
      );
      onOpenChange(false);
    }, [tempLeverage, firstAsset, secondAsset, setLeverage, onOpenChange]);

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
