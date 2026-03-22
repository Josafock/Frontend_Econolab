import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio - Econolab",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return children;
}
