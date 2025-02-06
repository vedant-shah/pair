import React from "react";

const RestrictedAccess = () => {
  return (
    <div className="min-h-screen bg-[#041318] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#041318] p-8 rounded-lg  text-center">
        <img src="/mascot.png" alt="mascot" className="mx-auto mb-6 " />
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-white">
          Access Denied
        </h1>
        <p className="text-sm leading-relaxed text-gray-400">
          Our services are currently sipping margaritas on a beach far, far away
          from your region. It's not you, it's the regulations. (Actually, it's
          the regulations.) Sorry but our services are not available in the US
          and Hong Kong.
        </p>
      </div>
    </div>
  );
};

export default RestrictedAccess;
