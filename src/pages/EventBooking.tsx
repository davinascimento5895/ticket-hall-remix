import { useParams, Navigate } from "react-router-dom";

/**
 * Legacy booking route — redirects to the event detail page with the tickets tab active.
 * All purchases now go through the unified cart → checkout flow which collects
 * attendee data (name, email, CPF) for every ticket.
 */
export default function EventBooking() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/eventos/${slug}?tab=tickets`} replace />;
}
