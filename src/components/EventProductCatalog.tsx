import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { getEventProducts, getProductImages, getProductVariations } from "@/lib/api-products";
import { Badge } from "@/components/ui/badge";

interface Props {
  eventId: string;
}

export function EventProductCatalog({ eventId }: Props) {
  const { data: products = [] } = useQuery({
    queryKey: ["event-products", eventId],
    queryFn: () => getEventProducts(eventId),
  });

  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground">Produtos disponíveis</h3>
      </div>

      <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Os produtos abaixo são exibidos apenas como catálogo informativo. A compra deve ser feita diretamente com o produtor do evento, 
          no local ou pelos canais indicados por ele.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((p: any) => (
          <ProductCatalogCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function ProductCatalogCard({ product }: { product: any }) {
  const { data: images = [] } = useQuery({
    queryKey: ["product-images", product.id],
    queryFn: () => getProductImages(product.id),
  });

  const { data: variations = [] } = useQuery({
    queryKey: ["product-variations", product.id],
    queryFn: () => getProductVariations(product.id),
  });

  const [currentImage, setCurrentImage] = useState(0);

  const allImages = images.length > 0
    ? images.map((i: any) => i.image_url)
    : product.image_url
      ? [product.image_url]
      : [];

  const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Image carousel */}
      {allImages.length > 0 ? (
        <div className="relative aspect-square bg-secondary">
          <img
            src={allImages[currentImage]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {allImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((c) => (c - 1 + allImages.length) % allImages.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-full p-1.5 hover:bg-background transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentImage((c) => (c + 1) % allImages.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-full p-1.5 hover:bg-background transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {allImages.map((_: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === currentImage ? "bg-foreground" : "bg-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="aspect-square bg-secondary flex items-center justify-center">
          <Package className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}

      {/* Info */}
      <div className="p-4 space-y-2">
        <h4 className="font-semibold text-foreground text-sm">{product.name}</h4>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-3">{product.description}</p>
        )}
        <p className="text-sm font-bold text-foreground">{fmt(product.price)}</p>

        {/* Variations */}
        {variations.length > 0 && (
          <div className="space-y-1 pt-1">
            {variations.map((v: any) => (
              <div key={v.id} className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">{v.name}:</span>
                {v.value.split(",").map((opt: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {opt.trim()}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground italic pt-1">
          Apenas catálogo • Compra no local
        </p>
      </div>
    </div>
  );
}
