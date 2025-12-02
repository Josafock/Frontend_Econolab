import { NextResponse } from "next/server";

export async function GET() {
  const apiUrl = process.env.API_URL; // 👈 aquí SÍ existe
  if (!apiUrl) {
    return NextResponse.json(
      { error: "API_URL no configurada" },
      { status: 500 }
    );
  }

  // Redirige al backend Nest
  console.log("Redirigiendo a:", apiUrl);
  console.log("Redirigiendo a:", `${apiUrl}/auth/google`);
  return NextResponse.redirect(`${apiUrl}/auth/google`);
}
