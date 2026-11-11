# Plano de Melhoria Visual da Landing Page com Fotos Reais do LiLouPro

Aprimoramento cirúrgico da Landing Page para exibir capturas de tela reais do LiLouPro diretamente nos **Cards dos 9 Módulos** e no **Simulador Interativo**, destacando **Cifras/Dicionário de Acordes/Modo Foco**, **Escalas Inteligentes/Confirmação no Celular** e **Liturgia do Culto/Projeção no Telão** a partir das imagens enviadas pelo usuário no chat.

## User Review & Critical Decisions

> [!IMPORTANT]
> Como você escolheu enviar os prints e fotos reais aqui no chat, após aprovar este plano (ou junto com sua próxima mensagem), basta anexar as imagens das telas na ordem ou ritmo que preferir para aplicarmos diretamente na página.

- **Decisão Confirmada 1 (Origem das Imagens)**: Utilizar exclusivamente os prints e fotos reais enviados por você no chat, mantendo 100% da resolução nativa (`landing-crisp-img`).
- **Decisão Confirmada 2 (Foco de Destaque)**: Priorizar visualmente as telas de **Cifras, Dicionário de Acordes e Modo Foco**, **Escalas Inteligentes e Confirmação no Celular**, e **Liturgia do Culto e Projeção no Telão**.
- **Decisão Confirmada 3 (Seções Alvo)**:
  1. **Cards dos 9 Módulos**: Passar a exibir a miniatura nítida da foto real diretamente dentro do card na página (e não apenas escondida dentro do modal), mantendo a ampliação em tela cheia ao clicar.
  2. **Simulador Interativo ("Veja o sistema em funcionamento")**: Configurar os 3 cenários interativos (*Escalas sem retrabalho*, *Cifra no tom exato* e *Projeção e Liturgia*) com as fotos reais correspondentes.

## 1. Overview & Core Concept

- **What It Does**: Transforma a vitrine de funcionalidades e o simulador da Landing Page em uma demonstração visual autêntica do LiLouPro, onde cada módulo e cenário exibe a interface real do aplicativo diretamente na rolagem da página.
- **Target Audience / Persona**: Líderes de louvor, pastores, músicos e equipes de mídia avaliando o LiLouPro na página de vendas.
- **Key Value**: Permite que o visitante veja imediatamente o padrão visual profissional do aplicativo (diagramas de acordes, confirmação de escala e projeção/liturgia) sem precisar clicar em múltiplos modais para descobrir como é a tela real.

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Seção dos 9 Módulos**: Ao rolar pelos cards de funcionalidades, os módulos que possuem foto real exibem uma vitrine visual em alta definição integrada ao card. Ao clicar no card, o visitante abre o modal com a imagem ampliada e os detalhes completos.
  2. **Simulador Interativo**: Ao alternar entre os 3 cenários (*1. Escalas Inteligentes*, *2. Cifras, Acordes & Modo Foco*, *3. Liturgia & Projeção no Telão*), o painel direito exibe a foto real em alta resolução correspondente a cada fluxo.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Mantém 100% a identidade Dark Mode (`#070b14`, cards `bg-slate-900/60`, bordas `border-white/10` e destaques `brand`).
  - *Color Palette & Mood*: Inalterada, respeitando o congelamento visual do aplicativo.
  - *Typography & Hierarchy*: Inalterada.
  - *Component Styling & Layout*: Molduras elegantes com cantos arredondados (`rounded-2xl`), proporção preservada (`object-contain` / `object-cover` sem corte de informações importantes) e renderização nítida (`landing-crisp-img`).
- **Interactive Feedback & Motion**: Transição suave ao alternar entre os cenários do simulador e efeito de zoom sutil (`group-hover:scale-[1.02]`) nas fotos visíveis nos cards dos módulos.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Exibição Direta nos Cards dos Módulos + Ampliação no Modal**
  - *Chosen Approach*: Renderizar a imagem real diretamente no corpo de cada card de módulo na página principal quando houver foto configurada, além de exibi-la em tamanho grande ao abrir o modal do módulo.
  - *Why*: Atende diretamente à escolha de ter os *"Cards dos 9 Módulos com fotos visíveis direto na página"*, aumentando o impacto visual imediato durante a leitura da página.
  - *Alternatives Considered*: Manter a foto apenas dentro do modal ao clicar — descartado porque muitos visitantes rolam a página sem clicar em cada card individualmente.
- **Decision 2: Mapeamento Padrão no Código + Cache Versionado**
  - *Chosen Approach*: Incorporar os prints reais que você enviar diretamente como imagens padrão oficiais dos respectivos módulos e cenários do simulador, versionando a chave de cache para atualização imediata.
  - *Why*: Garante que qualquer visitante em qualquer dispositivo veja as fotos reais imediatamente ao abrir a página de vendas.

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────┐
│                      CommercialLandingPage                           │
├──────────────────────────────────────────────────────────────────────┤
│  1. LandingHeroAndChallenges                                         │
│     └── Hero Principal (Já atualizado com foto multidispositivo)     │
│                                                                      │
│  2. LandingBenefitsAndFeatures                                       │
│     ├── Grid dos 9 Módulos (Cards com Foto Real Visível na Página)   │
│     │     ├── Escalas Inteligentes (escala)                          │
│     │     ├── Repertório Centralizado (repertorio)                   │
│     │     ├── Cifras, Acordes & Modo Foco (cifras)                   │
│     │     ├── Ordem Litúrgica (liturgia)                             │
│     │     ├── Projeção & Telão (projecao)                            │
│     │     └── Demais Módulos (comunicacao, membros, pwa, seguranca)  │
│     │                                                                │
│     └── Simulador Interativo (Veja o sistema em funcionamento)       │
│           ├── Cenário 1: Escalas Inteligentes & Confirmação          │
│           ├── Cenário 2: Cifras, Acordes & Modo Foco                 │
│           └── Cenário 3: Liturgia do Culto & Projeção no Telão       │
└──────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `defaultModuleImages`: Mapa estático associando os IDs dos módulos (`escala`, `cifras`, `liturgia`, `projecao`, etc.) às fotos reais enviadas no chat.
  - `defaultSimulatorMedia`: Mapa estático associando os 3 cenários (`0: Escalas`, `1: Cifras/Acordes`, `2: Liturgia/Projeção`) às fotos reais enviadas no chat.
- **Interactive Component & State Mapping**:
  - Cada card de módulo verifica `moduleImages[item.id] || defaultModuleImages[item.id]` e renderiza a prévia visual diretamente no card e no modal de detalhes.
  - O Simulador Interativo verifica `simulatorMedia[activeDemo] || defaultSimulatorMedia[activeDemo]` e exibe a tela real correspondente a cada aba selecionada.
