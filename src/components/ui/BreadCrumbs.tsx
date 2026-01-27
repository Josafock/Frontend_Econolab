"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Breadcrumbs = () => {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center text-sm text-gray-500">
        {/* Inicio */}
        <li>
          <Link
            href="/"
            className="hover:text-red-500 transition-colors"
          >
            Inicio
          </Link>
        </li>

        {paths.map((path, index) => {
          const href = "/" + paths.slice(0, index + 1).join("/");
          const label =
            path.charAt(0).toUpperCase() + path.slice(1);
          const isLast = index === paths.length - 1;

          return (
            <li key={href} className="flex items-center">
              {/* Separador */}
              <span className="mx-2 text-gray-400">›</span>

              {isLast ? (
                <span className="font-medium text-gray-900">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-red-500 transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
