import { redirect } from "next/navigation";

export default function GooglePage() {
  redirect("/auth/login");
}
