import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

const ListItem = ({ title, desc, href }: { title: string; desc?: string; href: string }) => (
  <li className="py-3 border-b border-border last:border-b-0">
    <div className="flex justify-between items-start gap-4">
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      <a className="text-primary text-sm font-medium ml-4" href={href}>Saiba mais →</a>
    </div>
  </li>
);

export default function ProdutoresFuncionalidades() {
  return (
    <>
      <SEOHead
        title="Funcionalidades para Produtores — Guia Completo"
        description="Guia das funcionalidades reais da TicketHall para produtores: vendas, operação, financeiro, marketing e integrações."
      />

      {/* HERO */}
      <section className="relative min-h-[56vh] flex items-center bg-hero-gradient overflow-hidden">
        <div className="container relative z-10 py-20">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.05] mb-4">Guia de funcionalidades para produtores</h1>
            <p className="text-lg text-muted-foreground mb-6">Aqui você encontra, por categoria, as funcionalidades que a TicketHall já oferece para criar, vender e operar eventos.</p>
            <div className="flex gap-3">
              <Button variant="hero">Peça uma demonstração</Button>
              <Button variant="outline">Crie seu evento agora</Button>
            </div>
          </div>
        </div>
      </section>

      <main className="py-16 md:py-24">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">Funcionalidades reais da TicketHall</h2>

          {/* Navegação Geral (itens de topo/menus relevantes para o produtor) */}
          <section className="mb-12">
            <h3 className="font-display text-xl font-semibold mb-4">Navegação geral (painel do produtor)</h3>
            <ul className="bg-card rounded-xl border border-border p-4">
              <ListItem title="Dashboard do produtor" desc="Painel principal com métricas, pedidos recentes e botão para criar evento." href="/produtores/funcionalidades/dashboard" />
              <ListItem title="Meus eventos" desc="Listagem de eventos com ações rápidas: abrir painel, ver página pública, editar, deletar." href="/produtores/funcionalidades/vendas" />
              <ListItem title="Financeiro (nível produtor)" desc="Acesso ao painel financeiro consolidado com sub-abas." href="/produtores/funcionalidades/relatorios" />
              <ListItem title="Mensagens (Inbox)" desc="Caixa de entrada com mensagens de compradores e sistema de resposta." href="/produtores/funcionalidades/relatorios" />
              <ListItem title="Configurações" desc="Perfil, página pública do organizador, contas bancárias e integrações/webhooks." href="/produtores/funcionalidades/vendas" />
            </ul>
          </section>

          {/* Vendas e Ingressos */}
          <section className="mb-12">
            <h3 className="font-display text-xl font-semibold mb-4">Vendas e Ingressos</h3>
            <ul className="bg-card rounded-xl border border-border p-4">
              <ListItem title="Configuração de ingressos e lotes (tiers)" desc="Crie diferentes tipos de ingresso, preços, visibilidade e limites por lote." href="/produtores/funcionalidades/tiers" />
              <ListItem title="Ingressos gratuitos e pagos" desc="Suporte a ingressos gratuitos, pagos e mistos com gestão de estoque." href="/produtores/funcionalidades/free-paid" />
              <ListItem title="Revenda oficial (marketplace)" desc="Marketplace integrado para revenda de ingressos quando permitido pelo produtor." href="/produtores/funcionalidades/revenda-oficial" />
              <ListItem title="Transferência e revenda por usuário" desc="Transferência de titularidade e listagem para revenda quando habilitado." href="/produtores/funcionalidades/transferencia-revenda" />
              <ListItem title="Cupons e promoções" desc="Criação de cupons com regras de uso, validade e restrições por evento." href="/produtores/funcionalidades/cupons" />
            </ul>
          </section>

          {/* Operação e Credenciamento */}
          <section className="mb-12">
            <h3 className="font-display text-xl font-semibold mb-4">Operação e Credenciamento</h3>
            <ul className="bg-card rounded-xl border border-border p-4">
              <ListItem title="Check-in por QR Code" desc="Scanner com suporte offline/online para check-in rápido." href="/produtores/funcionalidades/checkin" />
              <ListItem title="Listas de acesso e guestlist" desc="Gerencie listas de convidados e listas de credenciamento separadas." href="/produtores/funcionalidades/guestlist" />
              <ListItem title="Gerenciamento de staff" desc="Perfis e permissões para equipes de operação do evento." href="/produtores/funcionalidades/staff" />
              <ListItem title="App/Interface organizador" desc="Acesso móvel e ferramentas para operar o evento na palma da mão." href="/produtores/funcionalidades/app-organizador" />
            </ul>
          </section>

          {/* Marketing e Distribuição */}
          <section className="mb-12">
            <h3 className="font-display text-xl font-semibold mb-4">Marketing e Distribuição</h3>
            <ul className="bg-card rounded-xl border border-border p-4">
              <ListItem title="Promoters e afiliados" desc="Vincule promoters, gere códigos de tracking e monitore comissões e conversões." href="/produtores/funcionalidades/promoters" />
              <ListItem title="Listas de interesse" desc="Colete inscrições de interessados antes do evento e exporte os contatos." href="/produtores/funcionalidades/listas-interesse" />
              <ListItem title="Widgets e embed" desc="Venda ingressos através de widgets embutidos em sites externos." href="/produtores/funcionalidades/widgets" />
            </ul>
          </section>

          {/* Financeiro e Relatórios */}
          <section className="mb-12">
            <h3 className="font-display text-xl font-semibold mb-4">Financeiro e Relatórios</h3>
            <ul className="bg-card rounded-xl border border-border p-4">
              <ListItem title="Fluxo de caixa e conciliação" desc="Painel financeiro com fluxo de caixa, contas a pagar/receber e conciliação por evento." href="/produtores/funcionalidades/fluxo-de-caixa" />
              <ListItem title="Repasses e contas bancárias" desc="Configuração de contas bancárias e acompanhamento de repasses." href="/produtores/funcionalidades/repasses" />
              <ListItem title="Relatórios e exportações" desc="Relatórios por evento e exportação de dados para contabilidade." href="/produtores/funcionalidades/relatorios" />
            </ul>
          </section>

          

          {/* Serviços e Marketplace */}
          <section className="mb-12">
            <h3 className="font-display text-xl font-semibold mb-4">Marketplace</h3>
            <ul className="bg-card rounded-xl border border-border p-4">
              <ListItem title="Marketplace de revenda" desc="Espaço seguro para revenda quando permitido pelo produtor." href="/produtores/funcionalidades/marketplace-revenda" />
            </ul>
          </section>

        </div>
      </main>
    </>
  );
}
