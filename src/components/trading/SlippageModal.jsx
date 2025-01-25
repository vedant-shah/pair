import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";

const SlippageModal = ({ open, onOpenChange, slippage, setSlippage }) => {
  const [tempSlippage, setTempSlippage] = React.useState(slippage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#041318] border-gray-800 text-white"
        showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-lg font-normal">
            Adjust Max Slippage
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-xs text-gray-400">
            Max slippage only affects market orders placed from the order form.
            Closing positions will use max slippage of 8% and market TP/SL
            orders will use max slippage of 10%.
          </p>

          <div className="relative">
            <input
              type="text"
              value={tempSlippage}
              onChange={(e) => setTempSlippage(e.target.value)}
              placeholder="1.00"
              className="w-full px-3 py-2 bg-[#041318] border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#50d2c1] text-xs"
            />
            <span className="absolute text-xs text-gray-400 -translate-y-1/2 right-3 top-1/2">
              %
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setSlippage(tempSlippage);
            toast.success(`Max slippage set to ${tempSlippage}%`);
            onOpenChange(false);
          }}
          className="w-full bg-[#50d2c1] text-black py-2 rounded hover:bg-[#50d2c1]/90 font-medium text-xs">
          Confirm
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default SlippageModal;
