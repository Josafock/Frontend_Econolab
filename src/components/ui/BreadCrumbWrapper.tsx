"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Breadcrumbs from "./BreadCrumbs";
import BreadcrumbSkeleton from "./BreadCrumbSkeleton";

const BreadcrumbWrapper = () => {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 300); // delay suave

    return () => clearTimeout(timer);
  }, [pathname]);

  return loading ? <BreadcrumbSkeleton /> : <Breadcrumbs />;
};

export default BreadcrumbWrapper;
