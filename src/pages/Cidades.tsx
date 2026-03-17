import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { SEOHead } from "@/components/SEOHead";
import { SearchBar } from "@/components/SearchBar";
import { MAIN_CAPITALS, BRAZILIAN_CAPITALS } from "@/lib/cities";
import { useIBGEStates, useIBGECities } from "@/hooks/useIBGELocations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function Cidades() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUF, setSelectedUF] = useState("");
  const { states } = useIBGEStates();
  const { cities: ibgeCities, loading: citiesLoading } = useIBGECities(selectedUF);

  const filteredCapitals = searchQuery
    ? BRAZILIAN_CAPITALS.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.state.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : BRAZILIAN_CAPITALS;

  return (
    <>
      <SEOHead
        title="Cidades - Eventos por cidade"
        description="Encontre eventos nas principais cidades do Brasil. São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba e muito mais."
      />

      <div className="container pt-24 pb-16">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar variant="page" placeholder="Buscar eventos em qualquer cidade..." className="max-w-2xl" />
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Cidades</h1>
        <p className="text-muted-foreground mb-8">Encontre eventos na sua cidade</p>

        {/* Featured capitals */}
        <section className="mb-12">
          <h2 className="font-display text-lg font-semibold mb-4 text-foreground">Principais capitais</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {MAIN_CAPITALS.map((city) => (
              <Link
                key={city.name}
                to={`/eventos?cidade=${encodeURIComponent(city.name)}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-border"
              >
                <img
                  src={city.imageUrl}
                  alt={`Eventos em ${city.name}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-semibold text-sm md:text-base">{city.name}</h3>
                  <p className="text-white/60 text-xs">{city.state}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Search by state >> city */}
        <section className="mb-12">
          <h2 className="font-display text-lg font-semibold mb-4 text-foreground">Buscar por estado e cidade</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mb-6">
            <Select value={selectedUF} onValueChange={(v) => { setSelectedUF(v); setSearchQuery(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.sigla} value={s.sigla}>{s.nome} ({s.sigla})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedUF && (
              <div>
                  <SearchInput
                    placeholder="Pesquisar cidade..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                {/* Combobox dropdown */}
                {ibgeCities && ibgeCities.length > 0 && (
                  <div className="absolute z-50 mt-2 w-full max-h-64 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
                    {ibgeCities
                      .filter((c) => !searchQuery || c.nome.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 200)
                      .map((city) => (
                        <Link
                          key={city.id}
                          to={`/eventos?cidade=${encodeURIComponent(city.nome)}&estado=${selectedUF}`}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/40 hover:text-accent-foreground",
                          )}
                        >
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{city.nome}</span>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Removed grid of city buttons: cities are now selectable via the combobox above. */}
        </section>

        {/* All capitals */}
        <section>
          <h2 className="font-display text-lg font-semibold mb-4 text-foreground">Todas as capitais</h2>
          <div className="mb-4">
            <SearchInput
              placeholder="Buscar capital..."
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedUF(""); }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredCapitals.map((city) => (
              <Link
                key={city.name}
                to={`/eventos?cidade=${encodeURIComponent(city.name)}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-border"
              >
                <img
                  src={city.imageUrl}
                  alt={`Eventos em ${city.name}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-semibold text-xs md:text-sm">{city.name}</h3>
                  <p className="text-white/60 text-[10px]">{city.uf}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
