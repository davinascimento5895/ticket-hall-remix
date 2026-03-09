import { useState, useEffect } from "react";

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

export function useIBGEStates() {
  const [states, setStates] = useState<IBGEState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then((data) => setStates(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { states, loading };
}

export function useIBGECities(uf: string) {
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uf) {
      setCities([]);
      return;
    }
    setLoading(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uf]);

  return { cities, loading };
}
