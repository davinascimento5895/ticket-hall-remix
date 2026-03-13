
Objetivo: corrigir de ponta a ponta o fluxo de troca de imagem do evento para que o crop abra imediatamente no contexto certo (sem depender de trocar de aba), com comportamento “poka-yoke” e sem impacto para outros usuários.

1) Causa raiz (confirmada no código)
- Em `ProducerEventForm.tsx`, o estado `cropModalOpen` é alterado no `handleCoverSelect` (passo “Informações”).
- Porém o componente `<ImageCropModal />` está renderizado apenas dentro do bloco `step === 3` (aba “Ingressos”).
- Resultado: o modal só existe no DOM quando o usuário chega na aba 3; por isso parece que “não funciona” ao tentar trocar imagem na aba de informações.
- Evidência adicional: o texto atual “A imagem será ajustada automaticamente no próximo passo” reforça esse fluxo incorreto/confuso.

2) Correção estrutural (principal)
- Mover `<ImageCropModal />` para fora de blocos condicionais de etapa, renderizando-o no nível raiz da página de edição (sempre montado).
- Manter `cropModalOpen`, `cropImageSrc` e `handleCropDone` no mesmo componente pai.
- Assim, ao selecionar arquivo em qualquer etapa, o modal abre imediatamente.

3) Ajustes de UX para eliminar ambiguidade
- Tornar o “trocar imagem” acionável de forma robusta:
  - usar um único input file controlado por `ref` (em vez de múltiplos inputs espalhados), disparado por clique no botão/área;
  - manter reset do input para permitir selecionar o mesmo arquivo novamente.
- Atualizar microcopy:
  - remover “no próximo passo”;
  - substituir por texto direto: “Após selecionar a imagem, o recorte abre imediatamente”.
- Exibir feedback claro pós-crop:
  - preview atualizada instantaneamente;
  - manter indicação da dimensão final 1600×838 (16:9).

4) Poka-yoke (garantia de qualidade)
- Preservar recorte obrigatório 16:9 com saída 1600×838 no `ImageCropModal`.
- Impedir que imagem “não recortada” entre no fluxo de upload (somente `onCropDone` define `coverFile` válido).
- (Opcional de robustez) limpar object URLs (`URL.revokeObjectURL`) para evitar vazamento de memória em trocas repetidas.

5) Hardening técnico complementar (não bloqueante, mas recomendado)
- Em `ImageCropModal`, usar `DialogDescription` (em vez de `<p>`) para remover warning de acessibilidade.
- Revisar fechamento do modal para garantir que cancelamento não altera `coverFile`.
- Garantir que esse fluxo permanece 100% local ao usuário atual (estado em memória da tela), sem efeitos em sessões de outros usuários até o momento de salvar.

6) Validação de ponta a ponta (após implementar)
- Caso de edição: abrir `/producer/events/:id/edit` na aba de informações, clicar “Trocar imagem” e confirmar que o crop abre imediatamente.
- Confirmar que NÃO precisa navegar para “Ingressos” para o crop aparecer.
- Confirmar preview atualiza após “Confirmar recorte”.
- Salvar evento e validar persistência da nova imagem ao reabrir edição/listagem.
- Repetir com o mesmo arquivo duas vezes para validar reset do input.
- Verificar ausência de regressão nas outras etapas do wizard.

Arquivos alvo da implementação
- `src/pages/producer/ProducerEventForm.tsx` (mover modal, ajustar gatilho de upload, copy e fluxo)
- `src/components/producer/ImageCropModal.tsx` (ajustes de acessibilidade/robustez no modal)
