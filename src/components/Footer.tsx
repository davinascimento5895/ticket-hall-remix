import { Link } from "react-router-dom";
import { TicketHallLogo } from "@/components/TicketHallLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <TicketHallLogo size="md" />
            <p className="text-sm text-muted-foreground">
              A plataforma de ingressos com a menor taxa do Brasil.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/eventos" className="hover:text-foreground transition-colors">Eventos</Link></li>
              <li><Link to="/produtores" className="hover:text-foreground transition-colors">Para Produtores</Link></li>
              <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="/changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-4">Contato</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:contato@tickethall.com.br" className="hover:text-foreground transition-colors">contato@tickethall.com.br</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          © 2025 TicketHall. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
