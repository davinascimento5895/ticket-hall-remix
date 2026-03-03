export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Fetches address data from ViaCEP API.
 */
export const fetchAddress = async (cep: string): Promise<CepAddress | null> => {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch {
    return null;
  }
};

/**
 * Formats CEP as 00000-000
 */
export const formatCEP = (value: string): string => {
  const clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
};
