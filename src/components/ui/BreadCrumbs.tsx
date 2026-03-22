"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  pacientes: "Pacientes",
  medicos: "Medicos",
  estudios: "Estudios",
  servicios: "Servicios",
  historial: "Historial",
  cortes: "Cortes",
  perfil: "Perfil",
  home: "Inicio",
  detalle: "Detalle",
  auth: "Acceso",
  login: "Iniciar sesion",
  register: "Registro",
  "forgot-password": "Recuperar contrasena",
  "new-password": "Nueva contrasena",
  "confirm-account": "Confirmar cuenta",
  google: "Google",
};

function formatLabel(segment: string): string {
  if (LABELS[segment]) {
    return LABELS[segment];
  }

  if (/^\d+$/.test(segment)) {
    return segment;
  }

  const normalized = segment.replace(/-/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

const Breadcrumbs = () => {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);
  const normalizedPaths = paths[0] === "home" ? paths.slice(1) : paths;
  const breadcrumbItems =
    normalizedPaths[0] === "cortes"
      ? [
          { path: "historial", href: "/historial" },
          { path: "cortes", href: "/cortes" },
        ]
      : normalizedPaths.map((path, index) => {
          const href =
            "/" +
            (paths[0] === "home"
              ? ["home", ...normalizedPaths.slice(0, index + 1)].join("/")
              : normalizedPaths.slice(0, index + 1).join("/"));

          return { path, href };
        });

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-y-2 text-sm text-gray-500">
        <li className="min-w-0">
          <Link
            href="/home"
            className="app-interactive-link inline-block max-w-full truncate font-medium transition-colors hover:text-red-500"
          >
            Inicio
          </Link>
        </li>

        {breadcrumbItems.map(({ path, href }, index) => {
          const label = formatLabel(path);
          const isLast = index === breadcrumbItems.length - 1;
          const nextPath = breadcrumbItems[index + 1]?.path;
          const isDetailParent = path === "detalle" && Boolean(nextPath);
          const isClickable = !isLast && !isDetailParent;

          return (
            <li key={href} className="flex min-w-0 items-center">
              <span className="mx-2 text-gray-300">/</span>

              {isClickable ? (
                <Link
                  href={href}
                  className="app-interactive-link inline-block max-w-[12rem] truncate transition-colors hover:text-red-500 sm:max-w-[16rem]"
                >
                  {label}
                </Link>
              ) : (
                <span
                  className={`inline-block max-w-[12rem] truncate ${
                    isLast ? "font-medium text-gray-900" : "text-gray-500"
                  } sm:max-w-[16rem]`}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
