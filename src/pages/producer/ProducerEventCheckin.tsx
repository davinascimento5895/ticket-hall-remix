import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, QrCode, CheckCircle2, Wifi, WifiOff, XCircle, AlertTriangle, Camera, CameraOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckinListsManager } from "@/components/producer/CheckinListsManager";
import { getEventTickets, getProducerEventBasic } from "@/lib/api-producer";
import { validateCheckin, validateCheckinByTicketId, type CheckinResult } from "@/lib/api-checkin";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ProducerEventCheckin() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<string>("qr-reader-" + Math.random().toString(36).slice(2));
  const lastScannedRef = useRef<string>("");

  const { data: event } = useQuery({
    queryKey: ["producer-event", id],
    queryFn: () => getProducerEventBasic(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["event-tickets-checkin", id],
    queryFn: () => getEventTickets(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  // Mutation for manual check-in by ticket ID (list button click)
  const checkinMutation = useMutation({
    mutationFn: (ticketId: string) => validateCheckinByTicketId({ ticketId, scannedBy: user?.id }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["event-tickets-checkin", id] });
      setLastResult(result);
      toast({ title: "Check-in realizado!", description: result.attendeeName });
    },
    onError: (err: any) => {
      setLastResult({ success: false, result: "error", message: err.message });
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  // Mutation for QR scanner — passes raw QR code string
  const scanCheckinMutation = useMutation({
    mutationFn: (qrCode: string) => validateCheckin({ qrCode, scannedBy: user?.id }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["event-tickets-checkin", id] });
      setLastResult(result);
      toast({ title: "Check-in realizado!", description: result.attendeeName });
    },
    onError: (err: any) => {
      setLastResult({ success: false, result: "error", message: err.message });
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const totalTickets = tickets?.length || 0;
  const checkedIn = tickets?.filter((t: any) => t.status === "used").length || 0;

  // QR Scanner start/stop
  const startScanner = useCallback(async () => {
    const containerId = scannerContainerRef.current;
    if (scannerRef.current) return;
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Prevent duplicate scans of the same code in quick succession
          if (lastScannedRef.current === decodedText) return;
          lastScannedRef.current = decodedText;
          // QR codes contain JWT or raw data — use validateCheckin directly
          scanCheckinMutation.mutate(decodedText);
          // Reset after 3 seconds to allow re-scanning
          setTimeout(() => { lastScannedRef.current = ""; }, 3000);
        },
        () => {} // ignore scan failures
      );
      setScannerActive(true);
    } catch (err: any) {
      toast({ title: "Erro ao abrir câmera", description: err.message || "Permissão de câmera negada", variant: "destructive" });
      scannerRef.current = null;
    }
  }, [scanCheckinMutation]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
    setScannerActive(false);
  }, []);

  // Reactive online status
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const filtered = tickets?.filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.attendee_name?.toLowerCase().includes(s) ||
      t.attendee_email?.toLowerCase().includes(s) ||
      t.id.includes(s);
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2 text-sm">
        {isOnline ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-destructive" />}
        <span className={isOnline ? "text-success" : "text-destructive"}>{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Counter */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-display font-bold text-primary">{checkedIn}</p>
            <p className="text-sm text-muted-foreground">Check-ins realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-display font-bold">{totalTickets}</p>
            <p className="text-sm text-muted-foreground">Total de ingressos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="lists">Listas de Acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4 pt-2">
          {/* Last scan result */}
          {lastResult && (
            <Card className={lastResult.success ? "border-green-500/50" : "border-destructive/50"}>
              <CardContent className="py-3 flex items-center gap-3">
                {lastResult.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                ) : lastResult.result === "already_used" ? (
                  <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{lastResult.message}</p>
                  {lastResult.attendeeName && (
                    <p className="text-xs text-muted-foreground">{lastResult.attendeeName} · {lastResult.tierName}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Scanner */}
          <Card>
            <CardContent className="pt-6">
              <div
                id={scannerContainerRef.current}
                className="mx-auto overflow-hidden rounded-lg mb-4"
                style={{ maxWidth: 400, minHeight: scannerActive ? 300 : 0 }}
              />
              {!scannerActive ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <QrCode className="h-10 w-10 text-muted-foreground" />
                  <Button onClick={startScanner} className="gap-2">
                    <Camera className="h-4 w-4" /> Abrir câmera para scanner
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Button variant="outline" onClick={stopScanner} className="gap-2">
                    <CameraOff className="h-4 w-4" /> Parar scanner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual search */}
          <div>
            <SearchInput placeholder="Buscar por nome, email ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full" />
          </div>

          {/* Attendee list */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((ticket: any) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{ticket.attendee_name || ticket.profiles?.full_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{ticket.ticket_tiers?.name} · #{ticket.id.slice(0, 8)}</p>
                      </div>
                      {ticket.status === "used" ? (
                        <span className="inline-flex items-center gap-1 text-sm text-success"><CheckCircle2 className="h-4 w-4" />Entrou</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkinMutation.mutate(ticket.id)}
                          disabled={checkinMutation.isPending}
                        >
                          Check-in
                        </Button>
                      )}
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground py-8 text-center">Nenhum ingresso encontrado.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lists" className="pt-2">
          {id && <CheckinListsManager eventId={id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
