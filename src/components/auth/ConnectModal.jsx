import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { usePrivy } from "@privy-io/react-auth";

const ConnectModal = () => {
  const { ready, authenticated, login, user, logout } = usePrivy();
  const disableLogin = !ready || (ready && authenticated);

  ready && authenticated && console.log(user);

  return (
    <>
      {!authenticated ? (
        <Button
          className="bg-[#50d2c1] text-black px-4 py-1.5 rounded text-sm font-medium hover:bg-[#50d2c1]/90"
          disabled={disableLogin}
          onClick={login}>
          Connect
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2">
            {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-2)}
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"></path>
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel className="flex items-center justify-between gap-3">
              {user.wallet.address.slice(0, 6)}...
              {user.wallet.address.slice(-2)}
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                onClick={() => {
                  //copy the address to clipboard
                  navigator.clipboard.writeText(user.wallet.address);
                  // toast.success("Address copied to clipboard");
                }}
                className="cursor-pointer"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z"
                  fill="#50d2c1"
                  fillRule="evenodd"
                  clipRule="evenodd"></path>
              </svg>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-[#50d2c1]"
              onClick={() => {
                logout();
                toast.success("Logged out successfully", {
                  duration: 3000,
                });
              }}>
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};

export default ConnectModal;
