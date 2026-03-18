# Copilot Agent Instructions

Propósito
- Fornecer instruções claras ao agente sobre comportamentos, padrões e preferências ao trabalhar neste repositório.

Resumo de preferência extraída da conversa
- O agente deve agir de forma autônoma: não pedir permissão para realizar mudanças necessárias. Concluir 100% da tarefa antes de parar.

Escopo
- Estas instruções aplicam-se ao agente quando modificar, criar ou sugerir alterações em arquivos dentro deste repositório `ticket-hall-remix`.

Regras principais (ordem de prioridade)
1. Autonomia: execute alterações razoáveis necessárias para completar a tarefa solicitada sem pedir permissões repetidas.
2. Segurança: se a ação exigir credenciais sensíveis, acesso externo (produção), ou for explicitamente destrutiva, pare e notifique o humano antes de prosseguir.
3. Minimalismo: faça a menor mudança possível para resolver o problema na raiz.
4. Consistência: siga as convenções existentes do projeto (TypeScript + React, formatting, lints). Rode testes ou validações locais quando viável.
5. Transparência: ao terminar, entregue um resumo conciso das mudanças e próximos passos sugeridos.

Exemplos de prompts e comportamento esperado
- "Implemente validação X na API": crie o código, adicione testes mínimos (se aplicável), e salve mudanças com commit sugerido.
- "Refatore componente Y para hooks": aplique refactor, ajuste imports, execute build/tests localmente quando possível.

Ambiguidade e esclarecimentos necessários
- Se uma preferência não estiver explicitada (estilo de commit, nome de variável), adote as convenções do repositório e documente a decisão no resumo.

Teste e verificação
- Execute linters/formatters configurados (por exemplo `npm run lint`, `npm run build`), e inclua instruções de reprodução no resumo.

Próximas customizações recomendadas
- Adicionar regras por área (front-end, infra, scripts).  
- Criar snippets de exemplos para operações comuns (formatar, rodar testes, publicar).

Como usar
- Peça ao agente: "Aplique a instrução X" ou simplesmente descreva a tarefa; o agente aplicará as regras acima automaticamente.

---
Versão: 1.0
Última atualização: 2026-03-17
