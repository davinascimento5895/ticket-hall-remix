import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";

const popularCities = [
  "São Paulo, SP",
  "Rio de Janeiro, RJ",
  "Belo Horizonte, MG",
  "Curitiba, PR",
  "Porto Alegre, RS",
  "Salvador, BA",
  "Brasília, DF",
  "Fortaleza, CE",
  "Recife, PE",
  "Goiânia, GO",
];

export default function PerfilCidade() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = search
    ? popularCities.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      )
    : popularCities;

  const handleSelect = (city: string) => {
    setSelected(city);
    toast.success(`Cidade alterada para ${city}`);
  };

  return (
    <>
      <SEOHead title="Cidade | TicketHall" description="Selecione sua cidade" />

      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3 md:hidden">
          <button onClick={() => navigate("/meu-perfil")} className="p-1" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-center flex-1 text-lg font-semibold font-[var(--font-display)]">
            Cidade
          </h1>
          <div className="w-6" />
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 md:py-12 space-y-4">
          <Input
            placeholder="Buscar cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-muted/50 border-0 focus-visible:ring-1"
          />

          <div className="space-y-1">
            {filtered.map((city) => (
              <button
                key={city}
                onClick={() => handleSelect(city)}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors text-left ${
                  selected === city
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50 text-foreground"
                }`}
              >
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{city}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
