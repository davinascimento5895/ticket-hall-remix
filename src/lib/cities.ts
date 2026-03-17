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
  { name: "São Paulo", state: "São Paulo", uf: "SP", population: 12_400_000, imageUrl: "/images/cities/sao-paulo.webp", featured: true },
  { name: "Rio de Janeiro", state: "Rio de Janeiro", uf: "RJ", population: 6_750_000, imageUrl: "/images/cities/rio-de-janeiro.webp", featured: true },
  { name: "Brasília", state: "Distrito Federal", uf: "DF", population: 3_100_000, imageUrl: "/images/cities/brasilia.webp", featured: true },
  { name: "Salvador", state: "Bahia", uf: "BA", population: 2_900_000, imageUrl: "/images/cities/salvador.webp", featured: true },
  { name: "Fortaleza", state: "Ceará", uf: "CE", population: 2_700_000, imageUrl: "/images/cities/fortaleza.webp", featured: false },
  { name: "Belo Horizonte", state: "Minas Gerais", uf: "MG", population: 2_530_000, imageUrl: "/images/cities/belo-horizonte.webp", featured: true },
  { name: "Manaus", state: "Amazonas", uf: "AM", population: 2_260_000, imageUrl: "/images/cities/manaus.webp", featured: false },
  { name: "Curitiba", state: "Paraná", uf: "PR", population: 1_970_000, imageUrl: "/images/cities/curitiba.webp", featured: true },
  { name: "Recife", state: "Pernambuco", uf: "PE", population: 1_660_000, imageUrl: "/images/cities/recife.webp", featured: true },
  { name: "Goiânia", state: "Goiás", uf: "GO", population: 1_560_000, imageUrl: "/images/cities/goiania.webp", featured: false },
  { name: "Porto Alegre", state: "Rio Grande do Sul", uf: "RS", population: 1_490_000, imageUrl: "/images/cities/porto-alegre.webp", featured: true },
  { name: "Belém", state: "Pará", uf: "PA", population: 1_500_000, imageUrl: "/images/cities/belem.webp", featured: false },
  { name: "São Luís", state: "Maranhão", uf: "MA", population: 1_110_000, imageUrl: "/images/cities/sao-luis.webp", featured: false },
  { name: "Maceió", state: "Alagoas", uf: "AL", population: 1_030_000, imageUrl: "/images/cities/maceio.webp", featured: false },
  { name: "Campo Grande", state: "Mato Grosso do Sul", uf: "MS", population: 920_000, imageUrl: "/images/cities/campo-grande.webp", featured: false },
  { name: "Teresina", state: "Piauí", uf: "PI", population: 870_000, imageUrl: "/images/cities/teresina.webp", featured: false },
  { name: "João Pessoa", state: "Paraíba", uf: "PB", population: 830_000, imageUrl: "/images/cities/joao-pessoa.webp", featured: false },
  { name: "Natal", state: "Rio Grande do Norte", uf: "RN", population: 810_000, imageUrl: "/images/cities/natal.webp", featured: false },
  { name: "Aracaju", state: "Sergipe", uf: "SE", population: 670_000, imageUrl: "/images/cities/aracaju.webp", featured: false },
  { name: "Cuiabá", state: "Mato Grosso", uf: "MT", population: 620_000, imageUrl: "/images/cities/cuiaba.webp", featured: false },
  { name: "Florianópolis", state: "Santa Catarina", uf: "SC", population: 510_000, imageUrl: "/images/cities/florianopolis.webp", featured: true },
  { name: "Porto Velho", state: "Rondônia", uf: "RO", population: 540_000, imageUrl: "/images/cities/porto-velho.webp", featured: false },
  { name: "Macapá", state: "Amapá", uf: "AP", population: 520_000, imageUrl: "/images/cities/macapa.webp", featured: false },
  { name: "Vitória", state: "Espírito Santo", uf: "ES", population: 370_000, imageUrl: "/images/cities/vitoria.webp", featured: false },
  { name: "Rio Branco", state: "Acre", uf: "AC", population: 420_000, imageUrl: "/images/cities/rio-branco.webp", featured: false },
  { name: "Boa Vista", state: "Roraima", uf: "RR", population: 420_000, imageUrl: "/images/cities/boa-vista.webp", featured: false },
  { name: "Palmas", state: "Tocantins", uf: "TO", population: 310_000, imageUrl: "/images/cities/palmas.webp", featured: false },
];

export const FEATURED_CAPITALS = BRAZILIAN_CAPITALS.filter((c) => c.featured);

export const MAIN_CAPITALS = BRAZILIAN_CAPITALS.filter((c) =>
  ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Brasília", "Salvador", "Recife", "Florianópolis"].includes(c.name)
);
