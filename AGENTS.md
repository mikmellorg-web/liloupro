# Liloupro - Diretrizes de Desenvolvimento e Foco do Produto

Este arquivo estabelece os valores, objetivos de design e regras de desenvolvimento para o **Liloupro** com o objetivo de torná-lo o melhor aplicativo de gestão de louvor e culto do mercado.

## 🎯 Visão do Produto
O **Liloupro** deve ser uma solução fantástica e de valor comercial (vendável), projetada para simplificar, organizar e elevar a experiência de ministérios de louvor e equipes de culto.

## 📱 Princípios de Usabilidade e Design

### 1. Mobile-First como Prioridade Absoluta
* **Contexto de Uso**: Ministros, músicos e líderes usam predominantemente smartphones durante ensaios, cultos e planejamento diário.
* **Layouts Responsivos**: Todo componente e tela deve ser testado e otimizado para pequenos formatos antes de telas maiores. 
* **Áreas de Toque**: Botões e elementos interativos devem ter tamanho mínimo de trigger de toque confortável (mínimo de 44px). No violão e diagramas, o acesso de alternar dedos/intervalos e outros menus deve ser direto e intuitivo com uma mão só.

### 2. Elegância e Alta Performance
* **Visual Premium**: Utilizar espaçamentos generosos (negative space), tipografia limpa (Inter, Space Grotesk) e contrastes assertivos com suporte impecável ao modo escuro (Dark Mode).
* **Ausência de Ruído**: Menos é mais. Evitar visual poluído, logs desnecessários, badges excessivos ou dados técnicos irrelevantes para o usuário final.

### 3. Eficiência Operacional
* **Acesso Rápido**: O usuário deve alcançar as ferramentas vitais (cifras, repertórios, diagramas de acordes, escalas de ministério) no menor número de cliques possíveis.
* **Transições Fluídas**: Utilizar animações de transição suaves (via Framer Motion / Motion) para feedbacks de interação refinados.

## 🎵 Regras Específicas do Domínio (Música e Acordes)
* **Diagramas de Acordes**:
  * Oferecer sempre a opção de visualização entre **Dedos** (posição original do diagrama) e **Intervalos** (composto por T, 3, 5, etc).
  * **Símbolos de Sétimas**: Representar com clareza matemática e visual:
    * Sétima Menor: **7m**
    * Sétima Maior: **7M**
  * Não alterar o layout estrutural e anatômico do braço do violão nas renderizações de SVG.
