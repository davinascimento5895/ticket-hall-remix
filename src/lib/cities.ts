/**
 * Brazilian state capitals ordered by population (2023 IBGE estimates).
 * Images from Unsplash — landmarks of each city.
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
  { name: "São Paulo", state: "São Paulo", uf: "SP", population: 12_400_000, imageUrl: "https://images.unsplash.com/photo-1543059080-f9b1272213d5?w=600&q=80", featured: true },
  { name: "Rio de Janeiro", state: "Rio de Janeiro", uf: "RJ", population: 6_750_000, imageUrl: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&q=80", featured: true },
  { name: "Brasília", state: "Distrito Federal", uf: "DF", population: 3_100_000, imageUrl: "https://images.unsplash.com/photo-1593547517741-8b5e53378507?w=600&q=80", featured: true },
  { name: "Salvador", state: "Bahia", uf: "BA", population: 2_900_000, imageUrl: "https://images.unsplash.com/photo-1551614707-0e28e0e3f2c6?w=600&q=80", featured: true },
  { name: "Fortaleza", state: "Ceará", uf: "CE", population: 2_700_000, imageUrl: "https://images.unsplash.com/photo-1611516491426-03025e6043c8?w=600&q=80", featured: false },
  { name: "Belo Horizonte", state: "Minas Gerais", uf: "MG", population: 2_530_000, imageUrl: "https://images.unsplash.com/photo-1617396900799-f4ec2b43c7ae?w=600&q=80", featured: true },
  { name: "Manaus", state: "Amazonas", uf: "AM", population: 2_260_000, imageUrl: "https://images.unsplash.com/photo-1619546952812-520e98064a52?w=600&q=80", featured: false },
  { name: "Curitiba", state: "Paraná", uf: "PR", population: 1_970_000, imageUrl: "https://images.unsplash.com/photo-1598301257942-e6bde1d2149b?w=600&q=80", featured: true },
  { name: "Recife", state: "Pernambuco", uf: "PE", population: 1_660_000, imageUrl: "https://images.unsplash.com/photo-1611515742835-8a53752e914d?w=600&q=80", featured: true },
  { name: "Goiânia", state: "Goiás", uf: "GO", population: 1_560_000, imageUrl: "https://images.unsplash.com/photo-1612891350573-9b5b3e484d43?w=600&q=80", featured: false },
  { name: "Porto Alegre", state: "Rio Grande do Sul", uf: "RS", population: 1_490_000, imageUrl: "https://images.unsplash.com/photo-1589550325971-8b25d7b9140c?w=600&q=80", featured: true },
  { name: "Belém", state: "Pará", uf: "PA", population: 1_500_000, imageUrl: "https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=600&q=80", featured: false },
  { name: "São Luís", state: "Maranhão", uf: "MA", population: 1_110_000, imageUrl: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=600&q=80", featured: false },
  { name: "Maceió", state: "Alagoas", uf: "AL", population: 1_030_000, imageUrl: "https://images.unsplash.com/photo-1614359202485-3194e02e7f3b?w=600&q=80", featured: false },
  { name: "Campo Grande", state: "Mato Grosso do Sul", uf: "MS", population: 920_000, imageUrl: "https://images.unsplash.com/photo-1614098015864-91de14310c81?w=600&q=80", featured: false },
  { name: "Teresina", state: "Piauí", uf: "PI", population: 870_000, imageUrl: "https://images.unsplash.com/photo-1612348519408-82a5c04f0b90?w=600&q=80", featured: false },
  { name: "João Pessoa", state: "Paraíba", uf: "PB", population: 830_000, imageUrl: "https://images.unsplash.com/photo-1615818499660-30bb5816e1c7?w=600&q=80", featured: false },
  { name: "Natal", state: "Rio Grande do Norte", uf: "RN", population: 810_000, imageUrl: "https://images.unsplash.com/photo-1611848531613-e0bcdd91c4f6?w=600&q=80", featured: false },
  { name: "Aracaju", state: "Sergipe", uf: "SE", population: 670_000, imageUrl: "https://images.unsplash.com/photo-1617825295690-28b2d4bd9d56?w=600&q=80", featured: false },
  { name: "Cuiabá", state: "Mato Grosso", uf: "MT", population: 620_000, imageUrl: "https://images.unsplash.com/photo-1612190675399-4264e5df57f9?w=600&q=80", featured: false },
  { name: "Florianópolis", state: "Santa Catarina", uf: "SC", population: 510_000, imageUrl: "https://images.unsplash.com/photo-1588867702719-969c8ac733d6?w=600&q=80", featured: true },
  { name: "Porto Velho", state: "Rondônia", uf: "RO", population: 540_000, imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", featured: false },
  { name: "Macapá", state: "Amapá", uf: "AP", population: 520_000, imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80", featured: false },
  { name: "Vitória", state: "Espírito Santo", uf: "ES", population: 370_000, imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", featured: false },
  { name: "Rio Branco", state: "Acre", uf: "AC", population: 420_000, imageUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&q=80", featured: false },
  { name: "Boa Vista", state: "Roraima", uf: "RR", population: 420_000, imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80", featured: false },
  { name: "Palmas", state: "Tocantins", uf: "TO", population: 310_000, imageUrl: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&q=80", featured: false },
];

export const FEATURED_CAPITALS = BRAZILIAN_CAPITALS.filter((c) => c.featured);

export const MAIN_CAPITALS = BRAZILIAN_CAPITALS.filter((c) =>
  ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Brasília", "Salvador", "Recife", "Florianópolis"].includes(c.name)
);
