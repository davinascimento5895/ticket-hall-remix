import { useState } from "react";
import { Copy, Check, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  eventSlug: string;
}

export function EmbedSnippetGenerator({ eventSlug }: Props) {
  const [theme, setTheme] = useState("dark");
  const [width, setWidth] = useState("400");
  const [height, setHeight] = useState("500");
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed?event=${eventSlug}&theme=${theme}`;
  const snippet = `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" style="border:none;border-radius:12px;overflow:hidden;" loading="lazy"></iframe>`;

  const copy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Code className="h-4 w-4" /> Widget Incorporável
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cole o código abaixo em qualquer site para exibir um widget de venda de ingressos deste evento.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Tema</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="light">Claro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Largura (px)</Label>
            <Input value={width} onChange={(e) => setWidth(e.target.value)} />
          </div>
          <div>
            <Label>Altura (px)</Label>
            <Input value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
        </div>

        <div className="relative">
          <pre className="bg-muted/50 border border-border rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono">
            {snippet}
          </pre>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2"
            onClick={copy}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <div className="border border-border rounded-lg p-2">
          <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
          <iframe
            src={embedUrl}
            width="100%"
            height="400"
            style={{ border: "none", borderRadius: 8 }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
