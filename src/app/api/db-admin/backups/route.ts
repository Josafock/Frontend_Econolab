import { cookies } from "next/headers";

export async function POST(request: Request) {
  const token = (await cookies()).get("ECONOLAB_TOKEN")?.value;
  if (!token) {
    return Response.json({ errors: ["Tu sesion expiro. Inicia sesion nuevamente."] }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));

  const res = await fetch(`${process.env.API_URL}/db-admin/backups`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return Response.json(json, { status: res.status });
  }

  const body = await res.arrayBuffer();
  const headers = new Headers();
  headers.set("Content-Type", res.headers.get("content-type") ?? "application/octet-stream");
  headers.set(
    "Content-Disposition",
    res.headers.get("content-disposition") ?? 'attachment; filename="backup.sql"',
  );

  return new Response(body, {
    status: 200,
    headers,
  });
}
