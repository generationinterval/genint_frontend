import React from "react";
import { NavBar } from "@/components/shared/NavBar/NavBar";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/shared/SideBarContext/SideBarContext";

export const Layout: React.FC<NonNullable<unknown>> = () => {
  return (
    <SidebarProvider>
      <NavBar />
      <Outlet />
    </SidebarProvider>
  );
};
