import React from "react";
import ConnectModal from "../auth/ConnectModal";
import { toast } from "sonner";

const Navbar = () => {
  return (
    <nav className="bg-[#041318] border-b border-gray-800">
      <div className="px-4 mx-auto">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Pair-Bot" className="h-6" />
              <span className="font-medium text-white">Pair-Bot</span>
            </a>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            <a href="/trade" className="text-[#50d2c1] text-sm font-medium">
              Trade
            </a>
            <a
              href="/vaults"
              className="text-sm text-gray-400 hover:text-white">
              Vaults
            </a>
            <a
              href="/portfolio"
              className="text-sm text-gray-400 hover:text-white">
              Portfolio
            </a>
            <a
              href="/referrals"
              className="text-sm text-gray-400 hover:text-white">
              Referrals
            </a>
            <a
              href="/points"
              className="text-sm text-gray-400 hover:text-white">
              Points
            </a>
            <a
              href="/leaderboard"
              className="text-sm text-gray-400 hover:text-white">
              Leaderboard
            </a>
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
                More
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <ConnectModal />
            <button
              className="text-gray-400 hover:text-white"
              onClick={() => {
                toast.success("Coming soon");
              }}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </button>
            <button className="text-gray-400 hover:text-white">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
