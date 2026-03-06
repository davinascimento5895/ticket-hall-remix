import { SEOHead } from "@/components/SEOHead";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "introducao", label: "Introdução" },
  { id: "glossario", label: "Glossário" },
  { id: "coleta", label: "Coleta de Dados" },
  { id: "finalidade", label: "Finalidade do Tratamento" },
  { id: "organizadores", label: "Dados e os Produtores" },
  { id: "compartilhamento", label: "Compartilhamento" },
  { id: "armazenamento", label: "Armazenamento e Segurança" },
  { id: "transferencia", label: "Transferência Internacional" },
  { id: "cookies", label: "Cookies" },
  { id: "retencao", label: "Retenção de Dados" },
  { id: "direitos", label: "Direitos do Titular" },
  { id: "menores", label: "Menores de Idade" },
  { id: "alteracoes", label: "Alterações desta Política" },
  { id: "contato", label: "Contato e DPO" },
  { id: "disposicoes", label: "Disposições Gerais" },
];

export default function PoliticaPrivacidade() {
  const [activeSection, setActiveSection] = useState("introducao");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const sorted = visible.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveSection(sorted[0].target.id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <SEOHead
        title="Política de Privacidade — TicketHall"
        description="Entenda como a TicketHall coleta, armazena e utiliza seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018)."
      />

      <main className="pt-28 pb-20">
        <div className="container max-w-7xl">
          {/* Header */}
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Documento Legal
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              A presente Política de Privacidade é baseada nos princípios e valores da TicketHall e tem o objetivo de estabelecer as regras sobre a coleta, o uso, o armazenamento e o compartilhamento dos dados pessoais dos Usuários. Como condição para acesso e utilização da plataforma TicketHall e suas funcionalidades, o Usuário declara que realizou a leitura completa e atenta das regras deste documento, estando plenamente ciente e de acordo com elas em sua versão mais atual.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Última atualização: 1 de março de 2026
            </p>
          </div>

          <Separator className="mb-10" />

          {/* Content Layout */}
          <div className="flex gap-12">
            {/* Sidebar Navigation - Desktop */}
            <nav className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-28">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Sumário
                </p>
                <ul className="space-y-1">
                  {sections.map(({ id, label }) => (
                    <li key={id}>
                      <button
                        onClick={() => scrollToSection(id)}
                        className={cn(
                          "w-full text-left text-sm py-1.5 px-3 rounded-md transition-colors",
                          activeSection === id
                            ? "text-primary font-medium bg-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 min-w-0 max-w-3xl">
              <article className="prose-legal space-y-16">

                {/* 1. Introdução */}
                <section id="introducao">
                  <h2 className="text-xl font-semibold text-foreground mb-4">1. Introdução</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    1.1. A TicketHall é uma plataforma tecnológica que intermedia a venda de ingressos, inscrições e serviços relacionados a eventos cadastrados por Produtores, acessível pelo site ou por meio de seus aplicativos oficiais. A presente Política de Privacidade descreve como os dados pessoais dos Usuários são coletados, utilizados, armazenados e compartilhados, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e demais legislações aplicáveis.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    1.2. Esta Política se aplica a todos os Usuários da plataforma TicketHall, sejam eles Compradores, Produtores, Participantes ou pessoas que tão somente acessem a plataforma. Ao comprar e/ou utilizar um ingresso, cadastrar um evento ou navegar pela plataforma, os Usuários declaram estar expressamente de acordo com as informações aqui descritas.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    1.3. A depender da atuação do Usuário na plataforma, algumas condições específicas podem ser aplicadas, conforme se demonstrará ao longo deste documento.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    1.4. Durante a utilização da plataforma TicketHall, os dados pessoais dos Usuários poderão ser coletados em diferentes momentos, como ao criar uma conta, adquirir ingressos ou se inscrever em um evento. Para cada tipo de informação coletada, existe um nível de proteção adequado que a TicketHall adota, assim como diferentes tipos de utilização.
                  </p>
                </section>

                {/* 2. Glossário */}
                <section id="glossario">
                  <h2 className="text-xl font-semibold text-foreground mb-4">2. Glossário</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Para os fins desta Política de Privacidade, consideram-se as seguintes definições:
                  </p>
                  <div className="space-y-3">
                    {[
                      { term: "Chargeback", def: "cancelamento de uma compra online realizada através de cartão de débito ou crédito, que pode acontecer em virtude do não reconhecimento da compra pelo titular do cartão ou pelo fato de a transação não obedecer às regulamentações previstas nos contratos, termos, aditivos e manuais editados pelas administradoras de cartão." },
                      { term: "Código de acesso", def: "termo utilizado para designar o QR Code gerado para acesso aos eventos na plataforma TicketHall." },
                      { term: "Comprador", def: "pessoa que adquire ingressos pagos ou gratuitos para si ou para outrem através de sua conta na TicketHall. O pedido ficará registrado na conta do Comprador." },
                      { term: "Contestação", def: "reclamação de cobrança indevida, solicitada pelo titular do cartão de crédito junto à operadora de seu cartão, podendo ser iniciada por diversas razões, tais como o esquecimento de que a compra foi realizada, a utilização do cartão por outros membros da família, ou ainda, resultado de uma compra fraudulenta realizada por terceiros." },
                      { term: "Controlador de dados pessoais", def: "pessoa natural ou jurídica, de direito público ou privado, a quem competem as decisões referentes ao tratamento de dados pessoais." },
                      { term: "Cookies", def: "arquivos que têm a finalidade de identificar um computador e obter dados de acesso, como páginas navegadas ou links clicados, permitindo personalizar a navegação de acordo com o perfil do Usuário." },
                      { term: "Dado Pessoal", def: "informação relacionada a pessoa natural identificada ou identificável, nos termos do artigo 5º, inciso I, da LGPD." },
                      { term: "Dado Não Pessoal", def: "quaisquer informações que não se relacionem com uma pessoa e/ou não possam ser usadas para identificar uma pessoa." },
                      { term: "Estorno", def: "ação de estornar crédito ou débito indevidamente lançado." },
                      { term: "Operador de dados pessoais", def: "pessoa natural ou jurídica, de direito público ou privado, que realiza o tratamento de dados pessoais em nome do controlador." },
                      { term: "Participante", def: "pessoa que usufruirá do ingresso adquirido pelo Comprador. Caso o Comprador adquira ingresso para uso próprio, será também Participante. Caso adquira ingressos em proveito de terceiros, estes serão considerados tão somente Participantes, e não Compradores." },
                      { term: "Plataforma TicketHall", def: "plataforma tecnológica que intermedia a venda de ingressos, inscrições e serviços relacionados aos eventos cadastrados pelos Produtores, acessível pelo site ou por meio de aplicativos oficiais." },
                      { term: "Produtor", def: "pessoa física ou jurídica que cria, gerencia e divulga seus eventos por meio da plataforma TicketHall." },
                      { term: "Tratamento de dados pessoais", def: "toda operação realizada com dados pessoais, como coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração." },
                      { term: "Usuário", def: "termo utilizado para designar, quando referidos em conjunto, Produtores, Compradores, Participantes e pessoas que navegam na plataforma TicketHall." },
                    ].map(({ term, def }) => (
                      <div key={term} className="border-l-2 border-border pl-4">
                        <p className="text-sm">
                          <strong className="text-foreground">{term}:</strong>{" "}
                          <span className="text-muted-foreground">{def}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Coleta de Dados */}
                <section id="coleta">
                  <h2 className="text-xl font-semibold text-foreground mb-4">3. Coleta de Dados Pessoais e Não Pessoais</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.1. Durante a utilização da plataforma TicketHall, os dados pessoais dos Usuários poderão ser coletados em diferentes momentos, como ao criar uma conta, adquirir ingressos, cadastrar eventos ou navegar pela plataforma. Para cada tipo de dado coletado, a TicketHall adota um nível de proteção adequado, de acordo com sua natureza e sensibilidade.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.2. A TicketHall poderá coletar as seguintes categorias de dados pessoais:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    {[
                      "a) Dados de cadastro: nome completo, CPF, endereço de e-mail, número de telefone e data de nascimento;",
                      "b) Dados de pagamento: informações de cartão de crédito (processadas exclusivamente por parceiros homologados em conformidade com o padrão PCI-DSS), dados de PIX e boleto bancário. A TicketHall não armazena dados completos de cartão de crédito em seus sistemas;",
                      "c) Dados de navegação: endereço IP, tipo de navegador, sistema operacional, páginas visitadas, cookies e identificadores de dispositivo;",
                      "d) Dados de evento: ingressos adquiridos, histórico de check-in, preferências de evento e dados de participantes informados pelo Comprador;",
                      "e) Dados do Produtor: CNPJ ou CPF, dados bancários para repasse de valores, informações referentes aos eventos, dados de equipe e colaboradores cadastrados;",
                      "f) Dados biométricos (quando aplicável): em processos de verificação de identidade para prevenção a fraudes, coletados exclusivamente mediante consentimento expresso do titular.",
                    ].map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.3. A TicketHall também poderá coletar dados não pessoais, tais como informações agregadas de uso da plataforma, estatísticas de navegação e dados técnicos de desempenho, que não permitem a identificação direta do Usuário. Na medida em que o endereço IP ou identificadores semelhantes sejam considerados dados pessoais pela legislação aplicável, a TicketHall tratará esses identificadores como dados pessoais.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    3.4. A TicketHall poderá obter dados pessoais diretamente do Usuário, por meio de formulários, interações com a plataforma e comunicações diretas, ou ainda de fontes públicas e parceiros autorizados, sempre em conformidade com a legislação vigente.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    3.5. O Usuário é integralmente responsável por fornecer informações exatas, verdadeiras e atualizadas. O fornecimento de informações falsas, incorretas ou imprecisas poderá resultar na suspensão ou encerramento da conta e na impossibilidade de utilização dos serviços da plataforma, sem qualquer ônus para a TicketHall.
                  </p>
                </section>

                {/* 4. Finalidade */}
                <section id="finalidade">
                  <h2 className="text-xl font-semibold text-foreground mb-4">4. Finalidade do Tratamento de Dados</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    4.1. A TicketHall utiliza os dados pessoais coletados para as seguintes finalidades:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    {[
                      "a) Processar compras de ingressos, pagamentos e emitir confirmações de pedidos;",
                      "b) Enviar Códigos de Acesso (QR Codes), notificações sobre eventos, lembretes e comunicações operacionais;",
                      "c) Melhorar a experiência do Usuário e personalizar recomendações de eventos;",
                      "d) Cumprir obrigações legais e regulatórias, incluindo obrigações fiscais e tributárias;",
                      "e) Prevenir fraudes, cambismo e garantir a segurança e integridade da plataforma;",
                      "f) Realizar análises de risco em transações financeiras, podendo solicitar documentos ou informações adicionais;",
                      "g) Comunicar-se com o Usuário sobre atualizações, alterações em eventos, suporte e atendimento;",
                      "h) Gerenciar o cadastro de Produtores e processar repasses financeiros;",
                      "i) Gerar certificados de participação em eventos, quando habilitado pelo Produtor;",
                      "j) Cumprir determinações de autoridades competentes, ordens judiciais ou requisições administrativas;",
                      "k) Exercer o direito regular de defesa em processos judiciais, administrativos ou arbitrais;",
                      "l) Viabilizar operações de intermediação, reserva e venda de ingressos, serviços e produtos para eventos.",
                    ].map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    4.2. As bases legais utilizadas para o tratamento de dados pessoais, conforme a LGPD, incluem: (i) execução de contrato ou de procedimentos preliminares; (ii) cumprimento de obrigação legal ou regulatória; (iii) consentimento do titular; (iv) legítimo interesse do controlador ou de terceiros; (v) exercício regular de direitos em processo judicial, administrativo ou arbitral; (vi) proteção ao crédito.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    4.3. A TicketHall não utilizará os dados pessoais dos Usuários para finalidades incompatíveis com as aqui descritas, exceto mediante consentimento específico do titular ou quando houver base legal que assim permita.
                  </p>
                </section>

                {/* 5. Dados e os Produtores */}
                <section id="organizadores">
                  <h2 className="text-xl font-semibold text-foreground mb-4">5. Utilização dos Dados Pessoais pelos Produtores</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.1. O Produtor, na condição de Controlador de dados pessoais, fica ciente de que somente poderá realizar o tratamento dos dados pessoais dos Compradores e Participantes em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados) e demais legislações, nacionais e internacionais, aplicáveis.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.2. A TicketHall, na condição de Operadora de dados pessoais, realizará o tratamento desses dados em nome dos Produtores quando, por exemplo: (i) coletar e armazenar dados pessoais de Compradores para prestação dos serviços de gestão de eventos e venda de ingressos; (ii) disponibilizar para os Produtores ferramenta para envio de comunicações aos Compradores e outros Usuários; (iii) fornecer relatórios de eventos para análise dos Produtores.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.3. O Produtor reconhece que, no exercício de suas atividades de tratamento, será integral e exclusivamente responsável, tanto perante a TicketHall quanto perante os titulares dos dados pessoais tratados, em caso de descumprimento da legislação aplicável. O Produtor deve ser diligente ao coletar dados pessoais, compartilhar dados com terceiros (como patrocinadores de eventos, fornecedores, etc.) ou armazenar tais dados em sua própria infraestrutura tecnológica ou de terceiros.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.4. Os dados pessoais compartilhados com o Produtor são limitados ao estritamente necessário para a gestão do evento, incluindo nome do Participante, endereço de e-mail e dados de check-in. O Produtor não está autorizado a utilizar tais dados para finalidades diversas das relacionadas ao evento, salvo mediante consentimento expresso do titular.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    5.5. Caso a TicketHall seja questionada, administrativa ou judicialmente, sobre a legalidade de qualquer atividade de tratamento de dados pessoais realizada pelo Produtor, caberá a este imediatamente: (a) identificar-se como exclusivo responsável pela atividade questionada; (b) tomar toda e qualquer medida ao seu alcance para excluir a TicketHall do questionamento; e (c) isentar a TicketHall de qualquer responsabilidade neste sentido.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    5.6. O Produtor será integral e exclusivamente responsável por atender às solicitações dos titulares dos dados pessoais tratados, referentes a: (i) confirmação da existência de tratamento; (ii) acesso aos dados; (iii) correção de dados incompletos, inexatos ou desatualizados; (iv) anonimização, bloqueio ou eliminação de dados desnecessários; (v) portabilidade dos dados; (vi) informação sobre a possibilidade de não fornecer consentimento e as respectivas consequências; e (vii) revogação do consentimento.
                  </p>
                </section>

                {/* 6. Compartilhamento */}
                <section id="compartilhamento">
                  <h2 className="text-xl font-semibold text-foreground mb-4">6. Compartilhamento de Dados Pessoais</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    6.1. Os dados pessoais dos Usuários poderão ser compartilhados com terceiros nas seguintes hipóteses:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    {[
                      "a) Produtores de eventos: apenas os dados estritamente necessários para a gestão do evento, tais como nome do Participante, endereço de e-mail e dados de check-in;",
                      "b) Processadores de pagamento: parceiros homologados que processam transações de PIX, cartão de crédito e boleto bancário, em conformidade com os padrões PCI-DSS e com a legislação aplicável;",
                      "c) Prestadores de serviço: empresas que auxiliam na operação da plataforma, como envio de e-mails transacionais, análise de dados e suporte técnico, sempre sob obrigações contratuais de confidencialidade e proteção de dados;",
                      "d) Autoridades competentes: quando exigido por lei, ordem judicial, requisição de autoridade policial ou administrativa, ou para investigação de atividades ilícitas;",
                      "e) Empresas envolvidas em operações societárias: em caso de fusão, aquisição, incorporação ou reestruturação, desde que os dados façam parte dos ativos transferidos e sejam mantidas as mesmas garantias de proteção.",
                    ].map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    6.2. A TicketHall não vende, comercializa ou disponibiliza dados pessoais a terceiros para fins de marketing, publicidade ou qualquer outra finalidade que não esteja descrita nesta Política. Qualquer compartilhamento será realizado dentro dos limites previstos na LGPD e exclusivamente para as finalidades aqui estabelecidas.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    6.3. Em todos os casos de compartilhamento, a TicketHall exige o cumprimento das mesmas garantias de segurança e privacidade que adota internamente, incluindo obrigações contratuais de confidencialidade e conformidade com a legislação de proteção de dados.
                  </p>
                </section>

                {/* 7. Armazenamento */}
                <section id="armazenamento">
                  <h2 className="text-xl font-semibold text-foreground mb-4">7. Armazenamento e Segurança dos Dados</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    7.1. Os dados pessoais são armazenados em servidores seguros, com criptografia em trânsito (TLS/SSL) e em repouso. A TicketHall implementa medidas técnicas e organizacionais robustas para proteger os dados contra acesso não autorizado, perda, alteração, destruição ou qualquer forma de tratamento inadequado ou ilícito.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    7.2. As medidas de segurança incluem, mas não se limitam a: criptografia de dados sensíveis, firewalls, controles de acesso baseados em função, monitoramento contínuo de ameaças, testes de segurança periódicos, políticas internas de proteção de dados e treinamento de equipe.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    7.3. A TicketHall garante que qualquer pessoa, física ou jurídica, contratada ou autorizada a realizar o tratamento de dados pessoais em seu nome (sub-processadores), estará sujeita a obrigações legais e de confidencialidade em relação a tais dados.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    7.4. Embora a TicketHall adote as melhores práticas de segurança da informação, não é possível garantir completamente a não ocorrência de interceptações e violações dos sistemas e bases de dados, uma vez que a internet possui sua estrutura de segurança em permanente aperfeiçoamento.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    7.5. Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a TicketHall comunicará os Usuários afetados e a Autoridade Nacional de Proteção de Dados (ANPD) nos prazos e condições previstos na legislação vigente, adotando as medidas cabíveis para mitigar os efeitos do incidente.
                  </p>
                </section>

                {/* 8. Transferência Internacional */}
                <section id="transferencia">
                  <h2 className="text-xl font-semibold text-foreground mb-4">8. Transferência Internacional de Dados</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    8.1. Os dados pessoais dos Usuários poderão ser armazenados em servidores localizados fora do Brasil, em países que ofereçam nível adequado de proteção de dados pessoais ou mediante a adoção de garantias apropriadas, conforme previsto nos artigos 33 a 36 da LGPD.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    8.2. A TicketHall utiliza serviços de computação em nuvem de provedores reconhecidos internacionalmente, que adotam padrões de segurança e privacidade compatíveis com a legislação brasileira e regulamentações internacionais, incluindo, mas não se limitando a, provedores localizados nos Estados Unidos da América (EUA) e em países da União Europeia.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    8.3. Em todos os casos de transferência internacional de dados, a TicketHall exigirá o cumprimento das mesmas garantias de segurança e privacidade que adota internamente, assegurando que os dados pessoais dos Usuários sejam protegidos de forma adequada independentemente da localização dos servidores.
                  </p>
                </section>

                {/* 9. Cookies */}
                <section id="cookies">
                  <h2 className="text-xl font-semibold text-foreground mb-4">9. Cookies e Tecnologias de Rastreamento</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.1. A TicketHall utiliza tecnologias de rastreamento como cookies, pixel tags, armazenamento local e outros identificadores, de dispositivos móveis ou não, para uma variedade de funções. Essas tecnologias ajudam a autenticar a conta do Usuário, promover e aperfeiçoar os serviços, personalizar a experiência e avaliar a eficácia das comunicações.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.2. Cookies são arquivos que contêm um identificador (uma sequência de letras e números) enviados por um servidor para determinado navegador, que o armazena. Os cookies podem ser "persistentes" (armazenados até sua data de validade ou exclusão pelo Usuário) ou "de sessão" (expiram ao final de uma sessão de navegação).
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.3. A TicketHall poderá utilizar as seguintes categorias de cookies:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    {[
                      "a) Cookies estritamente necessários: são utilizados para que a plataforma realize funções básicas, como autenticação do Usuário, fornecimento dos recursos apropriados e viabilização de ferramentas de segurança;",
                      "b) Cookies de desempenho: possibilitam a coleta de informações sobre a utilização da plataforma pelos Usuários, como as páginas visitadas com frequência e a ocorrência de erros, permitindo melhorar a experiência de uso;",
                      "c) Cookies de funcionalidade: permitem que a plataforma forneça funcionalidades e personalizações melhoradas, como lembrar as preferências do Usuário. A desativação destes cookies poderá comprometer determinadas funcionalidades;",
                      "d) Cookies de publicidade: são utilizados com o objetivo de exibir anúncios relevantes, a partir da coleta de informações relativas aos hábitos de navegação do Usuário e da construção de perfis de interesse.",
                    ].map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.4. O Usuário poderá gerenciar suas preferências de cookies por meio do banner apresentado durante o acesso à plataforma, podendo optar por desabilitar uma ou mais categorias, com exceção dos cookies estritamente necessários. O Usuário também poderá gerenciar suas preferências a partir das configurações de seu navegador ou dispositivo, recusando ou excluindo determinados cookies.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.5. A desativação de determinados cookies poderá comprometer a prestação dos serviços ou impedir o funcionamento de determinadas funcionalidades da plataforma.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    9.6. Os provedores de serviços terceiros utilizados pela TicketHall poderão utilizar cookies e outras tecnologias de sua propriedade para identificar o navegador e dispositivo utilizados, de modo a oferecer publicidade direcionada quando o Usuário acessa websites ou aplicativos de terceiros. A TicketHall não possui controle sobre esses cookies de terceiros.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    9.7. A TicketHall poderá utilizar outras tecnologias de rastreamento, como web beacons (pixel tags) e URLs click-through, para avaliar a eficácia de comunicações e campanhas, e para compreender o interesse em determinados conteúdos e eventos.
                  </p>
                </section>

                {/* 10. Retenção */}
                <section id="retencao">
                  <h2 className="text-xl font-semibold text-foreground mb-4">10. Retenção de Dados</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    10.1. A TicketHall manterá os dados pessoais dos Usuários pelo período necessário para cumprir as finalidades descritas nesta Política ou conforme exigido pela legislação aplicável. Os prazos de retenção consideram as seguintes diretrizes:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    {[
                      "a) Dados de transações financeiras: mantidos por no mínimo 5 (cinco) anos para fins fiscais, regulatórios e de proteção ao crédito, conforme a legislação tributária e o Código Civil;",
                      "b) Dados de cadastro: mantidos enquanto a conta do Usuário estiver ativa. Após inatividade prolongada, o Usuário será notificado previamente à exclusão ou anonimização dos dados;",
                      "c) Dados de navegação e cookies: mantidos pelo período necessário conforme a finalidade, geralmente até 12 (doze) meses;",
                      "d) Registros de acesso: mantidos por 6 (seis) meses, conforme o Marco Civil da Internet (Lei nº 12.965/2014);",
                      "e) Dados relacionados a processos judiciais ou administrativos: mantidos pelo período necessário para o exercício regular de direitos.",
                    ].map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    10.2. Após o término do período de retenção, os dados pessoais serão excluídos ou anonimizados, salvo quando houver necessidade legal, regulatória ou contratual para sua manutenção, ou quando forem necessários para o exercício regular de direitos em processos judiciais, administrativos ou arbitrais.
                  </p>
                </section>

                {/* 11. Direitos do Titular */}
                <section id="direitos">
                  <h2 className="text-xl font-semibold text-foreground mb-4">11. Direitos do Titular dos Dados</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    11.1. Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o Usuário, na qualidade de titular de dados pessoais, tem os seguintes direitos em relação aos seus dados:
                  </p>
                  <div className="ml-4 space-y-2 mb-3">
                    {[
                      "a) Confirmação da existência de tratamento de dados pessoais;",
                      "b) Acesso aos dados pessoais armazenados;",
                      "c) Correção de dados incompletos, inexatos ou desatualizados;",
                      "d) Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;",
                      "e) Portabilidade dos dados a outro fornecedor de serviço ou produto, mediante requisição expressa, de acordo com a regulamentação da ANPD;",
                      "f) Eliminação dos dados pessoais tratados com base no consentimento, exceto nas hipóteses de conservação previstas na lei;",
                      "g) Informação sobre as entidades públicas e privadas com as quais a TicketHall compartilhou seus dados;",
                      "h) Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa;",
                      "i) Revogação do consentimento a qualquer momento, quando o tratamento for baseado em consentimento;",
                      "j) Petição à Autoridade Nacional de Proteção de Dados (ANPD) em relação aos seus dados pessoais.",
                    ].map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    11.2. Para exercer seus direitos, o Usuário poderá acessar a seção de privacidade em sua conta na plataforma ou enviar solicitação para o endereço de e-mail{" "}
                    <a href="mailto:privacidade@tickethall.com.br" className="text-primary hover:underline">privacidade@tickethall.com.br</a>.
                    A TicketHall responderá às solicitações em até 15 (quinze) dias úteis, conforme previsto na legislação.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    11.3. A exclusão ou anonimização de dados poderá ser limitada quando o armazenamento for necessário para: (i) cumprimento de obrigação legal ou regulatória; (ii) execução de contrato; (iii) exercício regular de direitos em processos judiciais, administrativos ou arbitrais; (iv) proteção ao crédito; ou (v) atendimento a interesse legítimo do controlador.
                  </p>
                </section>

                {/* 12. Menores */}
                <section id="menores">
                  <h2 className="text-xl font-semibold text-foreground mb-4">12. Menores de Idade</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    12.1. Os serviços da plataforma TicketHall são direcionados para pessoas maiores de 18 (dezoito) anos, com documento pessoal e endereço de e-mail válidos. Menores de 18 (dezoito) anos somente poderão utilizar a plataforma desde que devidamente autorizados ou assistidos por seus responsáveis ou representantes legais, em conformidade com o Estatuto da Criança e do Adolescente (Lei nº 8.069/1990) e com a LGPD.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    12.2. A TicketHall não coleta intencionalmente dados pessoais de menores de 13 (treze) anos. Caso seja identificado que dados de menores de 13 anos foram coletados sem o consentimento dos responsáveis legais, a TicketHall adotará as medidas necessárias para a imediata exclusão desses dados.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    12.3. É de responsabilidade exclusiva dos responsáveis ou representantes legais o monitoramento da navegação e utilização da plataforma por parte de menores de idade.
                  </p>
                </section>

                {/* 13. Alterações */}
                <section id="alteracoes">
                  <h2 className="text-xl font-semibold text-foreground mb-4">13. Alterações desta Política</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    13.1. A presente Política de Privacidade está sujeita a constante melhoria e aprimoramento. A TicketHall se reserva o direito de modificá-la a qualquer momento, conforme a finalidade da plataforma, para adequação e conformidade legal de disposição de lei ou norma que tenha força jurídica equivalente.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    13.2. A TicketHall notificará os Usuários sobre mudanças significativas nesta Política por meio de e-mail, notificação na plataforma ou publicação em destaque no site. Recomenda-se que os Usuários revisem periodicamente a versão mais atual.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    13.3. Ao continuar utilizando a plataforma após a publicação de alterações nesta Política, o Usuário declara estar ciente e de acordo com as modificações realizadas.
                  </p>
                </section>

                {/* 14. Contato e DPO */}
                <section id="contato">
                  <h2 className="text-xl font-semibold text-foreground mb-4">14. Contato e Encarregado de Proteção de Dados (DPO)</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    14.1. Para dúvidas, solicitações ou reclamações sobre esta Política de Privacidade ou sobre o tratamento de dados pessoais, o Usuário poderá entrar em contato com o Encarregado de Proteção de Dados (DPO) da TicketHall pelo endereço de e-mail{" "}
                    <a href="mailto:privacidade@tickethall.com.br" className="text-primary hover:underline">privacidade@tickethall.com.br</a>.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    14.2. A comunicação entre a TicketHall e o Usuário sobre assuntos de privacidade e proteção de dados deverá ser realizada pelos canais oficiais de atendimento disponibilizados na plataforma.
                  </p>
                </section>

                {/* 15. Disposições Gerais */}
                <section id="disposicoes">
                  <h2 className="text-xl font-semibold text-foreground mb-4">15. Disposições Gerais</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.1. A TicketHall somente será obrigada a disponibilizar registros de acesso, informações pessoais ou comunicações privadas armazenadas em sua plataforma mediante ordem judicial ou requisição de autoridade policial ou administrativa competente, nos termos do Marco Civil da Internet (Lei nº 12.965/2014) e da LGPD.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.2. A eventual tolerância quanto a qualquer violação dos termos e condições desta Política será considerada mera liberalidade e não será interpretada como novação, precedente invocável, renúncia a direitos, alteração tácita dos termos, direito adquirido ou alteração contratual.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.3. Caso alguma disposição desta Política for julgada inaplicável ou sem efeito, o restante das normas continuará a viger, sem a necessidade de medida judicial que declare tal assertiva. Os termos aqui descritos serão interpretados segundo a legislação brasileira.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    15.4. O Usuário assume total responsabilidade por todos os prejuízos, diretos e indiretos, inclusive indenização, lucros cessantes, honorários advocatícios e demais encargos judiciais e extrajudiciais que a TicketHall seja obrigada a incorrer em virtude de ato ou omissão do Usuário que resulte em violação desta Política.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    15.5. Fica eleito o foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias ou queixas oriundas da utilização da plataforma ou relacionadas a esta Política de Privacidade, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                  </p>
                </section>

              </article>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
