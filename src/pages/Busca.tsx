import { Navigate, useSearchParams } from "react-router-dom";

/**
 * Busca page now redirects to /eventos preserving query params.
 * This unifies the two search experiences into one.
 */
export default function Busca() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const target = q ? `/eventos?q=${encodeURIComponent(q)}` : "/eventos";
  return <Navigate to={target} replace />;
}
