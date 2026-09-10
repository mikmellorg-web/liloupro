import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Music, 
  Calendar, 
  Tv, 
  Users, 
  Sliders, 
  BookOpen, 
  Volume2, 
  Play, 
  HelpCircle, 
  CheckCircle2, 
  Lightbulb, 
  CloudOff, 
  Settings, 
  MessageSquare, 
  ShieldCheck, 
  Bookmark,
  Layers,
  ArrowRight,
  BookMarked,
  FileMusic,
  Radio,
  Clock
} from 'lucide-react';

export interface ScreenManualData {
  id: string;
  screenName: string;
  categoryBadge: string;
  icon: any;
  tagline: string;
  overview: string;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
  keyFeatures: {
    name: string;
    description: string;
    badge?: string;
  }[];
  proTips: string[];
  frequentQuestions: {
    question: string;
    answer: string;
  }[];
}

export const SCREEN_MANUALS: Record<string, ScreenManualData> = {
  // 1. Cifra & Player de Música (Detail view)
  song_detail: {
    id: 'song_detail',
    screenName: 'Cifra & Player de Música',
    categoryBadge: 'Música & Ensaio',
    icon: Music,
    tagline: 'Visualização completa de cifra com transposição, rolagem automática e player integrado.',
    overview: 'Esta tela é a estação principal para os músicos durante ensaios e ministrações no altar. Nela você transpõe o tom instantaneamente, estuda os acordes no braço do violão com visualização de Dedos ou Intervalos e ensaia acompanhando o áudio ou vídeo.',
    steps: [
      {
        title: '1. Ajuste o Tom da Canção (+1 / -1)',
        description: 'Use os botões de meio-tom (+1 e -1) no topo para transpor a harmonia em tempo real de acordo com a tessitura vocal do ministro.',
        tip: 'O tom original fica salvo como referência para você voltar quando quiser com um toque.'
      },
      {
        title: '2. Diagramas de Acordes: Dedos vs Intervalos',
        description: 'Toque em qualquer acorde no cabeçalho ou na letra para ver o diagrama anatômico no violão. Alterne entre a posição dos dedos (1, 2, 3, 4) e a análise teórica de intervalos (T, 3, 5, 7M).',
        tip: 'Todas as sétimas maiores são rotuladas como 7M e sétimas menores como 7m.'
      },
      {
        title: '3. Ensaie com o Player / Modo Pratique',
        description: 'Abra o Player na barra de ferramentas superior para tocar a canção com áudio de referência ou vídeo oficial do YouTube sem sair da cifra.',
        tip: 'Você também pode pedir ao assistente: "Tocar música [nome]" ou "Abrir player".'
      },
      {
        title: '4. Ative a Rolagem Automática ou Modo Foco',
        description: 'Toque no ícone de play de rolagem para que a tela desça suavemente enquanto você toca com as duas mãos no instrumento.',
        tip: 'O Modo Foco oculta menus e maximiza a visualização da cifra para uso no pedestal.'
      }
    ],
    keyFeatures: [
      { name: 'Transposer de Tom', description: 'Cálculo harmônico imediato com respeito a sustenidos e bemóis.', badge: '+1 / -1' },
      { name: 'Player de Áudio & Vídeo', description: 'YouTube e faixas guias integradas para ensaio sincronizado.', badge: 'Multimídia' },
      { name: 'Afinador & Metrônomo', description: 'Ferramentas de afinação cromática e BPM integradas na barra superior.', badge: 'Ferramentas' },
      { name: 'Pedal Bluetooth', description: 'Suporte a pedais de pé (AirTurn, PageTurner) para rolar estrofes.', badge: 'Hands-free' }
    ],
    proTips: [
      'Ative o "Modo Noturno" para reduzir o brilho no palco durante cultos escuros.',
      'Emparelhe seu pedal Bluetooth nas configurações da cifra para avançar estrofes com o pé.',
      'Você pode afinar seu violão ou guitarra usando o Afinador Cromático LiLouPro Tuner direto nesta tela.'
    ],
    frequentQuestions: [
      {
        question: 'Como mudar o tom sem perder a cifra original?',
        answer: 'O LiLouPro armazena o tom base original no cadastro da música. Transponha à vontade usando os botões + e -; o tom original sempre fica indicado no crachá.'
      },
      {
        question: 'Como manter a tela do celular ligada no pedestal?',
        answer: 'Ao ativar o Modo Foco ou a Rolagem Automática, o LiLouPro previne o bloqueio de tela automático do dispositivo (Wake Lock).'
      }
    ]
  },

  // 2. Repertório Geral de Músicas
  songs: {
    id: 'songs',
    screenName: 'Repertório de Músicas',
    categoryBadge: 'Músicas',
    icon: FileMusic,
    tagline: 'Acervo digital de músicas cifradas com busca inteligente e filtros.',
    overview: 'Gerencie todo o catálogo de músicas do seu ministério de louvor. Encontre qualquer canção por título, artista, tom ou tags temáticas, e adicione novas músicas com busca automática no Cifra Club e YouTube.',
    steps: [
      {
        title: '1. Busque e Filtre Músicas',
        description: 'Digite o título da música ou nome do cantor na barra de pesquisa. Você também pode filtrar por tom base, ritmo ou categoria (Celebração, Adoração, Ceia).',
        tip: 'A busca é instantânea e suporta termos parciais ou sem acentos.'
      },
      {
        title: '2. Cadastre uma Nova Canção (+ Nova Música)',
        description: 'Clique no botão "+ Nova Música" no canto superior. Digite o nome da canção e do artista e use a "Busca Automática" para puxar a cifra, tom, BPM e vídeo automaticamente.',
        tip: 'Você também pode colar sua própria versão personalizada de cifra e letra.'
      },
      {
        title: '3. Abra a Cifra ou o Player',
        description: 'Toque no card de qualquer música para abrir a cifra completa. Use o botão rápido de áudio para ensaiar diretamente.',
        tip: 'Todas as músicas visualizadas recentemente ficam disponíveis no modo Offline.'
      }
    ],
    keyFeatures: [
      { name: 'Busca Automática de Cifras', description: 'Integração inteligente com Cifra Club e YouTube para cadastro em segundos.', badge: 'IA & Web' },
      { name: 'Filtros por Tom e Categoria', description: 'Encontre rapidamente músicas em C, G, D ou para momentos específicos da liturgia.', badge: 'Filtros' },
      { name: 'Download Offline', description: 'Repertório salvo localmente para garantir acesso mesmo sem internet na igreja.', badge: 'Offline' }
    ],
    proTips: [
      'Mantenha as tags (Ex: "Abertura", "Ofertório", "Comunhão") atualizadas para montar playlists de cultos em segundos.',
      'Você pode pedir ao Liloupro Assistente: "Abra a cifra [nome da música]" para ir direto sem digitar.'
    ],
    frequentQuestions: [
      {
        question: 'Como importar uma cifra que não achei na busca automática?',
        answer: 'Na janela de "+ Nova Música", selecione "Inserção Manual" e cole o texto cifrado. O LiLouPro formatará os acordes automaticamente.'
      }
    ]
  },

  // 3. Escalas e Agenda de Cultos
  calendar: {
    id: 'calendar',
    screenName: 'Escalas & Agenda de Cultos',
    categoryBadge: 'Planejamento',
    icon: Calendar,
    tagline: 'Planejamento de cultos, montagem de escalas de voluntários e disparo de notificações.',
    overview: 'Organize as datas dos cultos e eventos da igreja. Escale ministros, instrumentistas, cantores e operadores de mídia, vinculando a lista de músicas e enviando notificações em tempo real aos membros.',
    steps: [
      {
        title: '1. Agende o Culto (+ Novo Agendamento)',
        description: 'Clique no botão "+ Novo Agendamento" no topo da tela de Escalas. Preencha a Identificação do Culto (ex: Culto de Celebração), selecione o Tema/Ocasião (Normal, Santa Ceia, Família, Jovens, Missões), defina Data e Horário, adicione o Link da Playlist do YouTube (opcional) e clique em "Criar Agendamento".',
        tip: 'O culto aparecerá imediatamente no calendário e na lista de celebrações do mês.'
      },
      {
        title: '2. Escale a Equipe ou Use a IA Inteligente',
        description: 'No card do culto agendado, clique no botão de escalar para selecionar os voluntários em cada função (Vocal, Violão, Teclado, Baixo, Bateria, Projeção, Som) ou clique em "Gerar Escala com IA" para preenchimento automático cruzando disponibilidades.',
        tip: 'O sistema bloqueia ou avisa se um músico marcou indisponibilidade na data selecionada.'
      },
      {
        title: '3. Vincule a Ordem de Músicas (Playlist)',
        description: 'Clique em "Lista de Músicas" no card do culto para adicionar as canções do repertório já nos tons corretos. Os voluntários poderão abrir as cifras com 1 toque.',
        tip: 'A lista sincroniza automaticamente com o Projetor Virtual no telão e TV.'
      },
      {
        title: '4. Compartilhe no WhatsApp ou Baixe em PDF',
        description: 'Clique no botão "WhatsApp" no topo para enviar a escala formatada com emojis para o grupo do ministério, ou em "Baixar Escala Mês" para exportar o PDF oficial.',
        tip: 'Você também pode clicar no ícone de WhatsApp individual de cada músico para convocações particulares.'
      }
    ],
    keyFeatures: [
      { name: 'Detector de Indisponibilidade', description: 'Previne escalar voluntários que avisaram viagem ou compromisso.', badge: 'Anti-conflito' },
      { name: 'Confirmação de Presença', description: 'Membros confirmam ou recusam a escala diretamente com 1 toque.', badge: 'Confirmação' },
      { name: 'Playlist Integrada', description: 'Vínculo imediato com as cifras do repertório para ensaio dos músicos.', badge: 'Sincronizado' }
    ],
    proTips: [
      'Monte as escalas com pelo menos 15 dias de antecedência para os músicos ensaiarem com calma.',
      'Use o campo "Observações da Escala" para informar figurino, referências ou horário de passagem de som.'
    ],
    frequentQuestions: [
      {
        question: 'Como os membros sabem que foram escalados?',
        answer: 'Ao abrir o LiLouPro, as próximas escalas aparecem com destaque no topo do painel inicial, com botões para Confirmar ou Recusar.'
      }
    ]
  },

  // 4. Liturgia & Cronograma do Culto
  liturgy: {
    id: 'liturgy',
    screenName: 'Liturgia & Ordem de Culto',
    categoryBadge: 'Culto & Projeção',
    icon: Tv,
    tagline: 'Cronograma detalhado do culto com temporizador e projeção de letras.',
    overview: 'Monte a linha do tempo do culto, dividida em blocos como Prelúdio, Louvor, Oração Pastoral, Dízimos e Avisos, Mensagem da Palavra e Bênção Final. Conecte cada momento a músicas do repertório e controle o telão.',
    steps: [
      {
        title: '1. Escolha o Culto a ser Planejado',
        description: 'Selecione o evento desejado na lista para visualizar ou editar a ordem cronológica dos momentos.',
        tip: 'Você pode duplicar uma liturgia anterior para manter o padrão litúrgico da igreja.'
      },
      {
        title: '2. Adicione os Blocos Litúrgicos',
        description: 'Clique em "+ Adicionar Bloco" para inserir seções com duração prevista, descrição e responsável pelo momento.',
        tip: 'Definir os minutos previstos ajuda a manter o culto pontual.'
      },
      {
        title: '3. Vincule as Canções da Playlist',
        description: 'Associe as músicas do repertório aos blocos de louvor e comunhão para gerar a sequência do projetor.',
        tip: 'O operador de mídia ou ministro pode disparar os slides diretamente desta tela.'
      }
    ],
    keyFeatures: [
      { name: 'Controle de Tempo (Cronômetro)', description: 'Acompanhe a duração real vs prevista de cada etapa do culto.', badge: 'Tempo' },
      { name: 'Vinculação de Cifras', description: 'Transição suave entre o cronograma geral e a partitura/cifra da canção.', badge: 'Repertório' },
      { name: 'Transmissão para o Telão', description: 'Atualização remota do telão sem cabos HDMI longos.', badge: 'Projeção' }
    ],
    proTips: [
      'Compartilhe o link da liturgia com os pastores e liderança para acompanhamento em tempo real.',
      'Você pode abrir o Projetor Virtual pelo botão superior ou pedir ao assistente: "Abra a projeção".'
    ],
    frequentQuestions: [
      {
        question: 'O ministro pode alterar a ordem das músicas durante o culto?',
        answer: 'Sim! Arraste os blocos ou músicas na lista; o LiLouPro sincroniza a nova ordem instantaneamente para o operador.'
      }
    ]
  },

  // 5. Projetor Virtual & Telão
  projection: {
    id: 'projection',
    screenName: 'Projetor Virtual & Telão',
    categoryBadge: 'Mídia & Telão',
    icon: Tv,
    tagline: 'Exibição de letras das músicas e avisos na TV ou projetor em tempo real.',
    overview: 'O módulo de projeção do LiLouPro funciona sem necessidade de cabos de vídeo caros ou softwares pesados. Abra a tela do projetor em qualquer Smart TV ou notebook conectado ao projetor e controle os slides do celular.',
    steps: [
      {
        title: '1. Conecte a TV ou Projetor',
        description: 'No computador ou Smart TV da igreja, abra o navegador e acesse o link de visualização da projeção.',
        tip: 'Pressione F11 no teclado do computador da TV para deixar em tela cheia.'
      },
      {
        title: '2. Selecione a Música ou Aviso',
        description: 'No seu celular ou mesa de controle, clique nos versos, refrões ou pontes da música que está sendo cantada.',
        tip: 'A letra muda na TV em milissegundos via WebSocket de alta performance.'
      },
      {
        title: '3. Controle Blackout e Telas Neutras',
        description: 'Use o botão "Apagar Telão (Blackout)" ou "Logo da Igreja" durante as orações ou ministrações espontâneas.',
        tip: 'Evite deixar letras paradas na tela quando a igreja não estiver cantando.'
      }
    ],
    keyFeatures: [
      { name: 'Sincronização Nuvem em Tempo Real', description: 'Comandos disparados do celular chegam à TV instantaneamente.', badge: 'WebSocket' },
      { name: 'Blackout & Modo Discreto', description: 'Apague ou congele a imagem com 1 clique durante orações.', badge: 'Controle' },
      { name: 'Formatação de Texto Auto-Scale', description: 'Ajusta automaticamente o tamanho da fonte para o tamanho da TV.', badge: 'Legibilidade' }
    ],
    proTips: [
      'Opere a projeção do próprio púlpito ou da mesa de som com qualquer smartphone conectado ao Wi-Fi.',
      'Ative fundos com contraste suave para facilitar a leitura da congregação nos fundos da nave.'
    ],
    frequentQuestions: [
      {
        question: 'Preciso de cabo HDMI conectado ao meu celular?',
        answer: 'Não! O LiLouPro funciona via nuvem e rede. A TV ou computador da mídia só precisa estar aberta na página do projetor.'
      }
    ]
  },

  // 6. Disponibilidade dos Músicos
  availability: {
    id: 'availability',
    screenName: 'Disponibilidade Mensal',
    categoryBadge: 'Voluntários',
    icon: Calendar,
    tagline: 'Marcação de datas livres e indisponibilidades dos voluntários para escalas.',
    overview: 'Permite que cada músico e cantor sinalize à liderança com antecedência os dias em que estará viajando, trabalhando ou disponível para ministrar, eliminando retrabalho na montagem das escalas.',
    steps: [
      {
        title: '1. Selecione o Mês de Referência',
        description: 'Navegue pelos meses futuros para planejar sua escala com antecedência.',
        tip: 'Mantenha sua disponibilidade preenchida até o dia 20 do mês anterior.'
      },
      {
        title: '2. Marque os Dias Livres ou Indisponíveis',
        description: 'Toque nos cultos do calendário para alternar entre Disponível (Verde) e Indisponível (Vermelho).',
        tip: 'Você pode adicionar um motivo curto (ex: "Viagem da família", "Plantão").'
      },
      {
        title: '3. Salve e Envie ao Líder',
        description: 'Clique em "Salvar Disponibilidade". O líder do ministério verá as indicações ao montar a próxima escala.',
        tip: 'Seus dados ficam sincronizados na nuvem em tempo real.'
      }
    ],
    keyFeatures: [
      { name: 'Calendário com Toque Rápido', description: 'Alterne status de cada domingo com apenas um clique.', badge: 'Rápido' },
      { name: 'Motivo de Indisponibilidade', description: 'Comunicação transparente com a liderança do ministério.', badge: 'Notas' }
    ],
    proTips: [
      'Se surgir um imprevisto após o envio, você pode atualizar sua disponibilidade a qualquer momento.',
      'Líderes recebem um resumo automático de quem está livre para cada culto.'
    ],
    frequentQuestions: [
      {
        question: 'Se eu marcar indisponível, o líder ainda consegue me escalar?',
        answer: 'O sistema exibe um aviso claro ao líder indicando que você está indisponível na data, prevenindo erros involuntários.'
      }
    ]
  },

  // 7. Bíblia Sagrada & Leitor Inteligente
  bible: {
    id: 'bible',
    screenName: 'Bíblia Sagrada',
    categoryBadge: 'Devocional & Estudo',
    icon: BookOpen,
    tagline: 'Leitor bíblico rápido com navegação por capítulos, versículos e comandos de voz.',
    overview: 'Acesse todos os 66 livros da Bíblia Sagrada diretamente no LiLouPro para devocionais, estudos ou leitura de apoio durante os cultos. Suporta busca por comando de voz como "Abra a bíblia no Salmo 23".',
    steps: [
      {
        title: '1. Escolha o Livro e Capítulo',
        description: 'Toque no seletor no topo para escolher entre Antigo ou Novo Testamento, selecionando o livro e capítulo desejado.',
        tip: 'Você pode usar o campo de busca rápida para filtrar livros em segundos.'
      },
      {
        title: '2. Destaque e Leia Versículos',
        description: 'Acompanhe a leitura com tipografia limpa, alto contraste e rolagem confortável para púlpito.',
        tip: 'Dê dois toques em um versículo para marcá-lo ou compartilhá-lo.'
      },
      {
        title: '3. Use o Liloupro Assistente de Voz',
        description: 'Diga ao assistente: "Abra a bíblia em João 3:16" ou "Abra o salmo 91" para ir direto à passagem!',
        tip: 'O assistente compreende abreviações e números falados naturalmente.'
      }
    ],
    keyFeatures: [
      { name: 'Navegação por Voz', description: 'Reconhece citações bíblicas faladas em português.', badge: 'Voz' },
      { name: 'Modo Leitura Limpa', description: 'Sem anúncios, com fontes agradáveis para leitura prolongada.', badge: 'Foco' }
    ],
    proTips: [
      'Mantenha a Bíblia aberta no celular durante o culto para acompanhar a pregação sem alternar de aplicativo.',
      'Você pode projetar o versículo lido diretamente na TV para a congregação acompanhar.'
    ],
    frequentQuestions: [
      {
        question: 'Funciona sem internet?',
        answer: 'Sim! Os textos bíblicos essenciais ficam em cache no dispositivo para consulta imediata.'
      }
    ]
  },

  // 8. Equipe & Gestão de Membros
  members: {
    id: 'members',
    screenName: 'Gestão de Membros & Equipe',
    categoryBadge: 'Equipe',
    icon: Users,
    tagline: 'Cadastro de voluntários, definição de instrumentos e controle de acesso.',
    overview: 'Cadastre e gerencie todos os músicos, cantores, técnicos de áudio, cinegrafistas e voluntários do ministério de louvor. Atribua os instrumentos que cada um domina e conceda permissões de Administrador ou Membro.',
    steps: [
      {
        title: '1. Adicione Novos Membros',
        description: 'Clique em "+ Novo Membro" ou envie o link/código de convite da igreja para que os voluntários se cadastrem sozinhos.',
        tip: 'O cadastro via código de acesso é a forma mais rápida de integrar a equipe toda.'
      },
      {
        title: '2. Defina os Instrumentos e Funções',
        description: 'Marque quais funções o voluntário exerce (Vocal, Violão, Guitarra, Baixo, Teclado, Bateria, Mídia, Áudio).',
        tip: 'Membros com múltiplos instrumentos aparecem nas opções de cada categoria ao montar escalas.'
      },
      {
        title: '3. Gerencie Permissões (Admin vs Membro)',
        description: 'Líderes e pastores devem ter perfil "Admin" para editar escalas e repertório. Músicos recebem perfil "Membro" para visualizar e confirmar.',
        tip: 'Você pode alterar o cargo de qualquer voluntário a qualquer momento.'
      }
    ],
    keyFeatures: [
      { name: 'Múltiplos Instrumentos', description: 'Associe violão, vocal e teclado a um mesmo voluntário.', badge: 'Multifunção' },
      { name: 'Convite por Link ou Código', description: 'Facilita a entrada de novos integrantes sem digitação manual.', badge: 'Acesso' }
    ],
    proTips: [
      'Mantenha o número de WhatsApp e e-mail dos membros atualizados para garantir a entrega de lembretes de ensaio.'
    ],
    frequentQuestions: [
      {
        question: 'Como convidar os músicos do meu ministério?',
        answer: 'Envie o código de acesso da igreja gerado no painel. Ao baixar o LiLouPro, o voluntário insere o código e entra direto na equipe.'
      }
    ]
  },

  // 9. Teoria Musical & Campo Harmônico
  theory: {
    id: 'theory',
    screenName: 'Teoria Musical & Campo Harmônico',
    categoryBadge: 'Estudo & Aperfeiçoamento',
    icon: Sparkles,
    tagline: 'Ferramentas didáticas de campo harmônico, funções e círculo de quintas.',
    overview: 'Evolua a harmonia da sua equipe com estudos práticos de Campo Harmônico Maior e Menor, Círculo de Quintas interativo, funções de acordes (Tônica, Subdominante, Dominante) e questionários de fixação.',
    steps: [
      {
        title: '1. Selecione o Tom de Referência',
        description: 'Escolha uma tonalidade para calcular automaticamente todos os 7 graus do campo harmônico com suas respectivas tétrades.',
        tip: 'Perceba a relação entre graus maiores (I, IV, V) e menores (ii, iii, vi).'
      },
      {
        title: '2. Explore as Funções Harmônicas',
        description: 'Aprenda a função de cada acorde em um louvor: Repouso (Tônica), Movimento (Subdominante) e Tensão (Dominante).',
        tip: 'Essencial para ministros e músicos que desejam tirar músicas de ouvido.'
      },
      {
        title: '3. Teste seus Conhecimentos no Quiz',
        description: 'Responda questionários rápidos sobre intervalos, sétimas e montagem de acordes no violão.',
        tip: 'Excelente para capacitar novos voluntários do ministério.'
      }
    ],
    keyFeatures: [
      { name: 'Cálculo de Graus Automático', description: 'Veja I, ii, iii, IV, V, vi, vii° instantaneamente em qualquer tom.', badge: 'Harmonia' },
      { name: 'Visualização Didática', description: 'Cores e gráficos explicativos focados na prática do worship.', badge: 'Didático' }
    ],
    proTips: [
      'Pratique substituir acordes comuns pelos seus relativos menores para enriquecer a introdução ou ponte das músicas.'
    ],
    frequentQuestions: [
      {
        question: 'Por que o LiLouPro diferencia 7m de 7M?',
        answer: 'Porque a sétima maior (7M) tem sonoridade límpida e aberta (acorde com décima primeira / maj7), enquanto a 7m prepara a tensão dominante.'
      }
    ]
  },

  // 10. Acesso Offline & Cifras Salvas
  offline: {
    id: 'offline',
    screenName: 'Modo Offline & Cifras Salvas',
    categoryBadge: 'Segurança & Palco',
    icon: CloudOff,
    tagline: 'Acesso garantido a cifras e escalas mesmo sem sinal de internet ou Wi-Fi.',
    overview: 'Igrejas frequentemente sofrem com instabilidade ou falta de sinal de celular no altar. O LiLouPro armazena silenciosamente suas cifras e próximas escalas no dispositivo para que o culto nunca seja interrompido.',
    steps: [
      {
        title: '1. Sincronização Automática',
        description: 'Sempre que você visualiza uma música online, o LiLouPro armazena os acordes e letras na memória segura do seu navegador.',
        tip: 'Abra o app antes de sair de casa para carregar as últimas atualizações.'
      },
      {
        title: '2. Transição Sem Fricção',
        description: 'Se a conexão cair durante o ensaio ou culto, um aviso discreto aparece e a cifra continua abrindo normalmente.',
        tip: 'Você continua podendo transpor o tom e usar a rolagem automática mesmo desconectado.'
      }
    ],
    keyFeatures: [
      { name: 'Cache Local Criptografado', description: 'Armazenamento rápido sem consumir memória pesada do celular.', badge: 'Cache' },
      { name: 'Transposição 100% Offline', description: 'O algoritmo de cálculo de acordes roda diretamente no processador do aparelho.', badge: 'Local' }
    ],
    proTips: [
      'Você pode instalar o LiLouPro como aplicativo (PWA) no celular para ter ícone na tela inicial e abertura instantânea.'
    ],
    frequentQuestions: [
      {
        question: 'Preciso ativar algum botão para salvar offline?',
        answer: 'Não! O salvamento é automático ao abrir as cifras ou receber escalas.'
      }
    ]
  },

  // 11. Home / Painel Principal
  home: {
    id: 'home',
    screenName: 'Painel Principal & Minhas Escalas',
    categoryBadge: 'Visão Geral',
    icon: Bookmark,
    tagline: 'Resumo das próximas ministrações, confirmação de escalas e atalhos rápidos.',
    overview: 'É o centro de comando do seu dia a dia no LiLouPro. Como líder, acompanhe status de cultos e escalas. Como músico, veja de imediato suas próximas escalas e confirme sua presença com apenas um toque.',
    steps: [
      {
        title: '1. Confirme suas Escalas Pendentes',
        description: 'No topo da tela, verifique os cultos em que você foi escalado e clique em "Confirmar Presença" para avisar o líder.',
        tip: 'Se não puder comparecer, clique em Recusar e adicione uma justificativa rápida.'
      },
      {
        title: '2. Acesse a Lista de Músicas do Culto',
        description: 'Toque no card da sua próxima escala para ver a sequência de canções e abrir as cifras cifradas de cada uma.',
        tip: 'Ensaiar a sequência exata do culto aumenta a segurança da equipe no domingo.'
      },
      {
        title: '3. Acompanhe Avisos da Equipe',
        description: 'Fique por dentro de mensagens pastorais, horários de passagem de som e comunicados gerais.',
        tip: 'Toque no botão do Liloupro Assistente a qualquer momento para tirar dúvidas.'
      }
    ],
    keyFeatures: [
      { name: 'Confirmação com 1 Toque', description: 'Feedback imediato para os líderes saberem a formação da equipe.', badge: 'Confirmação' },
      { name: 'Atalho Direto para Cifras', description: 'Abra as músicas do culto sem precisar pesquisar pelo repertório.', badge: 'Produtividade' }
    ],
    proTips: [
      'Adicione o LiLouPro à tela de início do seu smartphone para receber alertas de novas escalas.'
    ],
    frequentQuestions: [
      {
        question: 'Onde vejo quem mais vai tocar comigo no culto?',
        answer: 'Toque no card do culto para expandir os nomes de todos os músicos e cantores escalados.'
      }
    ]
  },

  // 12. Comunicação & Chat da Equipe
  chat: {
    id: 'chat',
    screenName: 'Comunicação & Chat da Equipe',
    categoryBadge: 'Comunicação',
    icon: MessageSquare,
    tagline: 'Canal de mensagens e avisos diretos para os membros do ministério.',
    overview: 'Comunicação focada exclusivamente no ministério de louvor, sem a dispersão de grupos pessoais de mensagens. Compartilhe avisos, referências musicais e instruções de culto.',
    steps: [
      {
        title: '1. Leia os Comunicados Oficiais',
        description: 'Avisos da liderança ficam fixados no topo do canal para que nenhum voluntário perca informações cruciais.',
        tip: 'Perfeito para definir cor da camisa/figurino e horários de oração pré-culto.'
      },
      {
        title: '2. Envie Mensagens e Dúvidas',
        description: 'Tire dúvidas sobre arranjos ou trocas de escala diretamente com seus colegas de equipe.',
        tip: 'Mantenha as mensagens objetivas para valorizar o tempo de todos.'
      }
    ],
    keyFeatures: [
      { name: 'Avisos Fixados', description: 'Informações importantes não somem no fluxo de mensagens.', badge: 'Fixado' },
      { name: 'Foco Ministerial', description: 'Canal limpo dedicado apenas aos cultos da igreja.', badge: 'Sem Ruído' }
    ],
    proTips: [
      'Use o chat para avisar imprevistos de trânsito ou atrasos na passagem de som.'
    ],
    frequentQuestions: [
      {
        question: 'Todos os membros da igreja têm acesso ao chat?',
        answer: 'Apenas os membros aceitos na equipe de louvor da sua igreja cadastrada no LiLouPro têm acesso.'
      }
    ]
  },

  // 13. Configurações Gerais & Ministério
  settings: {
    id: 'settings',
    screenName: 'Configurações Gerais & Perfil',
    categoryBadge: 'Preferências',
    icon: Settings,
    tagline: 'Personalização de tema, preferências de acordes e dados da igreja.',
    overview: 'Personalize sua experiência no LiLouPro. Alterne entre o tema Claro ou Escuro (Dark Mode), gerencie o nome da igreja, código de convite da congregação e notificações.',
    steps: [
      {
        title: '1. Tema Visual (Claro ou Escuro)',
        description: 'Escolha o modo escuro para poupar bateria e ter discrição no altar escuro, ou o modo claro para ambientes iluminados.',
        tip: 'O tema ajusta automaticamente o contraste de todos os diagramas de acordes.'
      },
      {
        title: '2. Código de Convite da Congregação',
        description: 'Copie o código exclusivo da sua igreja para passar a novos voluntários que baixarem o aplicativo.',
        tip: 'Você também pode gerar um link direto para envio no WhatsApp da equipe.'
      }
    ],
    keyFeatures: [
      { name: 'Dark Mode Nativo', description: 'Contraste impecável sem cansar a visão em ministrações longas.', badge: 'Visual' },
      { name: 'Gerenciador de Notificações', description: 'Configure alertas de novas escalas e lembretes de ensaio.', badge: 'Alertas' }
    ],
    proTips: [
      'Verifique se as notificações push estão autorizadas no seu navegador para não perder prazos de escalas.'
    ],
    frequentQuestions: [
      {
        question: 'Posso mudar a senha da minha conta?',
        answer: 'Sim, você pode atualizar sua senha ou dados de perfil a qualquer momento nesta aba.'
      }
    ]
  }
};

export interface ScreenInteractiveManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  initialScreenKey?: string;
  onOpenHelpCenter?: () => void;
  onActionTrigger?: (action: string) => void;
}

export function ScreenInteractiveManualModal({
  isOpen,
  onClose,
  theme = 'dark',
  initialScreenKey = 'home',
  onOpenHelpCenter,
  onActionTrigger
}: ScreenInteractiveManualModalProps) {
  const isLight = theme === 'light';

  // Current screen key selection
  const [selectedKey, setSelectedKey] = useState<string>(initialScreenKey);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'steps' | 'features' | 'faq'>('steps');

  useEffect(() => {
    if (initialScreenKey && SCREEN_MANUALS[initialScreenKey]) {
      setSelectedKey(initialScreenKey);
    } else {
      setSelectedKey('home');
    }
    setActiveStepIndex(0);
    setActiveTab('steps');
  }, [initialScreenKey, isOpen]);

  const manual = SCREEN_MANUALS[selectedKey] || SCREEN_MANUALS['home'];
  const IconComponent = manual.icon || BookOpen;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[260] flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className={`relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
            isLight 
              ? 'bg-white text-slate-900 border-slate-200' 
              : 'bg-slate-950 text-slate-100 border-blue-500/30 shadow-blue-950/40'
          }`}
        >
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <IconComponent size={20} strokeWidth={2.4} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-sky-400 border border-blue-500/30">
                    {manual.categoryBadge}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Manual Interativo
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  Como usar: {manual.screenName}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-500/15 transition-all shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Fechar manual"
            >
              <X size={20} />
            </button>
          </div>

          {/* Screen Switcher (Quick Pills) */}
          <div className={`px-4 py-2.5 border-b flex items-center gap-2 overflow-x-auto no-scrollbar text-xs ${
            isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-900/50 border-slate-850'
          }`}>
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 shrink-0 mr-1">
              Outras telas:
            </span>
            {Object.keys(SCREEN_MANUALS).map(key => {
              const item = SCREEN_MANUALS[key];
              const isSelected = selectedKey === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedKey(key);
                    setActiveStepIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 min-h-[34px] flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                      : isLight
                        ? 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
                        : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{item.screenName.split('&')[0].trim()}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Tabs: Passo a Passo, Recursos, Dúvidas */}
          <div className={`px-4 pt-3 border-b flex items-center gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-850'
          }`}>
            <button
              onClick={() => setActiveTab('steps')}
              className={`pb-2.5 px-2 text-xs sm:text-sm font-black transition-all border-b-2 relative ${
                activeTab === 'steps' 
                  ? 'border-blue-500 text-sky-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Passo a Passo Guiado ({manual.steps.length})
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`pb-2.5 px-2 text-xs sm:text-sm font-black transition-all border-b-2 relative ${
                activeTab === 'features' 
                  ? 'border-blue-500 text-sky-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Recursos & Dicas
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`pb-2.5 px-2 text-xs sm:text-sm font-black transition-all border-b-2 relative ${
                activeTab === 'faq' 
                  ? 'border-blue-500 text-sky-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Dúvidas Frequentes
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Tagline / Overview */}
            <div className={`p-4 rounded-2xl border ${
              isLight 
                ? 'bg-blue-50/60 border-blue-200/80 text-slate-800' 
                : 'bg-blue-950/25 border-blue-500/20 text-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-sky-400 shrink-0 mt-0.5">
                  <Lightbulb size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-sky-400">
                    {manual.tagline}
                  </h4>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300">
                    {manual.overview}
                  </p>
                </div>
              </div>
            </div>

            {/* TAB 1: STEP BY STEP */}
            {activeTab === 'steps' && (
              <div className="space-y-4">
                {/* Step indicators */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Etapa {activeStepIndex + 1} de {manual.steps.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {manual.steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveStepIndex(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === activeStepIndex 
                            ? 'w-6 bg-blue-500' 
                            : 'w-2 bg-slate-700 hover:bg-slate-600'
                        }`}
                        title={`Ir para passo ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Active Step Card */}
                {manual.steps[activeStepIndex] && (
                  <motion.div
                    key={activeStepIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-5 rounded-2xl border space-y-3 shadow-lg ${
                      isLight 
                        ? 'bg-white border-slate-200 shadow-slate-200/50' 
                        : 'bg-slate-900/90 border-slate-800 shadow-black/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/30">
                        {activeStepIndex + 1}
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-100">
                        {manual.steps[activeStepIndex].title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-[13px] leading-relaxed text-slate-300 pl-11">
                      {manual.steps[activeStepIndex].description}
                    </p>

                    {manual.steps[activeStepIndex].tip && (
                      <div className={`mt-3 p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                        isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-500/20 text-amber-300'
                      }`}>
                        <Sparkles size={16} className="shrink-0 mt-0.5 text-amber-400" />
                        <div>
                          <strong className="font-extrabold uppercase tracking-wide mr-1">Dica Prática:</strong>
                          <span>{manual.steps[activeStepIndex].tip}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                    disabled={activeStepIndex === 0}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all min-h-[44px] ${
                      activeStepIndex === 0 
                        ? 'opacity-40 cursor-not-allowed text-slate-500' 
                        : isLight 
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <ChevronLeft size={16} />
                    <span>Anterior</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeStepIndex < manual.steps.length - 1) {
                        setActiveStepIndex(prev => prev + 1);
                      } else {
                        setActiveTab('features');
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-sky-400 transition-all flex items-center gap-2 min-h-[44px] active:scale-95"
                  >
                    <span>{activeStepIndex < manual.steps.length - 1 ? 'Próximo Passo' : 'Ver Recursos e Dicas'}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: KEY FEATURES & PRO TIPS */}
            {activeTab === 'features' && (
              <div className="space-y-5">
                {/* Features Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sliders size={15} className="text-sky-400" />
                    <span>Principais Recursos Desta Tela</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {manual.keyFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border space-y-1.5 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-black text-xs text-slate-200">{feat.name}</h5>
                          {feat.badge && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/20 text-sky-400 border border-blue-500/30">
                              {feat.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          {feat.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tips */}
                {manual.proTips && manual.proTips.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Sparkles size={15} />
                      <span>Dicas de Ouro para o Ministério</span>
                    </h4>
                    <div className="space-y-2">
                      {manual.proTips.map((tip, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                            isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-950/20 border-amber-500/20 text-amber-200'
                          }`}
                        >
                          <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FAQS */}
            {activeTab === 'faq' && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <HelpCircle size={15} className="text-sky-400" />
                  <span>Dúvidas Mais Comuns Nesta Função</span>
                </h4>
                <div className="space-y-3">
                  {manual.frequentQuestions.map((faq, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border space-y-1.5 ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <h5 className="font-extrabold text-xs text-sky-400 flex items-center gap-2">
                        <span>❓</span>
                        <span>{faq.question}</span>
                      </h5>
                      <p className="text-xs leading-relaxed text-slate-300 pl-5">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-4 border-t flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              {onOpenHelpCenter && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenHelpCenter();
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-1.5 min-h-[44px] px-2"
                >
                  <BookOpen size={15} />
                  <span className="hidden sm:inline">Abrir Central Completa de Tutoriais</span>
                  <span className="sm:hidden">Tutoriais</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-extrabold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-500/25 min-h-[44px] flex items-center gap-1.5"
            >
              <span>Entendi, voltar ao app</span>
              <CheckCircle2 size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
