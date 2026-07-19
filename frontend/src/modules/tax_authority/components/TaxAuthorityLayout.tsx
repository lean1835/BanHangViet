import React from "react";
import { Outlet } from "react-router-dom";
import { TaxAuthorityHeader } from "./TaxAuthorityHeader";

export const TaxAuthorityLayout: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <TaxAuthorityHeader />
      <Outlet />
    </div>
  );
};

export default TaxAuthorityLayout;
