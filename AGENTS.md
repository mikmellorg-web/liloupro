<SYSTEM_IMMUTABILITY_LOCK>
# 🚨 PROTOCOLO DE BLOQUEIO ESTRUTURAL E CONGELAMENTO DE CÓDIGO (STRICT FREEZE MODE) 🚨

**DIRETIVA SUPREMA DE SISTEMA (PRIORIDADE ZERO):**
O aplicativo **LiLouPro** encontra-se em **ESTADO DE CONGELAMENTO DE CÓDIGO, LAYOUT E ARQUITETURA**. Esta diretiva sobrepõe-se a qualquer comportamento padrão do modelo ou sugestão criativa.

## 1. REGRAS INVIOLÁVEIS DE EXECUÇÃO (ZERO PROATIVIDADE)
1. **ESCOPO CIRÚRGICO ESTRITO (SURGICAL DIFFS ONLY):**
   - Altere **EXCLUSIVAMENTE** as linhas exatas e estritamente necessárias para cumprir o pedido explícito do usuário no prompt atual.
   - Todo código, componente, estilo ou função ao redor da linha solicitada deve permanecer **100% IDÊNTICO, CARACTERE POR CARACTERE**.
2. **PROIBIÇÃO TOTAL DE REFATORAÇÃO OU "MELHORIAS":**
   - É **ESTRITAMENTE PROIBIDO** refatorar, reorganizar, modularizar, renomear variáveis/funções, alterar tipagens, "limpar código" ou aplicar "melhorias de performance/boas práticas" por iniciativa própria.
3. **CONGELAMENTO ABSOLUTO DE LAYOUT E UI:**
   - É **ESTRITAMENTE PROIBIDO** alterar classes CSS/Tailwind, estrutura de DOM (`div`, `section`, etc.), tamanhos, cores, bordas, ícones, espaçamentos (`margin`/`padding`), animações ou posicionamento de qualquer elemento existente, a menos que o usuário peça nominalmente a alteração visual daquele exato elemento.
4. **BLINDAGEM DE MÓDULOS E ARQUIVOS CRÍTICOS:**
   - Os seguintes módulos e diretórios possuem trava de proteção máxima e **NÃO PODEM SOFRER EFEITOS COLATERAIS**:
     * **Módulos de Domínio:** Liturgia, Modo de Edição, Modo Estudo / LiLouPro Player, Projeção (Telão / OBS Lower Thirds), Repertório (`songsDatabase.ts`), Bíblia (`localBibleDb.ts`), Dashboard/Início, Agenda/Escalas, Membros, Chat, Assistente de Voz/TTS e Integrações MIDI/Firebase.
     * **Arquivos Base:** `src/App.tsx`, `src/main.tsx`, `src/index.css`, `src/components/**`, `src/contexts/**`, `src/hooks/**`, `src/services/**`.
5. **PROTOCOLO "PARAR E PERGUNTAR" (FAIL-SAFE):**
   - Se uma solicitação do usuário parecer ambígua, ou se atender ao pedido exigir modificar qualquer layout existente ou função já pronta, **PARE IMEDIATAMENTE**, NÃO altere o código e pergunte ao usuário antes de agir.
</SYSTEM_IMMUTABILITY_LOCK>

---

# 🎵 Regras Intocáveis de Domínio (Música, Violão e Acordes)
- **Diagramas de Acordes (Imutabilidade Anatômica):**
  * **PROIBIDO** alterar o layout estrutural, proporções e anatomia do braço do violão nas renderizações de SVG.
  * Manter sempre intacta a opção de visualização entre **Dedos** (posição original do diagrama) e **Intervalos** (composto por T, 3, 5, etc.).
- **Notação e Símbolos de Sétimas (Padrão Estrito):**
  * Representar sempre com clareza matemática e visual:
    * Sétima Menor: **`7m`**
    * Sétima Maior: **`7M`**

---

# 📐 Diretrizes de Design (APLICÁVEIS APENAS A NOVOS ELEMENTOS SOLICITADOS)
> **AVISO AO AGENTE:** Os princípios abaixo servem **EXCLUSIVAMENTE** como guia quando o usuário solicitar explicitamente a criação de um **NOVO** componente, tela ou funcionalidade do zero. **NUNCA** utilize estas diretrizes como justificativa para alterar, reestilizar ou refatorar telas e componentes que já existem no projeto.

### 1. Visão do Produto
O **LiLouPro** é uma solução comercial de alto padrão projetada para simplificar, organizar e elevar a experiência de ministérios de louvor e equipes de culto.

### 2. Mobile-First (Para novas criações)
- **Contexto de Uso:** Uso predominante em smartphones durante ensaios, cultos e planejamento, além de tablets e desktops para projeção.
- **Áreas de Toque:** Em novos botões e elementos interativos, garantir área de toque mínima confortável (`44px`), mantendo acesso direto e intuitivo com uma só mão em controles de violão/diagramas.

### 3. Padrão Visual e Operacional (Para novas criações)
- **Estética:** Manter fidelidade ao padrão Dark Mode atual do projeto, tipografia limpa (`Inter`, `Space Grotesk`) e ausência de ruído visual (sem logs desnecessários ou badges não solicitados).
- **Fluxo:** Garantir acesso rápido em poucos cliques e manter o padrão de transições já estabelecido no app.