import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { Slider } from "../ui/slider";
import { toast } from "sonner";

const LeverageModal = ({
  open,
  onOpenChange,
  leverage,
  setLeverage,
  meta,
  firstAsset,
  secondAsset,
}) => {
  const maxLeverage = {
    firstAsset:
      meta?.universe.find((asset) => asset.name === firstAsset)?.maxLeverage ||
      1,
    secondAsset:
      meta?.universe.find((asset) => asset.name === secondAsset)?.maxLeverage ||
      1,
  };
  const [tempLeverage, setTempLeverage] = React.useState({
    firstAsset: Math.floor(maxLeverage.firstAsset / 2),
    secondAsset: Math.floor(maxLeverage.secondAsset / 2),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#041318] border-gray-800 text-white">
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
                onValueChange={([value]) =>
                  setTempLeverage((prev) => ({ ...prev, firstAsset: value }))
                }
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
              Control the leverage used for {secondAsset}. The maximum leverage
              is {maxLeverage.secondAsset}x.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[tempLeverage.secondAsset]}
                onValueChange={([value]) =>
                  setTempLeverage((prev) => ({ ...prev, secondAsset: value }))
                }
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

        <DialogClose asChild>
          <button
            onClick={() => {
              setLeverage(tempLeverage);
              toast.success(
                `Leverage set to ${tempLeverage.firstAsset}x for ${firstAsset} and ${tempLeverage.secondAsset}x for ${secondAsset}`
              );
            }}
            className="w-full bg-[#50d2c1] text-black py-2 rounded hover:bg-[#50d2c1]/90 font-medium">
            Confirm
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default LeverageModal;
