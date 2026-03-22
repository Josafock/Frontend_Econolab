import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const payload = await response.text().catch(() => "");
  if (!payload) return fallback;

  try {
    const parsed = JSON.parse(payload) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message[0] ?? fallback;
    if (
      typeof parsed.message === "string" &&
      parsed.message.trim().length > 0
    ) {
      return parsed.message;
    }
  } catch {
    return payload;
  }

  return fallback;
}

export async function GET(request: Request, context: RouteContext) {
  const resolved = await Promise.resolve(context.params);
  const id = Number.parseInt(String(resolved?.id ?? ""), 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { message: "Id de servicio invalido." },
      { status: 400 },
    );
  }
  const token = (await cookies()).get("ECONOLAB_TOKEN")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Tu sesion expiro. Inicia sesion nuevamente." },
      { status: 401 },
    );
  }

  const authHeaders = { Authorization: `Bearer ${token}` };
  const requestUrl = new URL(request.url);
  const suffix = requestUrl.search ? requestUrl.search : "";
  const pdfUrl = `${process.env.API_URL}/results/service-order/${id}/pdf${suffix}`;
  const pdfRes = await fetch(pdfUrl, {
    headers: authHeaders,
    cache: "no-store",
  });

  if (!pdfRes.ok) {
    return NextResponse.json(
      {
        message: await readErrorMessage(
          pdfRes,
          "No se pudo generar el PDF de resultados.",
        ),
      },
      { status: pdfRes.status },
    );
  }

  const pdf = await pdfRes.arrayBuffer();
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="resultado-servicio-${id}.pdf"`,
    },
  });
}
