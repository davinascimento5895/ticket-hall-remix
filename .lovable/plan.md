

## Diagnóstico do Problema

### Análise da Imagem
A navbar mostra **6 itens** em vez de 5:
- ❌ Ingressos (primeira posição - não deveria estar aqui)
- Início
- Eventos
- Carrinho
- Ingressos (posição correta)
- Perfil

### Problema Identificado
O código define a ordem correta (`Início → Eventos → Carrinho → Ingressos → Perfil`), mas a imagem mostra "Ingressos" duplicado e na primeira posição. Possíveis causas:

1. **Cache do navegador** com versão antiga do componente
2. **Componente duplicado** sendo renderizado em outro lugar
3. **Bug de renderização** após hot-reload

### Correções a Implementar

1. **Garantir ordem correta e única** - Revalidar a estrutura do array `baseNavItems`

2. **Adicionar key único mais robusto** - Usar index + id para evitar duplicação por React

3. **Limpar possíveis conflitos** - Verificar se não há outro componente de navegação sendo renderizado

### Mapeamento Correto das Rotas

| Tab | ID | Rotas Associadas |
|-----|----|----|
| Início | `home` | `/` (apenas raiz) |
| Eventos | `events` | `/eventos`, `/evento/*`, `/busca`, `/cidades` |
| Carrinho | `cart` | `/carrinho` |
| Ingressos | `tickets` | `/meus-ingressos`, `/meus-certificados` |
| Perfil | `profile` | `/meu-perfil`, `/notificacoes-config` |

### Mudanças no Código

**`src/components/MobileBottomNav.tsx`:**
- Corrigir ordem dos itens: Início → Eventos → Carrinho → Ingressos → Perfil
- Melhorar função `getActiveId()` para ser mais exclusiva
- Adicionar `/cidades` ao grupo de "Eventos"

