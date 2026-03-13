

## Plano: Adicionar secret do webhook token Asaas

### Contexto
O Asaas não permite usar a chave de API como token de webhook — ele gera um token separado (`whsec_...`). O código atual em `asaas-webhook/index.ts` valida contra `ASAAS_API_KEY`, que é incorreto.

### Alterações

1. **Adicionar novo secret `ASAAS_WEBHOOK_TOKEN`** com o valor `whsec_EUhLywkB85JchbvqA5rf-82ASBlzNT5DIklEVDfOceg`

2. **Atualizar `supabase/functions/asaas-webhook/index.ts`** (linhas 53-59): trocar a validação de `ASAAS_API_KEY` para `ASAAS_WEBHOOK_TOKEN`
   - `Deno.env.get("ASAAS_API_KEY")` → `Deno.env.get("ASAAS_WEBHOOK_TOKEN")`
   - Atualizar mensagem de erro correspondente

3. **Atualizar `supabase/config.toml`**: adicionar `verify_jwt = false` para a função `asaas-webhook` (o Asaas não envia JWT do backend)

