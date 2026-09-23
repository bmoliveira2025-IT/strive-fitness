# Geração de treinos por slots

## Estado encontrado

O catálogo versionado neste repositório é `assets/exercises.json` (820 IDs). Não há aqui schema da tabela de exercícios de produção nem função de backend anterior para geração. O fluxo antigo fazia chamada Gemini no aplicativo com `EXPO_PUBLIC_GEMINI_API_KEY`, aceitava JSON parcialmente reparado e completava treinos com exercícios genéricos. A seção principal usava seleção aleatória no cliente.

## Pipeline implementada

1. `npm run generate:workout-catalog` extrai um snapshot compacto dos IDs existentes e gera `outputs/workout_biomechanics_seed.sql`. O SQL faz upsert em uma tabela auxiliar e preserva linhas marcadas com `reviewed_at`. Nenhuma linha da tabela de exercícios original é alterada.
2. `buildSlots` recebe foco, objetivo, nível, equipamento e prioridade explícita de glúteos. Regras determinísticas atribuem tags de movimento e ordenam candidatos. Slots sem o movimento exato admitem uma substituição biomecânica configurada.
3. A Edge Function `generate-workout` autentica a chamada, envia ao Gemini somente os 12 melhores candidatos por slot e exige o JSON Schema abaixo. A chave `GEMINI_API_KEY` fica apenas em segredo do servidor.
4. Zod valida a forma da resposta. `fillSlots` confere cada ID por slot, impede duplicatas e substitui IDs inválidos por candidatos do catálogo. O cliente valida novamente contra seu próprio catálogo antes de criar `SavedExercise`.
5. Se modelo, rede ou função falharem, o mesmo algoritmo local monta o treino rapidamente. Os logs registram `retrieval_ms`, `model_ms`, `total_ms`, `invalid_selections` e origem, sem dados pessoais.

O Schema é gerado por requisição com `slot_id` e `exercise_id` limitados a enums dos slots e IDs filtrados. Sua estrutura é:

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "selections": {
      "type": "array",
      "minItems": 5,
      "maxItems": 5,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "slot_id": { "type": "string", "enum": ["slot_1", "slot_2", "slot_3", "slot_4", "slot_5"] },
          "exercise_id": { "type": "string", "enum": ["IDs elegíveis da requisição"] }
        },
        "required": ["slot_id", "exercise_id"]
      }
    }
  },
  "required": ["selections"]
}
```

A função responde `{ "version": 1, "request_id": "uuid", "source": "model|repaired|catalog_fallback", "selections": [{ "slot_id": "slot_1", "exercise_id": "292" }] }`. O cliente adiciona nome, mídia, séries e descanso a partir dos registros locais existentes. O modelo nunca define nomes, pesos, imagens, séries ou IDs fora do catálogo.

## Publicação e operação

1. Revise as tags em `outputs/workout_biomechanics_seed.sql` com alguém responsável pelo catálogo biomecânico. O classificador usa heurísticas de nome e grupo muscular; não substitui revisão profissional. Corrija exceções na tabela auxiliar e marque `reviewed_at` para preservar a correção em próximas execuções.
2. Aplique `supabase/migrations/202609220001_workout_biomechanics.sql` e depois o seed SQL, no ambiente adequado. Não execute em produção sem a revisão de schema, IDs e políticas do projeto Supabase real.
3. Configure o segredo `GEMINI_API_KEY` nas Edge Function Secrets e publique `generate-workout`. O snapshot do catálogo é empacotado junto à função. Execute `npm run generate:workout-catalog` sempre que `assets/exercises.json` mudar e republique a função junto com o aplicativo. Enquanto o schema da tabela de exercícios de produção não estiver disponível neste repositório, o snapshot é a fonte de IDs que ambos conhecem.
4. Remova a antiga `EXPO_PUBLIC_GEMINI_API_KEY` dos builds e rotacione a chave que já foi exposta no cliente/histórico. O script de tradução agora lê `GEMINI_API_KEY` do ambiente.
5. Acompanhe p50/p95 de `total_ms`, proporção de `catalog_fallback`, erros de autenticação e `invalid_selections`. Teste cada foco com academia completa, peso corporal e equipamentos isolados. Em caso de falha da função, o usuário ainda recebe um plano válido do catálogo.

O viés para glúteos é uma preferência editável, inicializada a partir do perfil feminino na página; gênero não bloqueia exercícios. Nível e objetivo afetam o volume e as repetições. A integridade dos IDs é garantida por validação; adequação clínica e classificação biomecânica exigem curadoria humana.

## Planos semanais e catálogo de programas

- A tela de geração oferece 2 a 6 dias por semana e mostra apenas divisões compatíveis: corpo todo/AB (2 dias), corpo todo/ABC (3), AB/ABCD (4), ABCDE (5) e ABC repetido (6). Cada dia tem slots próprios e um treino separado. O perfil Homens/Mulheres/Personalizado só define preferências iniciais; a prioridade e os equipamentos continuam editáveis.
- Para um plano semanal, o cliente envia `kind: "weekly"`, `days_per_week`, `split` e `priority_focus`. A função cria todos os slots antes de uma única chamada ao modelo e devolve `version: 2` com `sessions`. IDs de slots são prefixados por dia (`day_1_slot_1` etc.). O mesmo JSON Schema estrito contém exatamente a quantidade de slots do plano, com enums de IDs elegíveis. A validação e o fallback ocorrem por sessão para impedir exercício repetido dentro do mesmo treino.
- O plano é salvo em uma operação local única; cada sessão recebe `routineId`, `routineName`, `sessionIndex` e `daysPerWeek`, preservando compatibilidade com treinos antigos. Os programas prontos em `constants/programs.ts` usam esse mesmo motor, sem chamar a IA ao abrir a página, e podem ser salvos como semana completa na prévia.
- Os programas são modelos de treino, não promessas de resultado. O modelo de perda de peso contém treino de força; alimentação, atividade aeróbica e ajustes individuais não são inferidos automaticamente. Perfis dos treinadores e imagens ainda são dados locais e devem ser verificados/curados antes de serem apresentados como credenciais oficiais.
