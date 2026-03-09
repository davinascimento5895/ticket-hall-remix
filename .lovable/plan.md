

## Plano: Feature "Lista de Interesse" para Produtores

### Resumo
Criar um sistema completo de "Lista de Interesse" que permite ao produtor criar listas públicas para medir interesse em eventos futuros. Inclui: CRUD completo no painel do produtor, página pública com formulário customizável, e link compartilhável no formato `lista/{code}`.

---

### 1. Database — Nova tabela `interest_lists` + `interest_list_fields` + `interest_list_submissions`

**Migration SQL:**

```sql
-- Lista de interesse principal
CREATE TABLE public.interest_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  venue_name text,
  start_date timestamp with time zone,
  status text NOT NULL DEFAULT 'published', -- draft, published, closed
  max_submissions integer, -- null = ilimitado
  expires_at timestamp with time zone, -- null = sem expiração
  submissions_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Campos customizáveis do formulário
CREATE TABLE public.interest_list_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.interest_lists(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text', -- text, email, phone, select, number
  placeholder text,
  is_required boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  options jsonb, -- para selects
  created_at timestamp with time zone DEFAULT now()
);

-- Respostas/inscrições
CREATE TABLE public.interest_list_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.interest_lists(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  user_id uuid,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.interest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_list_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_list_submissions ENABLE ROW LEVEL SECURITY;

-- interest_lists policies
CREATE POLICY "Producers manage their lists" ON public.interest_lists FOR ALL USING (auth.uid() = producer_id);
CREATE POLICY "Anyone can view published lists" ON public.interest_lists FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage all lists" ON public.interest_lists FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- interest_list_fields policies
CREATE POLICY "Anyone can view fields of published lists" ON public.interest_list_fields FOR SELECT USING (EXISTS (SELECT 1 FROM interest_lists WHERE id = list_id AND status = 'published'));
CREATE POLICY "Producers manage their list fields" ON public.interest_list_fields FOR ALL USING (EXISTS (SELECT 1 FROM interest_lists WHERE id = list_id AND producer_id = auth.uid()));
CREATE POLICY "Admins manage all fields" ON public.interest_list_fields FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- interest_list_submissions policies
CREATE POLICY "Anyone can submit" ON public.interest_list_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Producers view submissions for their lists" ON public.interest_list_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM interest_lists WHERE id = list_id AND producer_id = auth.uid()));
CREATE POLICY "Admins manage all submissions" ON public.interest_list_submissions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Function to increment count
CREATE OR REPLACE FUNCTION public.increment_list_submissions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE interest_lists SET submissions_count = submissions_count + 1 WHERE id = NEW.list_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_submission_insert
AFTER INSERT ON public.interest_list_submissions
FOR EACH ROW EXECUTE FUNCTION public.increment_list_submissions();
```

### 2. Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/producer/ProducerInterestLists.tsx` | Listagem com cards: nome, inscritos, status, ações (copiar link, editar, exportar CSV, despublicar, excluir) |
| `src/pages/producer/ProducerInterestListForm.tsx` | Formulário de criação/edição com: nome, limite, expiração, descrição, local, data/hora, imagem, construtor de campos drag-free (add/remove/reorder) |
| `src/pages/InterestListPublic.tsx` | Página pública `/lista/{slug}` com banner, título, formulário dinâmico renderizado a partir dos campos do banco |
| `src/lib/api-interest-lists.ts` | Funções CRUD: create/update/delete list, manage fields, get submissions, export |

### 3. Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionar rotas: `/producer/interest-lists`, `/producer/interest-lists/new`, `/producer/interest-lists/:id/edit`, `/lista/:slug` (pública) |
| `src/pages/producer/ProducerLayout.tsx` | Adicionar "Listas de Interesse" no menu lateral com ícone `ClipboardList` |

### 4. Funcionalidades-chave

**Slug único**: Gerar código aleatório de 8 caracteres alfanuméricos, verificar unicidade no banco antes de salvar (loop como `generateUniqueSlug`).

**Ações na listagem (3 pontos)**:
- Copiar link (`lista/{slug}`) → clipboard com toast
- Editar → navega para form
- Exportar CSV → download client-side das submissions
- Despublicar → update status para 'closed'
- Excluir → delete com confirmação

**Construtor de formulário**:
- Campos default: Nome, Sobrenome, E-mail, Celular (todos obrigatórios)
- Adicionar campo custom via dialog: tipo (texto, email, telefone, select, número), nome, placeholder, obrigatório toggle
- Reordenar com botões up/down
- Remover campo (exceto defaults)

**Página pública**:
- Banner com imagem (ou placeholder cinza)
- Título da lista
- Card com formulário dinâmico
- Validação client-side (campos obrigatórios, formato email/telefone)
- Texto de termos: "Ao entrar na lista, você aceita os Termos e Condições da TicketHall..."
- Botão "Quero entrar na lista!"
- Tela de sucesso após envio
- Auto-fechar quando `max_submissions` atingido ou `expires_at` passado

**Edge cases tratados**:
- Lista expirada/fechada → mostra mensagem "Esta lista não está mais recebendo inscrições"
- Limite atingido → mesma mensagem
- Submissão duplicada por email → verificar antes de inserir
- Imagem upload → usar bucket `event-images` existente
- Mobile-first: formulário público ocupa tela inteira, inputs grandes, botão full-width

### 5. Design

- Listagem: cards com badge de status (Publicada/Fechada), contador de inscritos em destaque
- Form de criação: seções em cards separados (como nas screenshots de referência), visual limpo
- Página pública: minimalista, banner top, card centralizado com formulário, sem navbar do produtor

