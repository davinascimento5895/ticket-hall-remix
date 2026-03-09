
## Arquitetura do Mapa de Assentos

Como você pediu, estruturei a visão completa de como isso funciona no mercado (o modelo complexo) e a solução exata que vamos implementar agora (baseada em setores/áreas e cores).

### 1. O Modelo Complexo (Para o Futuro)
Para criar um sistema onde o cliente clica na cadeira exata (como em cinemas ou teatros grandes), a melhor prática de mercado não usa imagens estáticas, mas sim o seguinte formato:
*   **Vetorização (SVG):** O mapa é um arquivo vetorial interativo. Cada bolinha (cadeira) é um elemento manipulável no código com um ID único (ex: `seat-A1`).
*   **Editor Visual (Canvas/Paint):** O produtor usa uma ferramenta (bibliotecas como *Fabric.js* ou *Konva.js*) dentro do painel para desenhar o palco, criar blocos de assentos em grade e atribuir preços a blocos específicos.
*   **Concorrência (Locks):** Se o Cliente 1 clica no assento `A1`, o sistema usa *WebSockets* (como o Supabase Realtime) para bloquear visualmente e no banco de dados aquele assento por 10 minutos, impedindo que o Cliente 2 compre ao mesmo tempo (evitando *overselling*).
*   *Por que não fazer agora?* Exige construir um "Figma/Paint" simplificado do zero e gerenciar uma tabela imensa de cadeiras individuais, o que aumentaria absurdamente a complexidade do MVP.

---

### 2. A Solução Atual (Setores por Imagem + Cores)

Para resolver a necessidade atual de forma realista, intuitiva e sem atrito, vamos adotar a abordagem de **Mapa de Setores Visuais**.

**Como vai funcionar no Painel do Produtor:**
1.  **Ativação e Upload:** Vou reativar o botão de "Mapa de Assentos" no formulário de criação. Ao ativar, aparecerá um campo para o produtor fazer o **upload de uma imagem** (PNG/JPG) com o desenho do evento (mostrando Palco, Pista, Camarote, Setor Azul, etc).
2.  **Cores nos Ingressos:** Na etapa de criar os Ingressos, adicionarei uma opção de **Cor do Setor no Mapa**. O produtor cria o ingresso "Setor Azul" e escolhe a cor `#0000FF`.
3.  **Armazenamento Inteligente:** Não precisamos criar colunas novas no banco. Salvaremos a URL da imagem e o mapeamento de cores dentro do campo `seat_map_config` (que já existe e é feito para receber dados flexíveis em JSON).

**Como vai funcionar para o Cliente (Checkout):**
1.  No fluxo de compra, vou remover aquele grid genérico de cadeiras falsas.
2.  No lugar, o cliente verá a **Imagem do Mapa** carregada pelo produtor em destaque (podendo dar zoom para ver os detalhes).
3.  Abaixo do mapa (ou na hora de selecionar os ingressos), a lista de categorias mostrará uma bolinha/tag com a **cor correspondente** definida pelo produtor. 
4.  O cliente olha o mapa, entende que o "Amarelo" é perto do palco e compra o ingresso que tem a tag amarela.

### Plano de Modificações Técnicas

*   **`src/pages/producer/ProducerEventForm.tsx`**: 
    *   Habilitar o switch "Permite selecionar assentos".
    *   Adicionar campo de upload de imagem para o mapa (salvando no storage `event-images` e registrando a URL no `seat_map_config.imageUrl`).
    *   Na criação/edição de lotes, se o mapa estiver ativo, exibir um color picker simples.
*   **`src/components/booking/BookingSeatMap.tsx` / `BookingTicketStep.tsx`**: 
    *   Substituir a lógica atual por um visualizador de imagem interativo.
    *   Integrar a escolha do ingresso com as cores configuradas, permitindo que a imagem sirva como um guia de referência claro para a seleção das categorias.

Essa abordagem resolve perfeitamente a divisão por setores (arquibancada, pista, superior) integrando com o sistema de lotes atual, fechando o escopo ponta a ponta.
