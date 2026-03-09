import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

type ServiceItemLike = { id: number };
type ServiceLike = { items?: ServiceItemLike[] };
type ResultLike = { id?: number };

export async function GET(_: Request, context: RouteContext) {
  const resolved = await Promise.resolve(context.params);
  const id = Number.parseInt(String(resolved?.id ?? ''), 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: 'Id de servicio invalido.' }, { status: 400 });
  }
  const token = (await cookies()).get('ECONOLAB_TOKEN')?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Tu sesion expiro. Inicia sesion nuevamente.' },
      { status: 401 },
    );
  }

  const authHeaders = { Authorization: `Bearer ${token}` };
  const serviceUrl = `${process.env.API_URL}/services/${id}`;
  const serviceRes = await fetch(serviceUrl, {
    headers: authHeaders,
    cache: 'no-store',
  });

  if (!serviceRes.ok) {
    const payload = await serviceRes.text().catch(() => '');
    return NextResponse.json(
      { message: payload || 'No se pudo obtener el servicio.' },
      { status: serviceRes.status },
    );
  }

  const service = (await serviceRes.json()) as ServiceLike;
  const firstItemId = service.items?.[0]?.id;

  if (!firstItemId) {
    return NextResponse.json(
      { message: 'Este servicio no tiene estudios asociados para generar resultados.' },
      { status: 400 },
    );
  }

  const resultByItemUrl = `${process.env.API_URL}/results/service-item/${firstItemId}`;
  const resultByItemRes = await fetch(resultByItemUrl, {
    headers: authHeaders,
    cache: 'no-store',
  });

  if (!resultByItemRes.ok) {
    const payload = await resultByItemRes.text().catch(() => '');
    return NextResponse.json(
      { message: payload || 'No se pudo obtener el resultado del servicio.' },
      { status: resultByItemRes.status },
    );
  }

  const result = (await resultByItemRes.json()) as ResultLike;
  if (!result.id) {
    return NextResponse.json(
      { message: 'No se pudo identificar el resultado para este servicio.' },
      { status: 400 },
    );
  }

  const pdfUrl = `${process.env.API_URL}/results/${result.id}/pdf`;
  const pdfRes = await fetch(pdfUrl, {
    headers: authHeaders,
    cache: 'no-store',
  });

  if (!pdfRes.ok) {
    const payload = await pdfRes.text().catch(() => '');
    return NextResponse.json(
      { message: payload || 'No se pudo generar el PDF de resultados.' },
      { status: pdfRes.status },
    );
  }

  const pdf = await pdfRes.arrayBuffer();
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="resultado-servicio-${id}.pdf"`,
    },
  });
}
