import React from "react";
import StaffLayoutClient from "../../../components/StaffLayoutClient";

export const metadata = {
  title: "Staff Portal",
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffLayoutClient>{children}</StaffLayoutClient>;
}
