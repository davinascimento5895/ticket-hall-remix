import { useState, useEffect } from "react";

interface CityDetection {
  city: string | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
}

export function useCityDetection(): CityDetection {
  const [city, setCity] = useState<string | null>(() => {
    return localStorage.getItem("tickethall_detected_city");
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`
          );
          const data = await res.json();
          const detected =
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality ||
            data.address?.state ||
            null;
          if (detected) {
            setCity(detected);
            localStorage.setItem("tickethall_detected_city", detected);
          }
        } catch {
          setError("Não foi possível detectar a cidade");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Permissão de localização negada");
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  return { city, loading, error, requestLocation };
}
