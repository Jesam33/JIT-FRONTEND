import React from "react";
import StudentLayoutClient from "../../../components/StudentLayoutClient";

export const metadata = {
  title: "Student Portal",
};

export default function StudentAppLayout({ children }: { children: React.ReactNode }) {
  return <StudentLayoutClient>{children}</StudentLayoutClient>;
}
