/**
 * Brazilian state capitals ordered by population (2023 IBGE estimates).
 * Featured cities use locally generated images; others use placeholder.
 */

export interface BrazilianCapital {
  name: string;
  state: string;
  uf: string;
  population: number;
  imageUrl: string;
  featured: boolean;
}

export const BRAZILIAN_CAPITALS: BrazilianCapital[] = [
  { name: "São Paulo", state: "São Paulo", uf: "SP", population: 12_400_000, imageUrl: "/images/cities/belo-horizonte.jpg", featured: true },
  { name: "Rio de Janeiro", state: "Rio de Janeiro", uf: "RJ", population: 6_750_000, imageUrl: "/images/cities/aracaju.webp", featured: true },
  { name: "Brasília", state: "Distrito Federal", uf: "DF", population: 3_100_000, imageUrl: "/images/cities/brasilia.jpg", featured: true },
  { name: "Salvador", state: "Bahia", uf: "BA", population: 2_900_000, imageUrl: "/images/cities/salvador.jpg", featured: true },
  { name: "Fortaleza", state: "Ceará", uf: "CE", population: 2_700_000, imageUrl: "/images/cities/fortaleza.jpg", featured: false },
  { name: "Belo Horizonte", state: "Minas Gerais", uf: "MG", population: 2_530_000, imageUrl: "/images/cities/belo-horizonte.jpg", featured: true },
  { name: "Manaus", state: "Amazonas", uf: "AM", population: 2_260_000, imageUrl: "/images/cities/manaus.jpg", featured: false },
  { name: "Curitiba", state: "Paraná", uf: "PR", population: 1_970_000, imageUrl: "/images/cities/curitiba.jpg", featured: true },
  { name: "Recife", state: "Pernambuco", uf: "PE", population: 1_660_000, imageUrl: "/images/cities/recife.jpg", featured: true },
  { name: "Goiânia", state: "Goiás", uf: "GO", population: 1_560_000, imageUrl: "/images/cities/goiania.jpg", featured: false },
  { name: "Porto Alegre", state: "Rio Grande do Sul", uf: "RS", population: 1_490_000, imageUrl: "/images/cities/porto-alegre.jpg", featured: true },
  { name: "Belém", state: "Pará", uf: "PA", population: 1_500_000, imageUrl: "/images/cities/belem.jpg", featured: false },
  { name: "São Luís", state: "Maranhão", uf: "MA", population: 1_110_000, imageUrl: "/images/cities/salvador.jpg", featured: false },
  { name: "Maceió", state: "Alagoas", uf: "AL", population: 1_030_000, imageUrl: "/images/cities/aracaju.webp", featured: false },
  { name: "Campo Grande", state: "Mato Grosso do Sul", uf: "MS", population: 920_000, imageUrl: "/images/cities/campo-grande.jpg", featured: false },
  { name: "Teresina", state: "Piauí", uf: "PI", population: 870_000, imageUrl: "/images/cities/fortaleza.jpg", featured: false },
  { name: "João Pessoa", state: "Paraíba", uf: "PB", population: 830_000, imageUrl: "/images/cities/joao-pessoa.jpg", featured: false },
  { name: "Natal", state: "Rio Grande do Norte", uf: "RN", population: 810_000, imageUrl: "/images/cities/fortaleza.jpg", featured: false },
  { name: "Aracaju", state: "Sergipe", uf: "SE", population: 670_000, imageUrl: "/images/cities/aracaju.webp", featured: false },
  { name: "Cuiabá", state: "Mato Grosso", uf: "MT", population: 620_000, imageUrl: "/images/cities/cuiaba.jpg", featured: false },
  { name: "Florianópolis", state: "Santa Catarina", uf: "SC", population: 510_000, imageUrl: "/images/cities/florianopolis.jpg", featured: true },
  { name: "Porto Velho", state: "Rondônia", uf: "RO", population: 540_000, imageUrl: "/images/cities/belem.jpg", featured: false },
  { name: "Macapá", state: "Amapá", uf: "AP", population: 520_000, imageUrl: "/images/cities/belem.jpg", featured: false },
  { name: "Vitória", state: "Espírito Santo", uf: "ES", population: 370_000, imageUrl: "/images/cities/florianopolis.jpg", featured: false },
  { name: "Rio Branco", state: "Acre", uf: "AC", population: 420_000, imageUrl: "/images/cities/belem.jpg", featured: false },
  { name: "Boa Vista", state: "Roraima", uf: "RR", population: 420_000, imageUrl: "/images/cities/boa-vista.jpg", featured: false },
  { name: "Palmas", state: "Tocantins", uf: "TO", population: 310_000, imageUrl: "/images/cities/brasilia.jpg", featured: false },
];

export const FEATURED_CAPITALS = BRAZILIAN_CAPITALS.filter((c) => c.featured);

export const MAIN_CAPITALS = BRAZILIAN_CAPITALS.filter((c) =>
  ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Brasília", "Salvador", "Recife", "Florianópolis"].includes(c.name)
);
