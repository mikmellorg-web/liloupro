export interface PopularSong {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  timeSignature: string;
  chords: string;
  lyrics: string;
  youtube?: string;
  category?: string;
}

export function findLocalPopularSong(title: string, artist: string): PopularSong | undefined {
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedArtist = (artist || "").trim().toLowerCase();

  // 1. Santos Pra Sempre / Holy Forever
  if (normalizedTitle.includes("santos pra sempre") || normalizedTitle.includes("santos para sempre") || normalizedTitle.includes("holy forever")) {
    return {
      title: "Santos Pra Sempre",
      artist: "Gabriel Guedes",
      key: "C",
      bpm: 72,
      timeSignature: "4/4",
      youtube: "https://www.youtube.com/watch?v=Oshg8mX2e1U",
      chords: `[Intro]
C  C4  C  C4

[Verso 1]
C                 C4          C
As muitas gerações rendidas em louvor
    Am7         G            F9
Cantando ao Cordeiro uma canção
     C
Os que em Ti se foram
  C4              C
E os que hão de crer
    Am7         G            F9
Cantando ao Cordeiro uma canção

[Refrão]
           F9             Am7
E os anjos cantam: Santo
          G              C
Toda a criação: Santo
         F9             Am7
Tu és exaltado: Santo
            G
Santo para sempre

[Verso 2]
     C             C4             C
Seu Nome é sobre todos, Nome sem igual
   Am7          G            F9
Governos e reinos proclamarão
     C
Os mares e os montes
   C4             C
E toda a criação
    Am7         G            F9
Cantando ao Cordeiro uma canção

[Refrão]
           F9             Am7
E os anjos cantam: Santo
          G              C
Toda a criação: Santo
         F9             Am7
Tu és exaltado: Santo
            G
Santo para sempre

[Ponte]
            Am7              F9
Teu Nome é o mais alto, Teu Nome é o maior
            C                         G
Teu Nome é perfeito, acima de outros nomes
             Am7               F9
Do Teu Nome vem cura, do Teu Nome há vida
              C                      G
Do Teu Nome vem força e poder pra vencer

[Refrão]
           F9             Am7
E os anjos cantam: Santo
          G              C
Toda a criação: Santo
         F9             Am7
Tu és exaltado: Santo
            G
Santo para sempre`,
      lyrics: `As muitas gerações rendidas em louvor
Cantando ao Cordeiro uma canção
Os que em Ti se foram
E os que hão de crer
Cantando ao Cordeiro uma canção

E os anjos cantam: Santo
Toda a criação: Santo
Tu és exaltado: Santo
Santo para sempre

Seu Nome é sobre todos, Nome sem igual
Governos e reinos proclamarão
Os mares e os montes
E toda a criação
Cantando ao Cordeiro uma canção

Teu Nome é o mais alto, Teu Nome é o maior
Teu Nome é perfeito, acima de outros nomes
Do Teu Nome vem cura, do Teu Nome há vida
Do Teu Nome vem força e poder pra vencer`
    };
  }

  // 2. Ousado Amor / Reckless Love
  if (normalizedTitle.includes("ousado amor") || normalizedTitle.includes("reckless love")) {
    return {
      title: "Ousado Amor",
      artist: "Isaías Saad",
      key: "F#m",
      bpm: 83,
      timeSignature: "6/8",
      youtube: "https://www.youtube.com/watch?v=9_iM8_e-E3c",
      chords: `[Intro]
F#m   E   D   A

[Verso 1]
     F#m                E                  D
Antes de eu falar, Tu cantavas sobre mim
                F#m         E          D
Tu tens sido tão, tão bom pra mim
     F#m                  E               D
Antes de eu respirar, sopraste Tua vida em mim
                F#m         E          D
Tu tens sido tão, tão Deus pra mim

[Refrão]
          F#m            E              D             A
Oh, impressionante, infinito e ousado amor de Deus
           F#m              E                    D               A
Oh, que deixa as noventa e nove e vem me buscar
               F#m             E
Não posso comprá-lo, nem merecê-lo
         D          A
Mesmo assim se entregou
          F#m            E              D             A
Oh, impressionante, infinito e ousado amor de Deus

[Verso 2]
     F#m               E                  D
Inimigo eu fui, mas Teu amor lutou por mim
                F#m         E          D
Tu tens sido tão, tão bom pra mim
        F#m               E                  D
Quando trago a dor, Tua graça me liberta enfim
                F#m         E          D
Tu tens sido tão, tão Deus pra mim

[Ponte]
F#m                             E
   Traz luz para as sombras, escala as montanhas
D                    A
Pra me encontrar
F#m                       E
   Derruba as muralhas, destrói as mentiras
D                    A
Pra me encontrar`,
      lyrics: `Antes de eu falar, Tu cantavas sobre mim
Tu tens sido tão, tão bom pra mim
Antes de eu respirar, sopraste Tua vida em mim
Tu tens sido tão, tão Deus pra mim

Oh, impressionante, infinito e ousado amor de Deus
Oh, que deixa as noventa e nove e vem me buscar
Não posso comprá-lo, nem merecê-lo
Mesmo assim se entregou
Oh, impressionante, infinito e ousado amor de Deus

Inimigo eu fui, mas Teu amor lutou por mim
Tu tens sido tão, tão bom pra mim
Quando trago a dor, Tua graça me liberta enfim
Tu tens sido tão, tão Deus pra mim

Traz luz para as sombras, escala as montanhas
Pra me encontrar
Derruba as muralhas, destrói as mentiras
Pra me encontrar`
    };
  }

  // 3. Caminho no Deserto / Way Maker
  if (normalizedTitle.includes("caminho no deserto") || normalizedTitle.includes("way maker") || normalizedTitle.includes("waymaker")) {
    return {
      title: "Caminho no Deserto",
      artist: "Soraya Moraes",
      key: "C",
      bpm: 68,
      timeSignature: "4/4",
      youtube: "https://www.youtube.com/watch?v=1_Zq63Z_oXk",
      chords: `[Intro]
F   C   G   Am

[Verso 1]
F
Estás aqui, movendo entre nós
C
Te adorarei, Te adorarei
G
Estás aqui, mudando destinos
Am
Te adorarei, Te adorarei

[Refrão]
F
Meu Deus é Deus de milagres, Deus de promessas
C
Caminho no deserto, luz na escuridão
G              Am
Esse é o meu Deus, esse é o meu Deus
F
Meu Deus é Deus de milagres, Deus de promessas
C
Caminho no deserto, luz na escuridão
G              Am
Esse é o meu Deus, esse é o meu Deus

[Verso 2]
F
Estás aqui, curando os corações
C
Te adorarei, Te adorarei
G
Estás aqui, tocando vidas
Am
Te adorarei, Te adorarei`,
      lyrics: `Estás aqui, movendo entre nós
Te adorarei, Te adorarei
Estás aqui, mudando destinos
Te adorarei, Te adorarei

Meu Deus é Deus de milagres, Deus de promessas
Caminho no deserto, luz na escuridão
Esse é o meu Deus, esse é o meu Deus

Estás aqui, curando os corações
Te adorarei, Te adorarei
Estás aqui, tocando vidas
Te adorarei, Te adorarei`
    };
  }

  // 4. Bondade de Deus / Goodness of God
  if (normalizedTitle.includes("bondade de deus") || normalizedTitle.includes("goodness of god")) {
    const isIsaias = normalizedArtist.includes("isaías") || normalizedArtist.includes("isaias") || normalizedArtist.includes("saad");
    if (isIsaias) {
      return {
        title: "Bondade de Deus",
        artist: "Isaías Saad",
        key: "D",
        bpm: 70,
        timeSignature: "4/4",
        youtube: "https://www.youtube.com/watch?v=oUu0V5N67kY",
        chords: `[Intro]
G   D   G   D

[Verso 1]
     G                  D
Te amo Deus, Tua graça nunca falha
    A                   Bm7
Todos os dias, eu estou em Tuas mãos
                G                      D  A/C# Bm7
Desde quando eu me levanto, até eu me deitar
            G               A           D
Eu cantarei    de Tua bondade, Deus

[Refrão]
G                                D
   Pois em tudo o que vivi, eu cantarei
G                             D       A
   De Tua bondade, Deus, eu cantarei
G                            D  A/C#  Bm7
   Com tudo o que sou, eu cantarei
            G               A           D
Eu cantarei    de Tua bondade, Deus

[Verso 2]
               G                      D
Eu amo a Tua voz que me guia pelo fogo
A                  Bm7
E na escuridão Tua presença é minha luz
                 G                 D  A/C#  Bm7
Eu Te conheço como Pai ou amigo mais chegado
            G               A           D
Eu vivi de Tua bondade, Deus

[Refrão]
G                                D
   Pois em tudo o que vivi, eu cantarei
G                             D       A
   De Tua bondade, Deus, eu cantarei
G                            D  A/C#  Bm7
   Com tudo o que sou, eu cantarei
            G               A           D
Eu cantarei    de Tua bondade, Deus

[Ponte]
A/C#             G                   D
   Tua bondade me seguirá, me seguirá, Senhor
A/C#             G                   D
   Tua bondade me seguirá, me seguirá, Senhor
       A/C#             G
Eu me rendo a Ti, eu Te dou o meu ser
        D        A/C#   Bm7
Tudo o que sou, Te dou
A/C#             G                   D
   Tua bondade me seguirá, me seguirá, Senhor

[Refrão]
G                                D
   Pois em tudo o que vivi, eu cantarei
G                             D       A
   De Tua bondade, Deus, eu cantarei
G                            D  A/C#  Bm7
   Com tudo o que sou, eu cantarei
            G               A           D
Eu cantarei    de Tua bondade, Deus`,
        lyrics: `Te amo Deus, Tua graça nunca falha
Todos os dias, eu estou em Tuas mãos
Desde quando eu me levanto, até eu me deitar
Eu cantarei de Tua bondade, Deus

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus

Eu amo a Tua voz que me guia pelo fogo
E na escuridão Tua presença é minha luz
Eu Te conheço como Pai ou amigo mais chegado
Eu vivi de Tua bondade, Deus

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus

Tua bondade me seguirá, me seguirá, Senhor
Tua bondade me seguirá, me seguirá, Senhor
Eu me rendo a Ti, eu Te dou o meu ser
Tudo o que sou, Te dou
Tua bondade me seguirá, me seguirá, Senhor

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus`
      };
    } else {
      return {
        title: "Bondade de Deus",
        artist: "Isadora Pompeo",
        key: "Ab",
        bpm: 68,
        timeSignature: "4/4",
        youtube: "https://www.youtube.com/watch?v=kYJvM9lJb_c",
        chords: `[Intro]
Db7M   Ab   Db7M   Ab

[Verso 1]
     Db7M              Ab
Te amo Deus, Tua graça nunca falha
    Eb                  Fm7
Todos os dias, eu estou em Tuas mãos
                Db7M                  Ab Eb/G Fm7
Desde quando eu me levanto, até eu me deitar
            Db7M            Eb          Ab
Eu cantarei    de Tua bondade, Deus

[Refrão]
Db7M                             Ab
   Pois em tudo o que vivi, eu cantarei
Db7M                          Ab      Eb
   De Tua bondade, Deus, eu cantarei
Db7M                         Ab  Eb/G   Fm7
   Com tudo o que sou, eu cantarei
            Db7M            Eb          Ab
Eu cantarei    de Tua bondade, Deus

[Verso 2]
               Db7M            Ab
Eu amo a Tua voz que me guia pelo fogo
Eb                 Fm7
E na escuridão Tua presença é minha luz
                 Db7M              Ab Eb/G  Fm7
Eu Te conheço como Pai ou amigo mais chegado
            Db7M            Eb          Ab
Eu vivi de Tua bondade, Deus

[Refrão]
Db7M                             Ab
   Pois em tudo o que vivi, eu cantarei
Db7M                          Ab      Eb
   De Tua bondade, Deus, eu cantarei
Db7M                         Ab  Eb/G   Fm7
   Com tudo o que sou, eu cantarei
            Db7M            Eb          Ab
Eu cantarei    de Tua bondade, Deus

[Ponte]
Eb/G             Db7M                Ab
   Tua bondade me seguirá, me seguirá, Senhor
Eb/G             Db7M                Ab
   Tua bondade me seguirá, me seguirá, Senhor
       Eb/G             Db7M
Eu me rendo a Ti, eu Te dou o meu ser
        Ab       Eb/G   Fm7
Tudo o que sou, Te dou
Eb/G             Db7M                Ab
   Tua bondade me seguirá, me seguirá, Senhor

[Refrão]
Db7M                             Ab
   Pois em tudo o que vivi, eu cantarei
Db7M                          Ab      Eb
   De Tua bondade, Deus, eu cantarei
Db7M                         Ab  Eb/G   Fm7
   Com tudo o que sou, eu cantarei
            Db7M            Eb          Ab
Eu cantarei    de Tua bondade, Deus`,
        lyrics: `Te amo Deus, Tua graça nunca falha
Todos os dias, eu estou em Tuas mãos
Desde quando eu me levanto, até eu me deitar
Eu cantarei de Tua bondade, Deus

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus

Eu amo a Tua voz que me guia pelo fogo
E na escuridão Tua presença é minha luz
Eu Te conheço como Pai ou amigo mais chegado
Eu vivi de Tua bondade, Deus

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus

Tua bondade me seguirá, me seguirá, Senhor
Tua bondade me seguirá, me seguirá, Senhor
Eu me rendo a Ti, eu Te dou o meu ser
Tudo o que sou, Te dou
Tua bondade me seguirá, me seguirá, Senhor

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus`
      };
    }
  }

  // 5. Lugar Secreto / Secret Place
  if (normalizedTitle.includes("lugar secreto") || normalizedTitle.includes("secret place")) {
    return {
      title: "Lugar Secreto",
      artist: "Gabriela Rocha",
      key: "F#",
      bpm: 72,
      timeSignature: "4/4",
      youtube: "https://www.youtube.com/watch?v=1u3C_Jq3r9c",
      chords: `[Intro]
B7M   F#   C#   D#m7
B7M   F#   C#   D#m7

[Verso 1]
B7M                      F#
   Tu és tudo o que eu mais quero
C#                         D#m7
   Não há outro igual a Ti
B7M                   F#
   Tua voice é o meu farol
C#                           D#m7
   Guia meus passos para o Teu altar

[Verso 2]
B7M                      F#
   No Teu olhar eu vejo quem eu sou
C#                        D#m7
   Tua presença me refaz
B7M                     F#
   Em Teus braços é o meu abrigo
C#                         D#m7
   Lugar seguro onde tenho paz

[Refrão]
            B7M
Quero ir mais fundo
                  F#
Leve-me ao Santo dos Santos
                   C#
Lugar secreto onde Te encontro
             D#m7
Revela a Tua glória para mim
            B7M
Quero ir mais fundo
                  F#
Leve-me ao Santo dos Santos
                   C#
Lugar secreto onde Te encontro
             D#m7
Revela a Tua glória para mim

[Ponte]
B7M                  F#
   Tudo em mim clama por Ti
C#                   D#m7
   Tudo em mim deseja a Ti
B7M                   F#      C#   D#m7
   Como a terra seca clama por chuva
B7M                  F#
   Tudo em mim clama por Ti
C#                   D#m7
   Tudo em mim deseja a Ti
B7M                   F#      C#   D#m7
   Como a terra seca clama por chuva`,
      lyrics: `Tu és tudo o que eu mais quero
Não há outro igual a Ti
Tua voz é o meu farol
Guia meus passos para o Teu altar

No Teu olhar eu vejo quem eu sou
Tua presença me refaz
Em Teus braços é o meu abrigo
Lugar seguro onde tenho paz

Quero ir mais fundo
Leve-me ao Santo dos Santos
Lugar secreto onde Te encontro
Revela a Tua glória para mim

Quero ir mais fundo
Leve-me ao Santo dos Santos
Lugar secreto onde Te encontro
Revela a Tua glória para mim

Tudo em mim clama por Ti
Tudo em mim deseja a Ti
Como a terra seca clama por chuva

Tudo em mim clama por Ti
Tudo em mim deseja a Ti
Como a terra seca clama por chuva`
    };
  }

  // 6. Aclame ao Senhor / Shout to the Lord
  if (normalizedTitle.includes("aclame ao senhor") || normalizedTitle.includes("shout to the lord") || normalizedTitle.includes("aclame ao de senhor")) {
    return {
      title: "Aclame ao Senhor",
      artist: "Diante do Trono",
      key: "A",
      bpm: 80,
      timeSignature: "4/4",
      youtube: "https://www.youtube.com/watch?v=Xh0m2tZc2Z0",
      chords: `[Intro]
A   D   A   D

[Verso 1]
A           E
Meu Jesus, salvador
F#m      E       D
Outro igual não há
 A             D        A
Todos os dias quero louvar
   F#m         G  D/F#  E4  E
As maravilhas do teu amor

[Verso 2]
 A          E
Consolo, abrigo
F#m         E       D
Força e refúgio é o Senhor
A              D          A
Com todo o meu ser, com tudo o que sou
 F#m          G    D/F#  E4  E
Sempre te a...do...ra....rei

[Refrão]
A            F#m        D         E4   E
Aclame ao Senhor toda a terra e cantemos
A           F#m         D        E4   E
Poder, majestade e louvores ao Rei
F#m                     D
Montes se prostrem e rugam os mares
    E       D/F#     E/G#  E
Ao som de teu no.....me

[Refrão]
A         F#m        D         E4   E
Alegre te louvo por teus grandes feitos
   A          F#m      D        E4   E
Firmado em ti sempre me manterei
F#m                  D        E     A
Incomparáveis são tuas promessas pra mim`,
      lyrics: `Meu Jesus, salvador
Outro igual não há
Todos os dias quero louvar
As maravilhas do teu amor

Consolo, abrigo
Força e refúgio é o Senhor
Com todo o meu ser, com tudo o que sou
Sempre te adorarei

Aclame ao Senhor toda a terra e cantemos
Poder, majestade e louvores ao Rei
Montes se prostrem e rugam os mares
Ao som de teu nome

Alegre te louvo por teus grandes feitos
Firmado em ti sempre me manterei
Incomparáveis são tuas promessas pra mim`
    };
  }

  // 7. A Casa É Sua
  if (normalizedTitle.includes("casa é sua") || normalizedTitle.includes("casa e sua") || normalizedTitle.includes("casa worship")) {
    return {
      title: "A Casa É Sua",
      artist: "Casa Worship",
      key: "G",
      bpm: 74,
      timeSignature: "4/4",
      youtube: "https://www.youtube.com/watch?v=L2G9W_W71Z4",
      chords: `[Intro]
C7M   D   Em7   Bm7
C7M   D   Em7   Bm7

[Verso 1]
            C7M                      D
Você é bem-vindo aqui, e a casa é Sua, pode entrar
            Em7                     Bm7
Você é bem-vindo aqui, e a casa é Sua, pode entrar
                      C7M                     D
Deixa a Sua glória encher este lugar, debaixo das Suas asas é o meu lugar
                      Em7                     Bm7
Deixa a Sua glória encher este lugar, debaixo das Suas asas é o meu lugar

[Ponte]
               C7M           D
Vem, vem, Jesus... Vem, vem, Jesus

[Refrão]
 C7M
Essa casa é Sua casa, nós deixamos ela pra Você, Jesus
 D
Essa casa é Sua casa, nós deixamos ela pra Você, Jesus
 Em7
Essa casa é Sua casa, nós deixamos ela pra Você, Jesus
 Bm7
Essa casa é Sua casa, nós deixamos ela pra Você, Jesus`,
      lyrics: `Você é bem-vindo aqui, e a casa é Sua, pode entrar
Você é bem-vindo aqui, e a casa é Sua, pode entrar
Deixa a Sua glória encher este lugar, debaixo das Suas asas é o meu lugar
Deixa a Sua glória encher este lugar, debaixo das Suas asas é o meu lugar

Vem, vem, Jesus... Vem, vem, Jesus

Essa casa é Sua casa, nós deixamos ela pra Você, Jesus
Essa casa é Sua casa, nós deixamos ela pra Você, Jesus
Essa casa é Sua casa, nós deixamos ela pra Você, Jesus
Essa casa é Sua casa, nós deixamos ela pra Você, Jesus`
    };
  }

  // 8. Me Atraiu
  if (normalizedTitle.includes("me atraiu") || normalizedTitle.includes("atraiu")) {
    return {
      title: "Me Atraiu",
      artist: "Gabriela Rocha",
      key: "G",
      bpm: 72,
      timeSignature: "4/4",
      youtube: "https://www.youtube.com/watch?v=R9K1Xk8B2qM",
      chords: `[Intro]
C9   G   Em7   D

[Verso 1]
 C9                              G
Deixei as minhas redes na beira do mar
   Em7                       D
Deixei os meus barcos pra Te acompanhar
   C9                         G
O Teu olhar me chamou pra perto
   Em7                       D
E eu Te disse sim, pro caminho certo

[Verso 2]
 C9                             G
Deixei as minhas desculpas pra Te seguir
   Em7                              D
Deixei toda a autossuficiência que havia em mim
      C9                 G
Me esvaziei de tudo o que sou
      Em7                  D
E assumi o meu papel de servo do meu Senhor

[Ponte]
              C9                            G
Porque Ele me amou primeiro, Ele me amou primeiro
                Em7                              D
E a Sua cruz me resgatou, e a Sua graça me alcançou

[Refrão]
         C9            G
Me atraiu... Me atraiu...
         Em7                    D
Me atraiu o Teu amor, me atraiu o Teu amor`,
      lyrics: `Deixei as minhas redes na beira do mar
Deixei os meus barcos pra Te acompanhar
O Teu olhar me chamou pra perto
E eu Te disse sim, pro caminho certo

Deixei as minhas desculpas pra Te seguir
Deixei toda a autossuficiência que havia em mim
Me esvaziei de tudo o que sou
E assumi o meu papel de servo do meu Senhor

Porque Ele me amou primeiro, Ele me amou primeiro
E a Sua cruz me resgatou, e a Sua graça me alcançou

Me atraiu... Me atraiu...
Me atraiu o Teu amor, me atraiu o Teu amor`
    };
  }

  // 9. Cristo És Incomparável
  if ((normalizedTitle.includes("incomparável") || normalizedTitle.includes("incomparavel")) && normalizedTitle.includes("cristo")) {
    return {
      title: "Cristo És Incomparável",
      artist: "Deigma Marques",
      key: "G",
      bpm: 68,
      timeSignature: "4/4",
      youtube: "https://www.youtube.com/watch?v=Qx8wV2kF9yQ",
      chords: `[Intro]
G   D/F#   Em7   C9 (2x)

[Verso 1]
G                 D/F#        Em7  C9
  Tua beleza me atrai
G                       D/F#        Em7  C4  C
  Tua santidade me constrange
Em7                   D               C9
  Ao Teu nome todo joelho se dobrará
Em7                  D               C9
  Tua glória enche a terra
                       D4  D
E os céus se curvam a Ti

[Refrão]
G                D/F#
  Cristo és incomparável
Em7              C9
  Cristo és incomparável
G              D/F#
  Não há outro além de Ti
Em7            C9
  Não há outro igual a Ti

[Interlúdio]
G   D/F#   Em7   C9

[Ponte]
G           D/F#  Em7   C9
Jesus...  Jesus...  Jesus...  Jesus...

[Refrão]
G                D/F#
  Cristo és incomparável
Em7              C9
  Cristo és incomparável
G              D/F#
  Não há outro além de Ti
Em7            C9
  Não há outro igual a Ti

G              D/F#
  Não há outro além de Ti
Em7            C9             G
  Não há outro igual a Ti, Senhor`,
      lyrics: `Tua beleza me atrai
Tua santidade me constrange
Ao Teu nome todo joelho se dobrará
Tua glória enche a terra
E os céus se curvam a Ti

Cristo és incomparável
Cristo és incomparável
Não há outro além de Ti
Não há outro igual a Ti

Jesus, Jesus, Jesus, Jesus

Cristo és incomparável
Cristo és incomparável
Não há outro além de Ti
Não há outro igual a Ti

Não há outro além de Ti
Não há outro igual a Ti, Senhor`

    };
  }

  // 11. Teu Amor Não Falha / Your Love Never Fails
  if (normalizedTitle.includes("teu amor não falha") || normalizedTitle.includes("teu amor nao falha") || normalizedTitle.includes("your love never fails")) {
    return {
      title: "Teu Amor Não Falha",
      artist: "Nívea Soares",
      key: "C",
      bpm: 115,
      timeSignature: "4/4",
      youtube: "https://www.youtube.com/watch?v=7uC26gQ8U_U",
      chords: `[Intro]
C  G  Am  F

[Verso 1]
C              G
  Nada pode me separar
Am                 F
  Mesmo se eu me perder
C                 G        Am   F
  Teu amor não falha
C                     G
  Mesmo quando a fraqueza vem
Am                    F
  Tua força me sustém
C                 G        Am   F
  Teu amor não falha

[Refrão]
F            C             G
  Tu és o mesmo pra sempre
          Dm7              F
Teu amor nunca mudará
             C              G    Dm7
Se as tempestades me cercarem
F               C             G
  Não temerei mal nenhum
                  Dm7              F
Pois sei que Tu me amas
             C              G    Dm7
Teu amor não falha

[Verso 2]
C                     G
  Se o mar agitado estiver
Am                   F
  Sobre as ondas andarei
C                 G        Am   F
  Teu amor não falha
C                  G
  O Teu amor me resgatou
Am                  F
  A Tua cruz me salvou
C                 G        Am   F
  Teu amor não falha

[Ponte]
F              Am            G
  Tu fazes tudo cooperar
                     Dm7
Para o meu bem
F              Am            G
  Tu fazes tudo cooperar
                     Dm7
Para o meu bem`,
      lyrics: `Nada pode me separar
Mesmo se eu me perder
Teu amor não falha
Mesmo quando a fraqueza vem
Tua força me sustém
Teu amor não falha

Tu és o mesmo pra sempre
Teu amor nunca mudará
Se as tempestades me cercarem
Não temerei mal nenhum
Pois sei que Tu me amas
Teu amor não falha

Se o mar agitado estiver
Sobre as ondas andarei
Teu amor não falha
O Teu amor me resgatou
A Tua cruz me salvou
Teu amor não falha

Tu fazes tudo cooperar
Para o meu bem
Tu fazes tudo cooperar
Para o meu bem`
    };
  }

  // 12. Raridade
  if (normalizedTitle.includes("raridade")) {
    return {
      title: "Raridade",
      artist: "Anderson Freire",
      key: "B",
      bpm: 68,
      timeSignature: "4/4",
      youtube: "https://www.youtube.com/watch?v=mYqS3W4y6zQ",
      chords: `[Intro]
E  F#  G#m  F#/A#  B  E

[Verso 1]
B                       F#/A#
Não consigo entender o que Tu vês em mim
G#m                 E
O que Te faz me amar tanto assim
B                   F#/A#
Tanta fraqueza, tanta imperfeição
G#m                     E
E mesmo assim não me deixas na mão

[Pré-Refrão]
C#m                 G#m
Mesmo que eu não consiga entender
C#m                 F#
O Teu amor nunca vai me esquecer

[Refrão]
B                      F#/A#
Você é um espelho que reflete a imagem do Senhor
G#m                   E
Não chore se o mundo ainda não te notou
B                  F#/A#
Já é o bastante Deus reconhecer o teu valor
C#m                    E                   B
Você é precioso, mais raro que o ouro puro de Ofir`,
      lyrics: `Não consigo entender o que Tu vês em mim
O que Te faz me amar tanto assim
Tanta fraqueza, tanta imperfeição
E mesmo assim não me deixas na mão

Mesmo que eu não consiga entender
O Teu amor nunca vai me esquecer

Você é um espelho que reflete a imagem do Senhor
Não chore se o mundo ainda não te notou
Já é o bastante Deus reconhecer o teu valor
Você é precioso, mais raro que o ouro puro de Ofir`
    };
  }

  // 12. Conversão - Harpa Cristã 15
  if (normalizedTitle.includes("conversão") || normalizedTitle.includes("conversao") || (normalizedTitle.includes("15") && (normalizedArtist.includes("harpa") || normalizedTitle.includes("harpa")))) {
    return {
      title: "Conversão - 15",
      artist: "Harpa Cristã",
      key: "E",
      bpm: 120,
      timeSignature: "4/4",
      chords: `[Intro]
E  B7  E

[Verso 1]
    E                         B7
Oh! Quão cego andei e perdido vaguei
                      E
Longe, longe do meu Salvador!
                          A
Mas da glória desceu e Seu sangue verteu
     E         B7     E
Pra salvar um tão pobre pecador

[Refrão]
       E                   B7
Foi na cruz, foi na cruz, onde um dia eu vi
                    E
Meu pecado castigado em Jesus
                    A
Foi ali, pela fé, a paz encontrei
      E         B7     E
E de amor me alegro na Sua luz

[Verso 2]
     E                         B7
Eu ouvia falar dessa graça sem par
                     E
Que do céu trouxe nosso Jesus
                       A
Mas eu era surdo ao Seu terno chamar
       E        B7      E
Desprezando o penoso sofrer na cruz

[Refrão]
       E                   B7
Foi na cruz, foi na cruz, onde um dia eu vi
                    E
Meu pecado castigado em Jesus
                    A
Foi ali, pela fé, a paz encontrei
      E         B7     E
E de amor me alegro na Sua luz

[Verso 3]
     E                         B7
Mas um dia senti meus pecados, e vi
                     E
Sobre mim o castigo da lei
                       A
Mas depressa fugi, em Jesus me escondi
       E        B7      E
E refúgio seguro n'Ele achei

[Refrão]
       E                   B7
Foi na cruz, foi na cruz, onde um dia eu vi
                    E
Meu pecado castigado em Jesus
                    A
Foi ali, pela fé, a paz encontrei
      E         B7     E
E de amor me alegro na Sua luz`,
      lyrics: `Oh! Quão cego andei e perdido vaguei
Longe, longe do meu Salvador!
Mas da glória desceu e Seu sangue verteu
Pra salvar um tão pobre pecador

Foi na cruz, foi na cruz, onde um dia eu vi
Meu pecado castigado em Jesus
Foi ali, pela fé, a paz encontrei
E de amor me alegro na Sua luz

Eu ouvia falar dessa graça sem par
Que do céu trouxe nosso Jesus
Mas eu era surdo ao Seu terno chamar
Desprezando o penoso sofrer na cruz

Mas um dia senti meus pecados, e vi
Sobre mim o castigo da lei
Mas depressa fugi, em Jesus me escondi
E refúgio seguro n'Ele achei`
    };
  }

  // 13. A Ele a Glória
  if (normalizedTitle.includes("a ele a glória") || normalizedTitle.includes("a ele a gloria")) {
    return {
      title: "A Ele a Glória",
      artist: "Diante do Trono",
      key: "G",
      bpm: 68,
      timeSignature: "4/4",
      chords: `[Intro]
G  D/F#  Em7  C9

[Verso]
G           D/F#        Em7
Porque d'Ele e por Ele
          C9
Para Ele são todas as coisas
G           D/F#        Em7
Porque d'Ele e por Ele
          C9
Para Ele são todas as coisas

[Refrão]
G           D/F#
A Ele a glória
Em7         C9
A Ele a glória
G           D/F#
A Ele a glória
Em7   D/F#  C9      G
Pra sempre, amém`,
      lyrics: `Porque d'Ele e por Ele
Para Ele são todas as coisas
Porque d'Ele e por Ele
Para Ele são todas as coisas

A Ele a glória
A Ele a glória
A Ele a glória
Pra sempre, amém`
    };
  }

  // 14. Alto Preço
  if (normalizedTitle.includes("alto preço") || normalizedTitle.includes("alto preco")) {
    return {
      title: "Alto Preço",
      artist: "Asaph Borba",
      key: "G",
      bpm: 76,
      timeSignature: "4/4",
      category: "Redenção/Ação de Graças",
      chords: `[Intro]
G  C  D  G

[Verso]
G                Em
Não foi com ouro nem com prata
      C              D
Que Jesus nos resgatou
G            Em
Foi com Seu sangue derramado
       C          D
Que a vida nos doou

[Refrão]
   C          D/C
Se nós nos amamos
       Bm7         Em7
Deus habita entre nós
    Am7           D
E o Seu amor em todos nós
       G
Se aperfeiçoa`,
      lyrics: `Não foi com ouro nem com prata
Que Jesus nos resgatou
Foi com Seu sangue derramado
Que a vida nos doou

Se nós nos amamos
Deus habita entre nós
E o Seu amor em todos nós
Se aperfeiçoa`
    };
  }

  // 15. Bendito seja Deus e Pai
  if (normalizedTitle.includes("bendito seja deus e pai")) {
    return {
      title: "Bendito seja Deus e Pai",
      artist: "Graça Soberana",
      key: "D",
      bpm: 72,
      timeSignature: "4/4",
      category: "Consumação/Resposta",
      chords: `[Intro]
D  G  D/F#  A

[Verso 1]
D              G
Bendito seja Deus e Pai
      Bm7            A
Do Senhor Jesus, o Cristo
D             G
Por Sua grande compaixão
       Bm7          A
Nova vida concedeu

[Refrão]
G           D
Glória, aleluia
Bm7         A
Cristo ressurgiu
G           D
Glória, aleluia
Bm7    A      D
Vida nova nos deu`,
      lyrics: `Bendito seja Deus e Pai
Do Senhor Jesus, o Cristo
Por Sua grande compaixão
Nova vida concedeu

Glória, aleluia
Cristo ressurgiu
Glória, aleluia
Vida nova nos deu`
    };
  }

  // 16. Canção do Apocalipse
  if (normalizedTitle.includes("canção do apocalipse") || normalizedTitle.includes("cancao do apocalipse")) {
    return {
      title: "Canção do Apocalipse",
      artist: "Diante do Trono",
      key: "D",
      bpm: 64,
      timeSignature: "4/4",
      category: "Consumação/Resposta",
      chords: `[Intro]
D  Am7  C  G

[Verso]
D                       Am7
Digno é o Cordeiro que foi morto
C                         G
Santo, Santo é Ele
D                   Am7
Um novo cântico ao que se assenta
C                     G
Sobre o trono no céu

[Refrão]
D
Santo, Santo, Santo
Am7
Deus Todo-Poderoso
C
Que era, e é
          G
E há de vir`,
      lyrics: `Digno é o Cordeiro que foi morto
Santo, Santo é Ele
Um novo cântico ao que se assenta
Sobre o trono no céu

Santo, Santo, Santo
Deus Todo-Poderoso
Que era, e é
E há de vir`
    };
  }

  // 17. Cantai Ao Senhor
  if (normalizedTitle.includes("cantai ao senhor")) {
    return {
      title: "Cantai Ao Senhor",
      artist: "Paulo César Baruk",
      key: "A",
      bpm: 104,
      timeSignature: "4/4",
      chords: `[Intro]
A  D/A  E/A  D/A

[Verso]
A           D/A        E/A         D/A
Cantai ao Senhor um cântico novo
A           D/A        E/A         D/A
Cantai ao Senhor todas as terras
A          F#m7      D        E
Cantai ao Senhor, bendizei o Seu nome
Bm7           E             A
Proclamai a Sua salvação

[Refrão]
A            D
Porque grande é o Senhor
Bm7        E
Digno de louvor
A            D
Mais temível do que todos os deuses
Bm7    E        A
Exaltado para sempre`,
      lyrics: `Cantai ao Senhor um cântico novo
Cantai ao Senhor todas as terras
Cantai ao Senhor, bendizei o Seu nome
Proclamai a Sua salvação

Porque grande é o Senhor
Digno de louvor
Mais temível do que todos os deuses
Exaltado para sempre`
    };
  }

  // 18. É o Teu Povo
  if (normalizedTitle.includes("é o teu povo") || normalizedTitle.includes("e o teu povo")) {
    return {
      title: "É o Teu Povo",
      artist: "IPALPHA",
      key: "E",
      bpm: 70,
      timeSignature: "4/4",
      category: "CRIAÇÃO/ADORAÇÃO",
      chords: `[Intro]
E  B/D#  C#m7  A9

[Verso]
E            B/D#
É o Teu povo reunido
C#m7           A9
Para adorar Teu santo nome
E            B/D#
Reconhecemos Tua glória
C#m7          A9
Criador de todo o universo

[Refrão]
E         B
Santo és, Senhor Deus
C#m7      A9
Digno de honra e louvor`,
      lyrics: `É o Teu povo reunido
Para adorar Teu santo nome
Reconhecemos Tua glória
Criador de todo o universo

Santo és, Senhor Deus
Digno de honra e louvor`
    };
  }

  // 19. Perdão e Graça
  if (normalizedTitle.includes("perdão e graça") || normalizedTitle.includes("perdao e graca")) {
    return {
      title: "Perdão e Graça",
      artist: "Vineyard",
      key: "G",
      bpm: 68,
      timeSignature: "4/4",
      category: "QUEDA/CONFISSÃO",
      chords: `[Intro]
G  C/G  G  C/G

[Verso]
G           C/G
Perdão e graça encontrei
Em7         D
Na Tua cruz me prostrei
G           C/G
Meus erros todos deixo aqui
Em7          D        C
Pois Teu perdão me restaurou

[Refrão]
G           D
Tua graça é maior que a dor
Em7         C
Teu amor me resgatou`,
      lyrics: `Perdão e graça encontrei
Na Tua cruz me prostrei
Meus erros todos deixo aqui
Pois Teu perdão me restaurou

Tua graça é maior que a dor
Teu amor me resgatou`
    };
  }

  // 20. Tudo pra tua gloria
  if (normalizedTitle.includes("tudo pra tua gloria") || normalizedTitle.includes("tudo para tua glória") || normalizedTitle.includes("tudo pra tua glória")) {
    return {
      title: "Tudo pra tua gloria",
      artist: "Graça Soberana",
      key: "C",
      bpm: 74,
      timeSignature: "4/4",
      category: "REDENÇÃO/AÇÃO DE GRAÇAS",
      chords: `[Intro]
C  G/B  Am7  F9

[Verso]
C           G/B
Tudo o que tenho e sou
Am7         F9
Consagro a Ti, Jesus
C           G/B
Minha vida, meu caminhar
Am7        F9
Tudo pra Tua glória

[Refrão]
C         G
Glória ao Salvador
Am7       F
Redentor, Senhor`,
      lyrics: `Tudo o que tenho e sou
Consagro a Ti, Jesus
Minha vida, meu caminhar
Tudo pra Tua glória

Glória ao Salvador
Redentor, Senhor`
    };
  }

  return undefined;
}

export const DEFAULT_LOCAL_SONGS: PopularSong[] = [
  findLocalPopularSong("A Ele a Glória", "Diante do Trono")!,
  findLocalPopularSong("Alto Preço", "Asaph Borba")!,
  findLocalPopularSong("Bendito seja Deus e Pai", "Graça Soberana")!,
  findLocalPopularSong("Bondade de Deus", "Isaías Saad")!,
  findLocalPopularSong("Canção do Apocalipse", "Diante do Trono")!,
  findLocalPopularSong("Cantai Ao Senhor", "Paulo César Baruk")!,
  findLocalPopularSong("É o Teu Povo", "IPALPHA")!,
  findLocalPopularSong("Perdão e Graça", "Vineyard")!,
  findLocalPopularSong("Tudo pra tua gloria", "Graça Soberana")!,
  findLocalPopularSong("Santos Pra Sempre", "Gabriel Guedes")!,
  findLocalPopularSong("Ousado Amor", "Isaías Saad")!,
  findLocalPopularSong("Caminho no Deserto", "Soraya Moraes")!,
  findLocalPopularSong("Lugar Secreto", "Gabriela Rocha")!,
  findLocalPopularSong("Aclame ao Senhor", "Diante do Trono")!,
  findLocalPopularSong("A Casa É Sua", "Casa Worship")!,
  findLocalPopularSong("Me Atraiu", "Gabriela Rocha")!,
  findLocalPopularSong("Cristo És Incomparável", "Morada")!,
  findLocalPopularSong("Teu Amor Não Falha", "Nívea Soares")!,
  findLocalPopularSong("Raridade", "Anderson Freire")!,
  findLocalPopularSong("Conversão", "Harpa Cristã")!
].filter(Boolean);

export function getAllLocalPopularSongs(): PopularSong[] {
  return DEFAULT_LOCAL_SONGS;
}
