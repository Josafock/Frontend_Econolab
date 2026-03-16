import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function getCutId(context: RouteContext): Promise<number | null> {
  const resolved = await Promise.resolve(context.params);
  const parsed = Number.parseInt(String(resolved?.id ?? ''), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(_: Request, context: RouteContext) {
  const id = await getCutId(context);
  if (!id) {
    return NextResponse.json({ message: 'Id de corte invalido.' }, { status: 400 });
  }

  const token = (await cookies()).get('ECONOLAB_TOKEN')?.value;
  if (!token) {
    return NextResponse.json(
      { message: 'Tu sesion expiro. Inicia sesion nuevamente.' },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${process.env.API_URL}/history/daily-cuts/${id}/export`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const payload = await upstream.text().catch(() => '');
    return NextResponse.json(
      { message: payload || 'No se pudo exportar el corte.' },
      { status: upstream.status },
    );
  }

  const csv = await upstream.arrayBuffer();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="corte-dia-${id}.csv"`,
    },
  });
}
