"use server";

import { cookies } from "next/headers";

export async function googleCallbackAction(token: string) {
  const cookieStore = await cookies();

  if (token) {
    cookieStore.set({
      name: "ECONOLAB_TOKEN",
      value: token,
      httpOnly: true,
      path: "/",
    });
  }

  return { ok: true };
}
