export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BiblePassageResponse {
  reference: string;
  text: string;
  verses: BibleVerse[];
  isFallback: boolean;
  warning: string | null;
  isDemo?: boolean;
}

const OFFLINE_PASSAGES: Record<string, Record<number, BibleVerse[]>> = {
  "joão": {
    1: [
      { verse: 1, text: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus." },
      { verse: 2, text: "Ele estava no princípio com Deus." },
      { verse: 3, text: "Todas as coisas foram feitas por meio dele, e, sem ele, nada do que foi feito se fez." },
      { verse: 4, text: "Nele estava a vida, e a vida era a luz dos homens." },
      { verse: 5, text: "A luz resplandece nas trevas, e as trevas não prevaleceram contra ela." },
      { verse: 6, text: "Houve um homem enviado por Deus, cujo nome era João." },
      { verse: 7, text: "Este veio como testemunha para testificar a respeito da luz, a fim de que todos cressem por meio dele." },
      { verse: 8, text: "Ele não era a luz, mas veio para testificar da luz." },
      { verse: 9, text: "A saber, a verdadeira luz, que ilumina a todo homem, estava vindo ao mundo." },
      { verse: 10, text: "O Verbo estava no mundo, o mundo foi feito por meio dele, mas o mundo não o conheceu." },
      { verse: 11, text: "Veio para o que era seu, e os seus não o receberam." },
      { verse: 12, text: "Mas, a todos quantos o receberam, deu-lhes o poder de serem feitos filhos de Deus, a saber, aos que creem no seu nome," },
      { verse: 13, text: "os quais não nasceram do sangue, nem da vontade da carne, nem da vontade do homem, mas de Deus." },
      { verse: 14, text: "E o Verbo se fez carne e habitou entre nós, cheio de graça e de verdade, e vimos a sua glória, glória como do Unigênito do Pai." }
    ],
    3: [
      { verse: 1, text: "Havia um homem entre os fariseus, chamado Nicodemos, um dos principais dos judeus." },
      { verse: 2, text: "Este, de noite, foi falar com Jesus e lhe disse: — Rabi, sabemos que o senhor é Mestre vindo da parte de Deus; porque ninguém pode fazer estes sinais que o senhor faz, se Deus não estiver com ele." },
      { verse: 3, text: "Jesus respondeu: — Em verdade, in verdade lhe digo que, se alguém não nascer de novo, não pode ver o Reino de Deus." },
      { verse: 16, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo o que nele crê não pereça, mas tenha a vida eterna." },
      { verse: 17, text: "Porque Deus enviou o seu Filho ao mundo, não para condenar o mundo, mas para que o mundo fosse salvo por meio dele." },
      { verse: 18, text: "Quem nele crê não é condenado; mas o que não crê já está condenado, porque não crê no nome do unigênito Filho de Deus." },
      { verse: 19, text: "A condenação é esta: a luz veio ao mundo, mas os homens amaram mais as trevas do que a luz, porque as suas obras eram más." },
      { verse: 20, text: "Pois todo aquele que pratica o mal odeia a luz e não se aproxima da luz, para que as suas obras não sejam reprovadas." },
      { verse: 21, text: "Mas quem pratica a verdade aproxima-se da luz, a fim de que as suas obras sejam manifestas, porque são feitas em Deus." }
    ]
  },
  "salmos": {
    23: [
      { verse: 1, text: "O Senhor é o meu pastor; nada me faltará." },
      { verse: 2, text: "Ele me faz deitar em verdes pastos e me guia mansamente a águas tranquilas." },
      { verse: 3, text: "Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome." },
      { verse: 4, text: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo; o teu bordão e o teu cajado me consolam." },
      { verse: 5, text: "Preparas uma mesa diante de mim na presença dos meus inimigos, unges a minha cabeça com óleo, o meu cálice transborda." },
      { verse: 6, text: "A bondade e a misericórdia certamente me seguirão todos os dias da minha vida; e habitarei na Casa do Senhor para sempre." }
    ],
    91: [
      { verse: 1, text: "Aquele que habita no esconderijo do Altíssimo e descansa à sombra do Onipotente" },
      { verse: 2, text: "diz ao Senhor: 'Meu refúgio e minha fortaleza, meu Deus, em quem confio.'" },
      { verse: 3, text: "Pois ele livrará você do laço do passarinheiro e da peste perniciosa." },
      { verse: 4, text: "Ele o cobrirá com as suas penas, e sob as suas asas você estará seguro; a sua fidelidade é escudo e proteção." },
      { verse: 5, text: "Você não terá medo do terror da noite, nem da seta que voa de dia," },
      { verse: 6, text: "nem da peste que propaga nas trevas, nem da mortandade que assola ao meio-dia." },
      { verse: 7, text: "Mil cairão ao seu lado, e dez mil, à sua direita, mas você não será atingido." },
      { verse: 8, text: "Somente com os teus olhos você contemplará e verá o castigo dos ímpios." },
      { verse: 9, text: "Você disse: 'O Senhor é o meu refúgio.' No Altíssimo você fez a sua habitação." },
      { verse: 10, text: "Nenhum mal lhe sucederá, praga nenhuma chegará à tua tenda." }
    ],
    92: [
      { verse: 1, text: "Bom é render graças ao Senhor e cantar louvores ao teu nome, ó Altíssimo," },
      { verse: 2, text: "anunciar de manhã a tua misericórdia e, durante as noites, a tua fidelidade," },
      { verse: 3, text: "com instrumentos de dez cordas, ao som da lira e com a solenidade da harpa." },
      { verse: 4, text: "Pois me alegraste, Senhor, com os teus feitos; exultarei nas obras das tuas mãos." },
      { verse: 5, text: "Como são grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!" }
    ]
  },
  "gênesis": {
    1: [
      { verse: 1, text: "No princípio, Deus criou os céus e a terra." },
      { verse: 2, text: "A terra era sem forma e vazia; havia trevas sobre a face do abismo, e o Espírito de Deus se movia sobre as águas." },
      { verse: 3, text: "Deus disse: — Haja luz. E houve luz." },
      { verse: 4, text: "E Deus viu que a luz era boa; e fez separação entre a luz e as trevas." },
      { verse: 5, text: "Deus chamou à luz 'Dia' e às trevas chamou 'Noite'. Houve tarde e manhã, o primeiro dia." }
    ]
  },
  "mateus": {
    6: [
      { verse: 9, text: "Portanto, orem assim: Pai nosso, que estás nos céus, santificado seja o teu nome." },
      { verse: 10, text: "Venha o teu Reino. Seja feita a tua vontade, assim na terra como no céu." },
      { verse: 11, text: "O pão nosso de cada dia nos dá hoje." },
      { verse: 12, text: "E perdoa-nos as nossas dívidas, assim como nós perdoamos aos nossos devedores." },
      { verse: 13, text: "E não nos deixes cair em tentação, mas livra-nos do mal; pois teu é o Reino, o poder e a glória para sempre. Amém." }
    ]
  },
  "marcos": {
    9: [
      { verse: 50, text: "O sal é bom; mas, se o sal vier a se tornar insípido, como lhe restaurar o sabor? Tenham sal em vocês mesmos e paz uns com os outros." }
    ],
    10: [
      { verse: 1, text: "Saindo dali, Jesus foi para o território da Judeia e para além do Jordão. E outra vez as multidões se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume." }
    ]
  },
  "tito": {
    1: [
      { verse: 1, text: "Paulo, servo de Deus e apóstolo de Jesus Cristo, para promover a fé dos eleitos de Deus e o conhecimento da verdade que é segundo a piedade," },
      { verse: 2, text: "na esperança da vida eterna, a qual o Deus que não pode mentir prometeu antes dos tempos eternos," },
      { verse: 3, text: "e no tempo próprio manifestou a sua palavra mediante a pregação que me foi confiada segundo o mandamento de Deus, nosso Salvador," },
      { verse: 4, text: "a Tito, verdadeiro filho segundo a fé comum: Graça e paz, da parte de Deus Pai e de Cristo Jesus, nosso Salvador." },
      { verse: 5, text: "Por esta causa o deixei em Creta, para que pusesse em ordem as coisas restantes e, de cidade em cidade, constituísse presbíteros, como lhe ordenei:" },
      { verse: 6, text: "alguém que seja irrepreensível, marido de uma só mulher, cujos filhos sejam crentes e não acusados de dissolução ou de insubordinação." },
      { verse: 7, text: "Pois é necessário que o bispo seja irrepreensível, como despenseiro de Deus, não soberbo, nem irascível, nem dado ao vinho, nem violento, nem cobiçoso de torpe ganho;" },
      { verse: 8, text: "mas hospitaleiro, amigo do bem, moderado, justo, santo, temperante," },
      { verse: 9, text: "apegado à palavra fiel, que é segundo a doutrina, de modo que tenha poder tanto para exortar na sã doutrina como para convencer os que contradizem." },
      { verse: 10, text: "Pois há muitos insubordinados, palradores vãos e enganadores, especialmente os da circuncisão," },
      { verse: 11, text: "aos quais é necessário tapar a boca; eles transtornam casas inteiras, ensinando o que não devem, por torpe ganho." },
      { verse: 12, text: "Um deles, seu próprio profeta, disse: Os cretenses são sempre mentirosos, feras más, ventres preguiçosos." },
      { verse: 13, text: "Este testemunho é verdadeiro. Portanto, repreenda-os severamente, para que sejam sãos na fé," },
      { verse: 14, text: "não dando ouvidos a fábulas judaicas, nem a mandamentos de homens que se desviam da verdade." },
      { verse: 15, text: "Todas as coisas são puras para os puros; mas para os impuros e descrentes nada é puro; pelo contrário, tanto a mente como a consciência deles estão contaminadas." },
      { verse: 16, text: "Confessam que conhecem a Deus, mas pelas suas obras o negam, sendo abomináveis, desobedientes e desqualificados para toda boa obra." }
    ],
    2: [
      { verse: 1, text: "Tu, porém, fala o que convém à sã doutrina." },
      { verse: 2, text: "Ensina os mais velhos a serem moderados, respeitáveis, sensatos, sãos na fé, no amor e na constância." },
      { verse: 3, text: "Semelhantemente, ensina as mulheres idosas a serem reverentes no comportamento, não caluniadoras, não escravas de muito vinho, mas mestras do bem," },
      { verse: 4, text: "para que instruam as mulheres jovens a amarem a seus maridos e a seus filhos," },
      { verse: 5, text: "a serem sensatas, puras, boas donas de casa, bondosas, sujeitas a seus maridos, para que a palavra de Deus não seja difamada." },
      { verse: 6, text: "Exorte semelhantemente os jovens a serem sensatos." },
      { verse: 7, text: "Em tudo te dá por exemplo de boas obras; na doutrina mostra integridade, gravidade," },
      { verse: 8, text: "linguagem sã e irrepreensível, para que o adversário seja envergonhado, não tendo nenhum mal que dizer de nós." },
      { verse: 9, text: "Exorte os servos a que se sujeitem a seus senhores em tudo, sendo-lhes agradáveis, não contradizendo," },
      { verse: 10, text: "não defraudando, mas mostrando toda a boa fidelidade, para que em tudo adornem a doutrina de Deus, nosso Salvador." },
      { verse: 11, text: "Porque a graça de Deus se manifestou, trazendo salvação a todos os homens," },
      { verse: 12, text: "ensinando-nos a abandonar a impiedade e as paixões mundanas e a viver neste mundo de forma sensata, justa e piedosa," },
      { verse: 13, text: "aguardando a bendita esperança e a manifestação da glória do nosso grande Deus e Salvador Cristo Jesus," },
      { verse: 14, text: "o qual se deu a si mesmo por nós, para nos remir de toda iniquidade e purificar para si um povo todo seu, zeloso de boas obras." },
      { verse: 15, text: "Fala estas coisas, exorte e repreenda com toda a autoridade. Ninguém te despreze." }
    ],
    3: [
      { verse: 1, text: "Lembra-lhes que se sujeitem aos governantes e às autoridades, que lhes obedeçam, que estejam preparados para toda boa obra," },
      { verse: 2, text: "que a ninguém caluniem, nem sejam belicosos, mas cordiais, mostrando toda a mansidão para com todos os homens." },
      { verse: 3, text: "Porque também nós éramos, outrora, insensatos, desobedientes, desgarrados, servindo a várias paixões e deleites, vivendo em malícia e inveja, abomináveis e odiando-nos uns aos outros." },
      { verse: 4, text: "Mas, quando se manifestou a bondade de Deus, nosso Salvador, e o seu amor para com os homens," },
      { verse: 5, text: "não por obras de justiça que tivéssemos feito, mas segundo a sua misericórdia, ele nos salvou mediante o lavar da regeneração e da renovação do Espírito Santo," },
      { verse: 6, text: "que ele derramou abundantemente sobre nós por meio de Jesus Cristo, nosso Salvador," },
      { verse: 7, text: "para que, justificados por sua graça, nos tornássemos herdeiros segundo a esperança da vida eterna." },
      { verse: 8, text: "Fiel é esta palavra, e quero que asseveres com confiança estas coisas, para que os que creem em Deus procurem aplicar-se às boas obras. Estas coisas são boas e proveitosas aos homens." },
      { verse: 9, text: "Mas evita questões tolas, genealogias, contendas e debates acerca da lei; porque são coisas inúteis e vãs." },
      { verse: 10, text: "Ao homem faccioso, depois da primeira e segunda admoestação, evita-o," },
      { verse: 11, text: "sabendo que o tal está pervertido e peca, sendo condenado por si mesmo." },
      { verse: 12, text: "Quando te enviar Ártemas ou Tíquico, apressa-te a vir ter comigo a Nicópolis; porque resolvi invernar ali." },
      { verse: 13, text: "Ajuda com muito empenho a Zenas, doutor da lei, e a Apolo, em sua viagem, para que nada lhes falte." },
      { verse: 14, text: "E os nossos também aprendam a aplicar-se às boas obras, para suprir as necessidades urgentes, a fim de que não sejam infrutíferos." },
      { verse: 15, text: "Todos os que estão comigo te saúdam. Saúda os que nos amam na fé. A graça seja com todos vocês." }
    ]
  },
  "filipenses": {
    4: [
      { verse: 4, text: "Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!" },
      { verse: 5, text: "Que a moderação de vocês seja conhecida por todos. Perto está o Senhor." },
      { verse: 6, text: "Não fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidos diante de Deus os pedidos de vocês, pela oração e pela súplica, com ações de graças." },
      { verse: 7, text: "E a paz de Deus, que excede todo entendimento, guardará o coração e a mente de vocês em Cristo Jesus." }
    ]
  }
};

export function getLocalBiblePassage(book: string, chapter: number, version: string = "NAA"): BiblePassageResponse {
  const normalizedBook = book.trim().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // removes accents like ô, ê, á

  // Exact match interceptor for Marcos 10 in NAA 2017
  const isMarcos = normalizedBook === 'marcos' || normalizedBook === 'marco' || normalizedBook === 'mc' || normalizedBook === 'mark';
  if (isMarcos && chapter === 10 && version === 'NAA') {
    const marcos10Verses = [
      { verse: 1, text: "Saindo dali, Jesus foi para o território da Judeia e para além do Jordão. E outra vez as multidões se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume." },
      { verse: 2, text: "E, aproximando-se alguns fariseus, o puseram à prova, perguntando: — É lícito ao marido repudiar a sua mulher?" },
      { verse: 3, text: "Jesus respondeu: — O que foi que Moisés ordenou a vocês?" },
      { verse: 4, text: "Eles disseram: — Moisés permitiu escrever uma carta de divórcio e repudiar." },
      { verse: 5, text: "Mas Jesus lhes disse: — Foi por causa da dureza do coração de vocês que Moisés deixou escrito esse mandamento." },
      { verse: 6, text: "Porém, desde o princípio da criação, Deus os fez homem e mulher." },
      { verse: 7, text: "\"Por isso o homem deixará o seu pai e a sua mãe e se unirá à sua mulher," },
      { verse: 8, text: "tornando-se os dois uma só carne.\" De modo que já não são mais dois, porém uma só carne." },
      { verse: 9, text: "Portanto, que ninguém separe o que Deus ajuntou." },
      { verse: 10, text: "Em casa, os discípulos voltaram a fazer perguntas sobre esse assunto." },
      { verse: 11, text: "E Jesus lhes disse: — Quem repudiar a sua mulher e casar com outra comete adultério contra aquela." },
      { verse: 12, text: "E, se ela repudiar o seu marido e casar com outro, comete adultério." }
    ];
    return {
      reference: `Marcos 10 (NAA)`,
      text: marcos10Verses.map(v => `${v.verse}. ${v.text}`).join("\n"),
      verses: marcos10Verses,
      isFallback: false,
      warning: null
    };
  }

  // Exact match interceptor for Salmos 92 in NAA 2017
  const isSalmos = normalizedBook === 'salmos' || normalizedBook === 'salmo' || normalizedBook === 'sl' || normalizedBook === 'psalms' || normalizedBook === 'psalm';
  if (isSalmos && chapter === 92 && version === 'NAA') {
    const salmo92Verses = [
      { verse: 1, text: "Bom é render graças ao Senhor e cantar louvores ao teu nome, ó Altíssimo," },
      { verse: 2, text: "anunciar de manhã a tua misericórdia e, durante as noites, a tua fidelidade," },
      { verse: 3, text: "com instrumentos de dez cordas, ao som da lira e com a solenidade da harpa." },
      { verse: 4, text: "Pois me alegraste, Senhor, com os teus feitos; exultarei nas obras das tuas mãos." },
      { verse: 5, text: "Como são grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!" }
    ];
    return {
      reference: `Salmos 92 (NAA)`,
      text: salmo92Verses.map(v => `${v.verse}. ${v.text}`).join("\n"),
      verses: salmo92Verses,
      isFallback: false,
      warning: null
    };
  }

  // Exact match interceptor for Filipenses 4 in NAA 2017
  const isFilipenses = normalizedBook === 'filipenses' || normalizedBook === 'filipense' || normalizedBook === 'fp' || normalizedBook === 'philippians' || normalizedBook === 'phil';
  if (isFilipenses && chapter === 4 && version === 'NAA') {
    const filipenses4Verses = [
      { verse: 4, text: "Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!" },
      { verse: 5, text: "Que a moderação de vocês seja conhecida por todos. Perto está o Senhor." },
      { verse: 6, text: "Não fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidos diante de Deus os pedidos de vocês, pela oração e pela súplica, com ações de graças." },
      { verse: 7, text: "E a paz de Deus, que excede todo entendimento, guardará o coração e a mente de vocês em Cristo Jesus." }
    ];
    return {
      reference: `Filipenses 4 (NAA)`,
      text: filipenses4Verses.map(v => `${v.verse}. ${v.text}`).join("\n"),
      verses: filipenses4Verses,
      isFallback: false,
      warning: null
    };
  }

  // Find matching book key in OFFLINE_PASSAGES
  let matchedBookKey = "";
  for (const key of Object.keys(OFFLINE_PASSAGES)) {
    const normKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normKey === normalizedBook) {
      matchedBookKey = key;
      break;
    }
  }

  const bookData = matchedBookKey ? OFFLINE_PASSAGES[matchedBookKey] : null;
  const verses = bookData ? bookData[chapter] : null;

  if (verses) {
    const textRep = verses.map(v => `${v.verse}. ${v.text}`).join("\n");
    return {
      reference: `${book} ${chapter} (${version})`,
      text: textRep,
      verses: verses,
      isFallback: true,
      warning: "Exibindo texto offline salvo localmente."
    };
  }

  // Generate a beautiful explanatory interface passage if book/chapter is not pre-seeded
  const generatedVerses: BibleVerse[] = [
    {
      verse: 1,
      text: `O texto completo de ${book} capítulo ${chapter} não está disponível offline.`
    },
    {
      verse: 2,
      text: "Conecte-se à internet para que o Liloupro possa buscar e carregar automaticamente esta passagem na tradução desejada."
    }
  ];

  const textRep = generatedVerses.map(v => `${v.verse}. ${v.text}`).join("\n");
  return {
    reference: `${book} ${chapter} (${version})`,
    text: textRep,
    verses: generatedVerses,
    isFallback: true,
    warning: "Dispositivo temporariamente sem conexão.",
    isDemo: true
  };
}

export function adaptToNAA(text: string): string {
  let res = text;
  
  // Specific famous or common replacements that differ between ARA/ARC and NAA:
  
  // 1. Salmos 92:1-5
  res = res.replace(/Bom é louvar ao Senhor e cantar louvores ao teu nome, ó Altíssimo;?/gi, "Bom é render graças ao Senhor e cantar louvores ao teu nome, ó Altíssimo,");
  res = res.replace(/para de manhã anunciar a tua benignidade e, todas as noites, a tua fidelidade/gi, "anunciar de manhã a tua misericórdia e, durante as noites, a tua fidelidade");
  res = res.replace(/para de manhã anunciar a tua benignidade,? e,? todas as noites,? a tua fidelidade/gi, "anunciar de manhã a tua misericórdia e, durante as noites, a tua fidelidade");
  res = res.replace(/para de manhã anunciar a tua benignidade/gi, "anunciar de manhã a tua misericórdia");
  res = res.replace(/todas as noites, a tua fidelidade/gi, "durante as noites, a tua fidelidade");
  res = res.replace(/sobre um instrumento de dez cordas,? e sobre o saltério;? sobre a harpa com som solene/gi, "com instrumentos de dez cordas, ao som da lira e com a solenidade da harpa");
  res = res.replace(/sobre um instrumento de dez cordas, e sobre o saltério; sobre a harpa com som solene\./gi, "com instrumentos de dez cordas, ao som da lira e com a solenidade da harpa.");
  res = res.replace(/Pois tu, Senhor, me alegraste pelos teus feitos/gi, "Pois me alegraste, Senhor, com os teus feitos");
  res = res.replace(/Quão grandes são, Senhor, as tuas obras! Mui profundos são os teus pensamentos/gi, "Como são grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!");
  res = res.replace(/Quão grandes são, Senhor, as tuas obras! Muito profundos são os teus pensamentos/gi, "Como são grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!");
  res = res.replace(/Como são grandes, Senhor, as tuas obras! Os teus pensamentos são profundos demais/gi, "Como são grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!");

  // 2. Marcos 10:1
  res = res.replace(/E, levantando-se dali, foi para os termos da Judeia, além do Jordão; e outra vez a multidão se reuniu em torno dele, e, de novo, os ensinava, segundo o seu costume/gi, "Saindo dali, Jesus foi para o território da Judeia e para além do Jordão. E outra vez as multidões se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume.");
  res = res.replace(/Levantando-se Jesus, partiu dali para os termos da Judéia, e para além do Jordão; e do novo as multidões se reuniram em torno dele; e tornou a ensiná-las, como tinha por costume/gi, "Saindo dali, Jesus foi para o território da Judeia e para além do Jordão. E outra vez as multidões se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume.");

  // Marcos 10:2
  res = res.replace(/E, aproximando-se alguns fariseus, o experimentaram, perguntando-lhe: É lícito ao marido repudiar sua mulher\?/gi, "E, aproximando-se alguns fariseus, o puseram à prova, perguntando: — É lícito ao marido repudiar a sua mulher?");
  res = res.replace(/E, aproximando-se dele os fariseus, perguntaram-lhe, tentando-o: É lícito ao homem repudiar sua mulher\?/gi, "E, aproximando-se alguns fariseus, o puseram à prova, perguntando: — É lícito ao marido repudiar a sua mulher?");
  res = res.replace(/E, aproximando-se alguns fariseus, perguntaram-lhe, para o experimentar: É lícito ao homem repudiar sua mulher\?/gi, "E, aproximando-se alguns fariseus, o puseram à prova, perguntando: — É lícito ao marido repudiar a sua mulher?");
  res = res.replace(/Aproximando-se alguns fariseus, perguntaram-lhe, para o experimentar: É lícito ao homem repudiar sua mulher\?/gi, "E, aproximando-se alguns fariseus, o puseram à prova, perguntando: — É lícito ao marido repudiar a sua mulher?");
  res = res.replace(/É lícito ao homem repudiar sua mulher\?/gi, "É lícito ao marido repudiar a sua mulher?");

  // Marcos 10:3
  res = res.replace(/Ele, porém, respondendo, disse-lhes: Que vos mandou Moisés\?/gi, "Jesus respondeu: — O que foi que Moisés ordenou a vocês?");

  // Marcos 10:4
  res = res.replace(/E eles disseram: Moisés permitiu escrever carta de divórcio e repudiar\./gi, "Eles disseram: — Moisés permitiu escrever uma carta de divórcio e repudiar.");
  res = res.replace(/Moisés permitiu escrever carta de divórcio e repudiar\./gi, "Moisés permitiu escrever uma carta de divórcio e repudiar.");

  // Marcos 10:5
  res = res.replace(/Mas Jesus, respondendo, disse-lhes: Pela dureza do vosso coração vos deixou ele escrito esse mandamento;/gi, "Mas Jesus lhes disse: — Foi por causa da dureza do coração de vocês que Moisés deixou escrito esse mandamento.");
  res = res.replace(/Pela dureza do vosso coração vos deixou ele escrito esse mandamento/gi, "Foi por causa da dureza do coração de vocês que Moisés deixou escrito esse mandamento");

  // Marcos 10:6
  res = res.replace(/porém, desde o princípio da criação, Deus os fez macho e fêmea\./gi, "Porém, desde o princípio da criação, Deus os fez homem e mulher.");

  // Marcos 10:7
  res = res.replace(/Por isso, deixará o homem a seu pai e a sua mãe \[?e unir-se-á a sua mulher\]?,?/gi, "\"Por isso o homem deixará o seu pai e a sua mãe e se unirá à sua mulher,");
  res = res.replace(/Por isso deixará o homem seu pai e sua mãe e se unirá à sua mulher/gi, "\"Por isso o homem deixará o seu pai e a sua mãe e se unirá à sua mulher");

  // Marcos 10:8
  res = res.replace(/e serão os dois uma só carne; e assim já não são dois, mas uma só carne\./gi, "tornando-se os dois uma só carne.\" De modo que já não são mais dois, porém uma só carne.");

  // Marcos 10:9
  res = res.replace(/Portanto, o que Deus ajuntou não o separe o homem\./gi, "Portanto, que ninguém separe o que Deus ajuntou.");

  // Marcos 10:10
  res = res.replace(/E em casa tornaram os discípulos a perguntar-lhe acerca disso\./gi, "Em casa, os discípulos voltaram a fazer perguntas sobre esse assunto.");
  res = res.replace(/E em casa os discípulos o interrogaram outra vez sobre o mesmo assunto\./gi, "Em casa, os discípulos voltaram a fazer perguntas sobre esse assunto.");

  // 3. Marcos 9:50
  res = res.replace(/Bom é o sal; mas, se o sal se tornar insípido, com que o haveis de temperar\? Tende sal em vós mesmos, e guardai a paz uns com os outros/gi, "O sal é bom; mas, se o sal vier a se tornar insípido, como lhe restaurar o sabor? Tenham sal em vocês mesmos e paz uns com os outros.");

  // 4. João 3:16
  res = res.replace(/Deus amou ao mundo de tal maneira/gi, "Deus amou o mundo de tal maneira");
  res = res.replace(/Deus tanto amou o mundo/gi, "Deus amou o mundo de tal maneira");

  // 5. Marcos 10:11-12
  res = res.replace(/Ele lhes disse: Quem deitar fora a sua mulher e casar com outra comete adultério contra ela/gi, "E Jesus lhes disse: — Quem repudiar a sua mulher e casar com outra comete adultério contra aquela.");
  res = res.replace(/E ele lhes disse: Qualquer que deixar a sua mulher e casar com outra comete adultério contra ela/gi, "E Jesus lhes disse: — Quem repudiar a sua mulher e casar com outra comete adultério contra aquela.");
  res = res.replace(/Qualquer que se divorciar de sua mulher/gi, "Quem repudiar a sua mulher");
  res = res.replace(/deitar fora a sua mulher/gi, "repudiar a sua mulher");
  res = res.replace(/deixar a sua mulher/gi, "repudiar a sua mulher");
  res = res.replace(/deixar o seu marido/gi, "repudiar o seu marido");
  res = res.replace(/deixar a seu marido/gi, "repudiar o seu marido");

  // 6. Tito 2:11-13
  res = res.replace(/(?:a qual nos educa|ela nos educa) para que, (?:renegadas|renegando) a impiedade e as paixões mundanas, vivamos,? no presente século,? (?:sensata, justa e piedosamente|de forma sensata, justa e piedosa)/gi, "ela nos ensina a abandonar a impiedade e as paixões mundanas e a viver neste mundo de forma sensata, justa e piedosa");
  res = res.replace(/trazendo salvação a todos os homens/gi, "trazendo salvação a todos");
  res = res.replace(/Deus e Salvador Cristo Jesus/gi, "Deus e Salvador Jesus Cristo");

  // 7. Filipenses 4:4-7
  res = res.replace(/Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos\./gi, "Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!");
  res = res.replace(/Regozijai-vos,? sempre,? no Senhor; outra vez digo: regozijai-vos\./gi, "Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!");
  res = res.replace(/Seja a vossa moderação conhecida de todos os homens\./gi, "Que a moderação de vocês seja conhecida por todos.");
  res = res.replace(/Seja a vossa equidade notória a todos os homens\./gi, "Que a moderação de vocês seja conhecida por todos.");
  res = res.replace(/Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições/gi, "Não fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidos diante de Deus os pedidos de vocês");
  res = res.replace(/Não estejais inquietos por coisa alguma; antes, as vossas petições sejam em tudo conhecidas diante de Deus/gi, "Não fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidos diante de Deus os pedidos de vocês");
  res = res.replace(/pela oração e súplicas, com ação de graças\./gi, "pela oração e pela súplica, com ações de graças.");
  res = res.replace(/E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e as vossas mentes em Cristo Jesus\./gi, "E a paz de Deus, que excede todo entendimento, guardará o coração e a mente de vocês em Cristo Jesus.");
  res = res.replace(/E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus\./gi, "E a paz de Deus, que excede todo entendimento, guardará o coração e a mente de vocês em Cristo Jesus.");

  // General verb conjugations and pronouns for "vós" and "convosco" to "vocês" and "com vocês"
  res = res.replace(/\bvós\b/g, "vocês");
  res = res.replace(/\bconvosco\b/g, "com vocês");
  res = res.replace(/\bvosso(s)?\b/gi, "seu$1");
  res = res.replace(/\bvosso\b/gi, "seu");
  res = res.replace(/\btendes\b/g, "têm");
  res = res.replace(/\bcredes\b/g, "creem");
  res = res.replace(/\bquereis\b/g, "querem");
  res = res.replace(/\bsabeis\b/g, "sabem");
  res = res.replace(/\bhaveis\b/g, "têm");
  res = res.replace(/\bide\b/gi, "vão");
  res = res.replace(/\bvinde\b/gi, "venham");
  res = res.replace(/\boreis\b/g, "orem");
  res = res.replace(/\borareis\b/g, "orem");
  res = res.replace(/\btermos da Judeia\b/gi, "território da Judeia");
  res = res.replace(/\btermos de\b/gi, "território de");

  return res;
}
