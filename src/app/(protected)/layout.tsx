import ProtectedAppLayout from "@/components/ui/ProtectedAppLayout";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
