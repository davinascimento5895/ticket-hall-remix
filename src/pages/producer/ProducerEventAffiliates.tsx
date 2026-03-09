import { Navigate, useParams } from "react-router-dom";

/**
 * Legacy affiliates page — redirects to the unified Promoters tab in the event panel.
 */
export default function ProducerEventAffiliates() {
  const { id } = useParams();
  return <Navigate to={`/producer/events/${id}/panel/promoters`} replace />;
}
