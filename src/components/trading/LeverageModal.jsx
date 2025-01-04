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

const LeverageModal = ({ open, onOpenChange, leverage, setLeverage }) => {
  const [tempLeverage, setTempLeverage] = React.useState(leverage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#041318] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-normal">
            Adjust Leverage
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="mb-1 text-sm text-gray-400">
            Control the leverage used for Long/Short. The maximum leverage is
            50x.
          </p>
          <p className="mb-6 text-sm text-red-400">
            Note that setting a higher leverage increases the risk of
            liquidation.
          </p>

          <div className="flex items-center gap-4">
            <Slider
              value={[tempLeverage]}
              onValueChange={([value]) => setTempLeverage(value)}
              max={50}
              min={1}
              step={1}
              className="flex-1"
            />
            <div className="bg-[#293233] px-3 py-1 rounded flex items-center gap-1">
              <span className="text-white">{tempLeverage}</span>
              <span className="text-gray-400">x</span>
            </div>
          </div>
        </div>

        <DialogClose asChild>
          <button
            onClick={() => {
              setLeverage(tempLeverage);
              toast.success("Leverage set to " + tempLeverage + "x");
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
