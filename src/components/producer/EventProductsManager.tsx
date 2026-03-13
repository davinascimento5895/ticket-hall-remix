import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Package, Upload, X, Edit2, ChevronLeft, ChevronRight, Image as ImageIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  getEventProductsAll, createEventProduct, deleteEventProduct, updateEventProduct,
  getProductImages, addProductImage, deleteProductImage, uploadProductImage,
  getProductVariations, addProductVariation, updateProductVariation, deleteProductVariation,
} from "@/lib/api-products";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  eventId: string;
}

export function EventProductsManager({ eventId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // New product form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["event-products", eventId],
    queryFn: () => getEventProductsAll(eventId),
  });

  const createMut = useMutation({
    mutationFn: () => createEventProduct({
      event_id: eventId,
      name: name.trim(),
      description: description.trim() || undefined,
      price,
      sort_order: products.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-products", eventId] });
      setName(""); setDescription(""); setPrice(0);
      toast({ title: "Produto adicionado ao catálogo!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteEventProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-products", eventId] });
      toast({ title: "Produto removido" });
    },
  });

  const toggleVisibility = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      updateEventProduct(id, { is_visible: visible }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-products", eventId] }),
  });

  const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" /> Catálogo de Produtos
        </CardTitle>
        <CardDescription>
          Configure produtos para exibição na página do evento. Este catálogo é apenas informativo — 
          a venda não é realizada pela plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            ⚠️ Os produtos aqui cadastrados serão exibidos como <strong>catálogo informativo</strong> na página do evento.
            Nenhuma compra ou pagamento será processado pela plataforma.
          </p>
        </div>

        {/* Existing products */}
        {!isLoading && products.length > 0 && (
          <div className="space-y-2">
            {products.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                <div className="flex items-center gap-3 min-w-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(p.price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={p.is_visible}
                    onCheckedChange={(v) => toggleVisibility.mutate({ id: p.id, visible: v })}
                  />
                  <button onClick={() => setEditingProduct(p)} className="text-muted-foreground hover:text-foreground">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteMut.mutate(p.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new product */}
        <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
          <p className="text-sm font-medium text-foreground">Novo produto</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Camiseta Oficial, Kit Festival" maxLength={150} />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)" rows={2} maxLength={500} />
          <div>
            <Label className="text-xs">Preço de referência (R$)</Label>
            <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} />
          </div>
          <Button size="sm" onClick={() => createMut.mutate()} disabled={!name.trim() || createMut.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar ao catálogo
          </Button>
          <p className="text-[10px] text-muted-foreground">Após adicionar, clique no ícone de edição para gerenciar fotos e variações.</p>
        </div>
      </CardContent>

      {/* Edit product dialog */}
      {editingProduct && (
        <ProductEditDialog
          product={editingProduct}
          onClose={() => { setEditingProduct(null); queryClient.invalidateQueries({ queryKey: ["event-products", eventId] }); }}
          userId={user?.id || ""}
        />
      )}
    </Card>
  );
}

// ─── Product Edit Dialog (images + variations) ───
function ProductEditDialog({ product, onClose, userId }: { product: any; onClose: () => void; userId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.price);

  // Variations
  const [varName, setVarName] = useState("");
  const [varValue, setVarValue] = useState("");
  const [editingVar, setEditingVar] = useState<any | null>(null);

  const { data: images = [], refetch: refetchImages } = useQuery({
    queryKey: ["product-images", product.id],
    queryFn: () => getProductImages(product.id),
  });

  const { data: variations = [], refetch: refetchVariations } = useQuery({
    queryKey: ["product-variations", product.id],
    queryFn: () => getProductVariations(product.id),
  });

  const saveMut = useMutation({
    mutationFn: () => updateEventProduct(product.id, { name, description, price }),
    onSuccess: () => toast({ title: "Produto atualizado!" }),
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const uploadMut = useMutation({
    mutationFn: async (files: File[]) => {
      const currentCount = images.length;
      const allowed = Math.min(files.length, 10 - currentCount);
      if (allowed <= 0) {
        toast({ title: "Limite atingido", description: "Máximo de 10 fotos por produto.", variant: "destructive" });
        return;
      }
      for (let i = 0; i < allowed; i++) {
        const url = await uploadProductImage(files[i], userId);
        await addProductImage(product.id, url, currentCount + i);
      }
      refetchImages();
      toast({ title: `${allowed} foto(s) adicionada(s)` });
    },
  });

  const deleteImgMut = useMutation({
    mutationFn: deleteProductImage,
    onSuccess: () => refetchImages(),
  });

  const addVarMut = useMutation({
    mutationFn: () => addProductVariation({
      product_id: product.id,
      name: varName.trim(),
      value: varValue.trim(),
      sort_order: variations.length,
    }),
    onSuccess: () => {
      setVarName(""); setVarValue("");
      refetchVariations();
      toast({ title: "Variação adicionada" });
    },
  });

  const updateVarMut = useMutation({
    mutationFn: ({ id, name, value }: { id: string; name: string; value: string }) =>
      updateProductVariation(id, { name, value }),
    onSuccess: () => {
      setEditingVar(null);
      refetchVariations();
      toast({ title: "Variação atualizada" });
    },
  });

  const deleteVarMut = useMutation({
    mutationFn: deleteProductVariation,
    onSuccess: () => refetchVariations(),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadMut.mutate(files);
    e.target.value = "";
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic info */}
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} />
            <Label>Preço de referência (R$)</Label>
            <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} />
            <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              Salvar informações
            </Button>
          </div>

          <Separator />

          {/* Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1"><ImageIcon className="h-4 w-4" /> Fotos ({images.length}/10)</Label>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} disabled={images.length >= 10 || uploadMut.isPending} />
                <Button variant="outline" size="sm" asChild disabled={images.length >= 10}>
                  <span className="gap-1"><Upload className="h-3 w-3" /> Adicionar</span>
                </Button>
              </label>
            </div>
            {uploadMut.isPending && <p className="text-xs text-muted-foreground">Enviando...</p>}
            {images.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img: any) => (
                  <div key={img.id} className="relative group">
                    <img src={img.image_url} alt="" className="w-full aspect-square rounded object-cover" />
                    <button
                      onClick={() => deleteImgMut.mutate(img.id)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma foto adicionada.</p>
            )}
          </div>

          <Separator />

          {/* Variations */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Tag className="h-4 w-4" /> Tamanhos / Variações</Label>

            {variations.length > 0 && (
              <div className="space-y-1">
                {variations.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-2 rounded bg-secondary/50 text-sm">
                    {editingVar?.id === v.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input value={editingVar.name} onChange={(e) => setEditingVar({ ...editingVar, name: e.target.value })} className="h-7 text-xs" placeholder="Tipo" />
                        <Input value={editingVar.value} onChange={(e) => setEditingVar({ ...editingVar, value: e.target.value })} className="h-7 text-xs" placeholder="Opções" />
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => updateVarMut.mutate(editingVar)}>Salvar</Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingVar(null)}>Cancelar</Button>
                      </div>
                    ) : (
                      <>
                        <span><strong>{v.name}:</strong> {v.value}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingVar({ id: v.id, name: v.name, value: v.value })} className="text-muted-foreground hover:text-foreground">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteVarMut.mutate(v.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input value={varName} onChange={(e) => setVarName(e.target.value)} placeholder="Ex: Tamanho" className="flex-1" maxLength={50} />
              <Input value={varValue} onChange={(e) => setVarValue(e.target.value)} placeholder="Ex: P, M, G, GG" className="flex-1" maxLength={200} />
              <Button size="sm" onClick={() => addVarMut.mutate()} disabled={!varName.trim() || !varValue.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Informe o tipo (ex: "Tamanho", "Cor") e as opções separadas por vírgula.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
