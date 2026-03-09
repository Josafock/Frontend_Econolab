import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function getServiceId(context: RouteContext): Promise<number | null> {
  const resolved = await Promise.resolve(context.params);
  const parsed = Number.parseInt(String(resolved?.id ?? ''), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(_: Request, context: RouteContext) {
  const id = await getServiceId(context);
  if (!id) {
    return NextResponse.json({ message: 'Id de servicio invalido.' }, { status: 400 });
  }
  const token = (await cookies()).get('ECONOLAB_TOKEN')?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Tu sesion expiro. Inicia sesion nuevamente.' },
      { status: 401 },
    );
  }

  const apiUrl = `${process.env.API_URL}/services/${id}/receipt`;
  const upstream = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const payload = await upstream.text().catch(() => '');
    return NextResponse.json(
      { message: payload || 'No se pudo generar el recibo.' },
      { status: upstream.status },
    );
  }

  const pdf = await upstream.arrayBuffer();
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="recibo-${id}.pdf"`,
    },
  });
}
