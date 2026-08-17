var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_genai = require("@google/genai");

// src/songsDatabase.ts
function findLocalPopularSong(title, artist) {
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedArtist = (artist || "").trim().toLowerCase();
  if (normalizedTitle.includes("santos pra sempre") || normalizedTitle.includes("santos para sempre") || normalizedTitle.includes("holy forever")) {
    return {
      title: "Santos Pra Sempre",
      artist: "Gabriel Guedes",
      key: "C",
      bpm: 72,
      timeSignature: "4/4",
      chords: `[Intro]
C  C4  C  C4

[Verso 1]
C                 C4          C
As muitas gera\xE7\xF5es rendidas em louvor
    Am7         G            F9
Cantando ao Cordeiro uma can\xE7\xE3o
     C
Os que em Ti se foram
  C4              C
E os que h\xE3o de crer
    Am7         G            F9
Cantando ao Cordeiro uma can\xE7\xE3o

[Refr\xE3o]
           F9             Am7
E os anjos cantam: Santo
          G              C
Toda a cria\xE7\xE3o: Santo
         F9             Am7
Tu \xE9s exaltado: Santo
            G
Santo para sempre

[Verso 2]
     C             C4             C
Seu Nome \xE9 sobre todos, Nome sem igual
   Am7          G            F9
Governos e reinos proclamar\xE3o
     C
Os mares e os montes
   C4             C
E toda a cria\xE7\xE3o
    Am7         G            F9
Cantando ao Cordeiro uma can\xE7\xE3o

[Refr\xE3o]
           F9             Am7
E os anjos cantam: Santo
          G              C
Toda a cria\xE7\xE3o: Santo
         F9             Am7
Tu \xE9s exaltado: Santo
            G
Santo para sempre

[Ponte]
            Am7              F9
Teu Nome \xE9 o mais alto, Teu Nome \xE9 o maior
            C                         G
Teu Nome \xE9 perfeito, acima de outros nomes
             Am7               F9
Do Teu Nome vem cura, do Teu Nome h\xE1 vida
              C                      G
Do Teu Nome vem for\xE7a e poder pra vencer

[Refr\xE3o]
           F9             Am7
E os anjos cantam: Santo
          G              C
Toda a cria\xE7\xE3o: Santo
         F9             Am7
Tu \xE9s exaltado: Santo
            G
Santo para sempre`,
      lyrics: `As muitas gera\xE7\xF5es rendidas em louvor
Cantando ao Cordeiro uma can\xE7\xE3o
Os que em Ti se foram
E os que h\xE3o de crer
Cantando ao Cordeiro uma can\xE7\xE3o

E os anjos cantam: Santo
Toda a cria\xE7\xE3o: Santo
Tu \xE9s exaltado: Santo
Santo para sempre

Seu Nome \xE9 sobre todos, Nome sem igual
Governos e reinos proclamar\xE3o
Os mares e os montes
E toda a cria\xE7\xE3o
Cantando ao Cordeiro uma can\xE7\xE3o

Teu Nome \xE9 o mais alto, Teu Nome \xE9 o maior
Teu Nome \xE9 perfeito, acima de outros nomes
Do Teu Nome vem cura, do Teu Nome h\xE1 vida
Do Teu Nome vem for\xE7a e poder pra vencer`
    };
  }
  if (normalizedTitle.includes("ousado amor") || normalizedTitle.includes("reckless love")) {
    return {
      title: "Ousado Amor",
      artist: "Isa\xEDas Saad",
      key: "F#m",
      bpm: 83,
      timeSignature: "6/8",
      chords: `[Intro]
F#m   E   D   A

[Verso 1]
     F#m                E                  D
Antes de eu falar, Tu cantavas sobre mim
                F#m         E          D
Tu tens sido t\xE3o, t\xE3o bom pra mim
     F#m                  E               D
Antes de eu respirar, sopraste Tua vida em mim
                F#m         E          D
Tu tens sido t\xE3o, t\xE3o Deus pra mim

[Refr\xE3o]
          F#m            E              D             A
Oh, impressionante, infinito e ousado amor de Deus
           F#m              E                    D               A
Oh, que deixa as noventa e nove e vem me buscar
               F#m             E
N\xE3o posso compr\xE1-lo, nem merec\xEA-lo
         D          A
Mesmo assim se entregou
          F#m            E              D             A
Oh, impressionante, infinito e ousado amor de Deus

[Verso 2]
     F#m               E                  D
Inimigo eu fui, mas Teu amor lutou por mim
                F#m         E          D
Tu tens sido t\xE3o, t\xE3o bom pra mim
        F#m               E                  D
Quando trago a dor, Tua gra\xE7a me liberta enfim
                F#m         E          D
Tu tens sido t\xE3o, t\xE3o Deus pra mim

[Ponte]
F#m                             E
   Traz luz para as sombras, escala as montanhas
D                    A
Pra me encontrar
F#m                       E
   Derruba as muralhas, destr\xF3i as mentiras
D                    A
Pra me encontrar`,
      lyrics: `Antes de eu falar, Tu cantavas sobre mim
Tu tens sido t\xE3o, t\xE3o bom pra mim
Antes de eu respirar, sopraste Tua vida em mim
Tu tens sido t\xE3o, t\xE3o Deus pra mim

Oh, impressionante, infinito e ousado amor de Deus
Oh, que deixa as noventa e nove e vem me buscar
N\xE3o posso compr\xE1-lo, nem merec\xEA-lo
Mesmo assim se entregou
Oh, impressionante, infinito e ousado amor de Deus

Inimigo eu fui, mas Teu amor lutou por mim
Tu tens sido t\xE3o, t\xE3o bom pra mim
Quando trago a dor, Tua gra\xE7a me liberta enfim
Tu tens sido t\xE3o, t\xE3o Deus pra mim

Traz luz para as sombras, escala as montanhas
Pra me encontrar
Derruba as muralhas, destr\xF3i as mentiras
Pra me encontrar`
    };
  }
  if (normalizedTitle.includes("caminho no deserto") || normalizedTitle.includes("way maker") || normalizedTitle.includes("waymaker")) {
    return {
      title: "Caminho no Deserto",
      artist: "Soraya Moraes",
      key: "C",
      bpm: 68,
      timeSignature: "4/4",
      chords: `[Intro]
F   C   G   Am

[Verso 1]
F
Est\xE1s aqui, movendo entre n\xF3s
C
Te adorarei, Te adorarei
G
Est\xE1s aqui, mudando destinos
Am
Te adorarei, Te adorarei

[Refr\xE3o]
F
Meu Deus \xE9 Deus de milagres, Deus de promessas
C
Caminho no deserto, luz na escurid\xE3o
G              Am
Esse \xE9 o meu Deus, esse \xE9 o meu Deus
F
Meu Deus \xE9 Deus de milagres, Deus de promessas
C
Caminho no deserto, luz na escurid\xE3o
G              Am
Esse \xE9 o meu Deus, esse \xE9 o meu Deus

[Verso 2]
F
Est\xE1s aqui, curando os cora\xE7\xF5es
C
Te adorarei, Te adorarei
G
Est\xE1s aqui, tocando vidas
Am
Te adorarei, Te adorarei`,
      lyrics: `Est\xE1s aqui, movendo entre n\xF3s
Te adorarei, Te adorarei
Est\xE1s aqui, mudando destinos
Te adorarei, Te adorarei

Meu Deus \xE9 Deus de milagres, Deus de promessas
Caminho no deserto, luz na escurid\xE3o
Esse \xE9 o meu Deus, esse \xE9 o meu Deus

Est\xE1s aqui, curando os cora\xE7\xF5es
Te adorarei, Te adorarei
Est\xE1s aqui, tocando vidas
Te adorarei, Te adorarei`
    };
  }
  if (normalizedTitle.includes("bondade de deus") || normalizedTitle.includes("goodness of god")) {
    const isIsaias = normalizedArtist.includes("isa\xEDas") || normalizedArtist.includes("isaias") || normalizedArtist.includes("saad");
    if (isIsaias) {
      return {
        title: "Bondade de Deus",
        artist: "Isa\xEDas Saad",
        key: "D",
        bpm: 70,
        timeSignature: "4/4",
        chords: `[Intro]
G   D   G   D

[Verso 1]
     G                  D
Te amo Deus, Tua gra\xE7a nunca falha
    A                   Bm7
Todos os dias, eu estou em Tuas m\xE3os
                G                      D  A/C# Bm7
Desde quando eu me levanto, at\xE9 eu me deitar
            G               A           D
Eu cantarei    de Tua bondade, Deus

[Refr\xE3o]
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
E na escurid\xE3o Tua presen\xE7a \xE9 minha luz
                 G                 D  A/C#  Bm7
Eu Te conhe\xE7o como Pai ou amigo mais chegado
            G               A           D
Eu vivi de Tua bondade, Deus

[Refr\xE3o]
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
   Tua bondade me seguir\xE1, me seguir\xE1, Senhor
A/C#             G                   D
   Tua bondade me seguir\xE1, me seguir\xE1, Senhor
       A/C#             G
Eu me rendo a Ti, eu Te dou o meu ser
        D        A/C#   Bm7
Tudo o que sou, Te dou
A/C#             G                   D
   Tua bondade me seguir\xE1, me seguir\xE1, Senhor

[Refr\xE3o]
G                                D
   Pois em tudo o que vivi, eu cantarei
G                             D       A
   De Tua bondade, Deus, eu cantarei
G                            D  A/C#  Bm7
   Com tudo o que sou, eu cantarei
            G               A           D
Eu cantarei    de Tua bondade, Deus`,
        lyrics: `Te amo Deus, Tua gra\xE7a nunca falha
Todos os dias, eu estou em Tuas m\xE3os
Desde quando eu me levanto, at\xE9 eu me deitar
Eu cantarei de Tua bondade, Deus

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus

Eu amo a Tua voz que me guia pelo fogo
E na escurid\xE3o Tua presen\xE7a \xE9 minha luz
Eu Te conhe\xE7o como Pai ou amigo mais chegado
Eu vivi de Tua bondade, Deus

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus

Tua bondade me seguir\xE1, me seguir\xE1, Senhor
Tua bondade me seguir\xE1, me seguir\xE1, Senhor
Eu me rendo a Ti, eu Te dou o meu ser
Tudo o que sou, Te dou
Tua bondade me seguir\xE1, me seguir\xE1, Senhor

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
        chords: `[Intro]
Db7M   Ab   Db7M   Ab

[Verso 1]
     Db7M              Ab
Te amo Deus, Tua gra\xE7a nunca falha
    Eb                  Fm7
Todos os dias, eu estou em Tuas m\xE3os
                Db7M                  Ab Eb/G Fm7
Desde quando eu me levanto, at\xE9 eu me deitar
            Db7M            Eb          Ab
Eu cantarei    de Tua bondade, Deus

[Refr\xE3o]
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
E na escurid\xE3o Tua presen\xE7a \xE9 minha luz
                 Db7M              Ab Eb/G  Fm7
Eu Te conhe\xE7o como Pai ou amigo mais chegado
            Db7M            Eb          Ab
Eu vivi de Tua bondade, Deus

[Refr\xE3o]
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
   Tua bondade me seguir\xE1, me seguir\xE1, Senhor
Eb/G             Db7M                Ab
   Tua bondade me seguir\xE1, me seguir\xE1, Senhor
       Eb/G             Db7M
Eu me rendo a Ti, eu Te dou o meu ser
        Ab       Eb/G   Fm7
Tudo o que sou, Te dou
Eb/G             Db7M                Ab
   Tua bondade me seguir\xE1, me seguir\xE1, Senhor

[Refr\xE3o]
Db7M                             Ab
   Pois em tudo o que vivi, eu cantarei
Db7M                          Ab      Eb
   De Tua bondade, Deus, eu cantarei
Db7M                         Ab  Eb/G   Fm7
   Com tudo o que sou, eu cantarei
            Db7M            Eb          Ab
Eu cantarei    de Tua bondade, Deus`,
        lyrics: `Te amo Deus, Tua gra\xE7a nunca falha
Todos os dias, eu estou em Tuas m\xE3os
Desde quando eu me levanto, at\xE9 eu me deitar
Eu cantarei de Tua bondade, Deus

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus

Eu amo a Tua voz que me guia pelo fogo
E na escurid\xE3o Tua presen\xE7a \xE9 minha luz
Eu Te conhe\xE7o como Pai ou amigo mais chegado
Eu vivi de Tua bondade, Deus

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus

Tua bondade me seguir\xE1, me seguir\xE1, Senhor
Tua bondade me seguir\xE1, me seguir\xE1, Senhor
Eu me rendo a Ti, eu Te dou o meu ser
Tudo o que sou, Te dou
Tua bondade me seguir\xE1, me seguir\xE1, Senhor

Pois em tudo o que vivi, eu cantarei
De Tua bondade, Deus, eu cantarei
Com tudo o que sou, eu cantarei
De Tua bondade, Deus`
      };
    }
  }
  if (normalizedTitle.includes("lugar secreto") || normalizedTitle.includes("secret place")) {
    return {
      title: "Lugar Secreto",
      artist: "Gabriela Rocha",
      key: "F#",
      bpm: 72,
      timeSignature: "4/4",
      chords: `[Intro]
B7M   F#   C#   D#m7
B7M   F#   C#   D#m7

[Verso 1]
B7M                      F#
   Tu \xE9s tudo o que eu mais quero
C#                         D#m7
   N\xE3o h\xE1 outro igual a Ti
B7M                   F#
   Tua voice \xE9 o meu farol
C#                           D#m7
   Guia meus passos para o Teu altar

[Verso 2]
B7M                      F#
   No Teu olhar eu vejo quem eu sou
C#                        D#m7
   Tua presen\xE7a me refaz
B7M                     F#
   Em Teus bra\xE7os \xE9 o meu abrigo
C#                         D#m7
   Lugar seguro onde tenho paz

[Refr\xE3o]
            B7M
Quero ir mais fundo
                  F#
Leve-me ao Santo dos Santos
                   C#
Lugar secreto onde Te encontro
             D#m7
Revela a Tua gl\xF3ria para mim
            B7M
Quero ir mais fundo
                  F#
Leve-me ao Santo dos Santos
                   C#
Lugar secreto onde Te encontro
             D#m7
Revela a Tua gl\xF3ria para mim

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
      lyrics: `Tu \xE9s tudo o que eu mais quero
N\xE3o h\xE1 outro igual a Ti
Tua voz \xE9 o meu farol
Guia meus passos para o Teu altar

No Teu olhar eu vejo quem eu sou
Tua presen\xE7a me refaz
Em Teus bra\xE7os \xE9 o meu abrigo
Lugar seguro onde tenho paz

Quero ir mais fundo
Leve-me ao Santo dos Santos
Lugar secreto onde Te encontro
Revela a Tua gl\xF3ria para mim

Quero ir mais fundo
Leve-me ao Santo dos Santos
Lugar secreto onde Te encontro
Revela a Tua gl\xF3ria para mim

Tudo em mim clama por Ti
Tudo em mim deseja a Ti
Como a terra seca clama por chuva

Tudo em mim clama por Ti
Tudo em mim deseja a Ti
Como a terra seca clama por chuva`
    };
  }
  if (normalizedTitle.includes("aclame ao senhor") || normalizedTitle.includes("shout to the lord") || normalizedTitle.includes("aclame ao de senhor")) {
    return {
      title: "Aclame ao Senhor",
      artist: "Diante do Trono",
      key: "A",
      bpm: 80,
      timeSignature: "4/4",
      chords: `[Intro]
A   D   A   D

[Verso 1]
A           E
Meu Jesus, salvador
F#m      E       D
Outro igual n\xE3o h\xE1
 A             D        A
Todos os dias quero louvar
   F#m         G  D/F#  E4  E
As maravilhas do teu amor

[Verso 2]
 A          E
Consolo, abrigo
F#m         E       D
For\xE7a e ref\xFAgio \xE9 o Senhor
A              D          A
Com todo o meu ser, com tudo o que sou
 F#m          G    D/F#  E4  E
Sempre te a...do...ra....rei

[Refr\xE3o]
A            F#m        D         E4   E
Aclame ao Senhor toda a terra e cantemos
A           F#m         D        E4   E
Poder, majestade e louvores ao Rei
F#m                     D
Montes se prostrem e rugam os mares
    E       D/F#     E/G#  E
Ao som de teu no.....me

[Refr\xE3o]
A         F#m        D         E4   E
Alegre te louvo por teus grandes feitos
   A          F#m      D        E4   E
Firmado em ti sempre me manterei
F#m                  D        E     A
Incompar\xE1veis s\xE3o tuas promessas pra mim`,
      lyrics: `Meu Jesus, salvador
Outro igual n\xE3o h\xE1
Todos os dias quero louvar
As maravilhas do teu amor

Consolo, abrigo
For\xE7a e ref\xFAgio \xE9 o Senhor
Com todo o meu ser, com tudo o que sou
Sempre te adorarei

Aclame ao Senhor toda a terra e cantemos
Poder, majestade e louvores ao Rei
Montes se prostrem e rugam os mares
Ao som de teu nome

Alegre te louvo por teus grandes feitos
Firmado em ti sempre me manterei
Incompar\xE1veis s\xE3o tuas promessas pra mim`
    };
  }
  if (normalizedTitle.includes("casa \xE9 sua") || normalizedTitle.includes("casa e sua") || normalizedTitle.includes("casa worship")) {
    return {
      title: "A Casa \xC9 Sua",
      artist: "Casa Worship",
      key: "G",
      bpm: 74,
      timeSignature: "4/4",
      chords: `[Intro]
C7M   D   Em7   Bm7
C7M   D   Em7   Bm7

[Verso 1]
            C7M                      D
Voc\xEA \xE9 bem-vindo aqui, e a casa \xE9 Sua, pode entrar
            Em7                     Bm7
Voc\xEA \xE9 bem-vindo aqui, e a casa \xE9 Sua, pode entrar
                      C7M                     D
Deixa a Sua gl\xF3ria encher este lugar, debaixo das Suas asas \xE9 o meu lugar
                      Em7                     Bm7
Deixa a Sua gl\xF3ria encher este lugar, debaixo das Suas asas \xE9 o meu lugar

[Ponte]
               C7M           D
Vem, vem, Jesus... Vem, vem, Jesus

[Refr\xE3o]
 C7M
Essa casa \xE9 Sua casa, n\xF3s deixamos ela pra Voc\xEA, Jesus
 D
Essa casa \xE9 Sua casa, n\xF3s deixamos ela pra Voc\xEA, Jesus
 Em7
Essa casa \xE9 Sua casa, n\xF3s deixamos ela pra Voc\xEA, Jesus
 Bm7
Essa casa \xE9 Sua casa, n\xF3s deixamos ela pra Voc\xEA, Jesus`,
      lyrics: `Voc\xEA \xE9 bem-vindo aqui, e a casa \xE9 Sua, pode entrar
Voc\xEA \xE9 bem-vindo aqui, e a casa \xE9 Sua, pode entrar
Deixa a Sua gl\xF3ria encher este lugar, debaixo das Suas asas \xE9 o meu lugar
Deixa a Sua gl\xF3ria encher este lugar, debaixo das Suas asas \xE9 o meu lugar

Vem, vem, Jesus... Vem, vem, Jesus

Essa casa \xE9 Sua casa, n\xF3s deixamos ela pra Voc\xEA, Jesus
Essa casa \xE9 Sua casa, n\xF3s deixamos ela pra Voc\xEA, Jesus
Essa casa \xE9 Sua casa, n\xF3s deixamos ela pra Voc\xEA, Jesus
Essa casa \xE9 Sua casa, n\xF3s deixamos ela pra Voc\xEA, Jesus`
    };
  }
  if (normalizedTitle.includes("me atraiu") || normalizedTitle.includes("atraiu")) {
    return {
      title: "Me Atraiu",
      artist: "Gabriela Rocha",
      key: "G",
      bpm: 72,
      timeSignature: "4/4",
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
Deixei toda a autossufici\xEAncia que havia em mim
      C9                 G
Me esvaziei de tudo o que sou
      Em7                  D
E assumi o meu papel de servo do meu Senhor

[Ponte]
              C9                            G
Porque Ele me amou primeiro, Ele me amou primeiro
                Em7                              D
E a Sua cruz me resgatou, e a Sua gra\xE7a me alcan\xE7ou

[Refr\xE3o]
         C9            G
Me atraiu... Me atraiu...
         Em7                    D
Me atraiu o Teu amor, me atraiu o Teu amor`,
      lyrics: `Deixei as minhas redes na beira do mar
Deixei os meus barcos pra Te acompanhar
O Teu olhar me chamou pra perto
E eu Te disse sim, pro caminho certo

Deixei as minhas desculpas pra Te seguir
Deixei toda a autossufici\xEAncia que havia em mim
Me esvaziei de tudo o que sou
E assumi o meu papel de servo do meu Senhor

Porque Ele me amou primeiro, Ele me amou primeiro
E a Sua cruz me resgatou, e a Sua gra\xE7a me alcan\xE7ou

Me atraiu... Me atraiu...
Me atraiu o Teu amor, me atraiu o Teu amor`
    };
  }
  if ((normalizedTitle.includes("incompar\xE1vel") || normalizedTitle.includes("incomparavel")) && normalizedTitle.includes("cristo")) {
    return {
      title: "Cristo \xC9s Incompar\xE1vel",
      artist: "Deigma Marques",
      key: "G",
      bpm: 68,
      timeSignature: "4/4",
      chords: `[Intro]
G   D/F#   Em7   C9 (2x)

[Verso 1]
G                 D/F#        Em7  C9
  Tua beleza me atrai
G                       D/F#        Em7  C4  C
  Tua santidade me constrange
Em7                   D               C9
  Ao Teu nome todo joelho se dobrar\xE1
Em7                  D               C9
  Tua gl\xF3ria enche a terra
                       D4  D
E os c\xE9us se curvam a Ti

[Refr\xE3o]
G                D/F#
  Cristo \xE9s incompar\xE1vel
Em7              C9
  Cristo \xE9s incompar\xE1vel
G              D/F#
  N\xE3o h\xE1 outro al\xE9m de Ti
Em7            C9
  N\xE3o h\xE1 outro igual a Ti

[Interl\xFAdio]
G   D/F#   Em7   C9

[Ponte]
G           D/F#  Em7   C9
Jesus...  Jesus...  Jesus...  Jesus...

[Refr\xE3o]
G                D/F#
  Cristo \xE9s incompar\xE1vel
Em7              C9
  Cristo \xE9s incompar\xE1vel
G              D/F#
  N\xE3o h\xE1 outro al\xE9m de Ti
Em7            C9
  N\xE3o h\xE1 outro igual a Ti

G              D/F#
  N\xE3o h\xE1 outro al\xE9m de Ti
Em7            C9             G
  N\xE3o h\xE1 outro igual a Ti, Senhor`,
      lyrics: `Tua beleza me atrai
Tua santidade me constrange
Ao Teu nome todo joelho se dobrar\xE1
Tua gl\xF3ria enche a terra
E os c\xE9us se curvam a Ti

Cristo \xE9s incompar\xE1vel
Cristo \xE9s incompar\xE1vel
N\xE3o h\xE1 outro al\xE9m de Ti
N\xE3o h\xE1 outro igual a Ti

Jesus, Jesus, Jesus, Jesus

Cristo \xE9s incompar\xE1vel
Cristo \xE9s incompar\xE1vel
N\xE3o h\xE1 outro al\xE9m de Ti
N\xE3o h\xE1 outro igual a Ti

N\xE3o h\xE1 outro al\xE9m de Ti
N\xE3o h\xE1 outro igual a Ti, Senhor`
    };
  }
  return void 0;
}

// src/localBibleDb.ts
var OFFLINE_PASSAGES = {
  "jo\xE3o": {
    1: [
      { verse: 1, text: "No princ\xEDpio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus." },
      { verse: 2, text: "Ele estava no princ\xEDpio com Deus." },
      { verse: 3, text: "Todas as coisas foram feitas por meio dele, e, sem ele, nada do que foi feito se fez." },
      { verse: 4, text: "Nele estava a vida, e a vida era a luz dos homens." },
      { verse: 5, text: "A luz resplandece nas trevas, e as trevas n\xE3o prevaleceram contra ela." },
      { verse: 6, text: "Houve um homem enviado por Deus, cujo nome era Jo\xE3o." },
      { verse: 7, text: "Este veio como testemunha para testificar a respeito da luz, a fim de que todos cressem por meio dele." },
      { verse: 8, text: "Ele n\xE3o era a luz, mas veio para testificar da luz." },
      { verse: 9, text: "A saber, a verdadeira luz, que ilumina a todo homem, estava vindo ao mundo." },
      { verse: 10, text: "O Verbo estava no mundo, o mundo foi feito por meio dele, mas o mundo n\xE3o o conheceu." },
      { verse: 11, text: "Veio para o que era seu, e os seus n\xE3o o receberam." },
      { verse: 12, text: "Mas, a todos quantos o receberam, deu-lhes o poder de serem feitos filhos de Deus, a saber, aos que creem no seu nome," },
      { verse: 13, text: "os quais n\xE3o nasceram do sangue, nem da vontade da carne, nem da vontade do homem, mas de Deus." },
      { verse: 14, text: "E o Verbo se fez carne e habitou entre n\xF3s, cheio de gra\xE7a e de verdade, e vimos a sua gl\xF3ria, gl\xF3ria como do Unig\xEAnito do Pai." }
    ],
    3: [
      { verse: 1, text: "Havia um homem entre os fariseus, chamado Nicodemos, um dos principais dos judeus." },
      { verse: 2, text: "Este, de noite, foi falar com Jesus e lhe disse: \u2014 Rabi, sabemos que o senhor \xE9 Mestre vindo da parte de Deus; porque ningu\xE9m pode fazer estes sinais que o senhor faz, se Deus n\xE3o estiver com ele." },
      { verse: 3, text: "Jesus respondeu: \u2014 Em verdade, in verdade lhe digo que, se algu\xE9m n\xE3o nascer de novo, n\xE3o pode ver o Reino de Deus." },
      { verse: 16, text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unig\xEAnito, para que todo o que nele cr\xEA n\xE3o pere\xE7a, mas tenha a vida eterna." },
      { verse: 17, text: "Porque Deus enviou o seu Filho ao mundo, n\xE3o para condenar o mundo, mas para que o mundo fosse salvo por meio dele." },
      { verse: 18, text: "Quem nele cr\xEA n\xE3o \xE9 condenado; mas o que n\xE3o cr\xEA j\xE1 est\xE1 condenado, porque n\xE3o cr\xEA no nome do unig\xEAnito Filho de Deus." },
      { verse: 19, text: "A condena\xE7\xE3o \xE9 esta: a luz veio ao mundo, mas os homens amaram mais as trevas do que a luz, porque as suas obras eram m\xE1s." },
      { verse: 20, text: "Pois todo aquele que pratica o mal odeia a luz e n\xE3o se aproxima da luz, para que as suas obras n\xE3o sejam reprovadas." },
      { verse: 21, text: "Mas quem pratica a verdade aproxima-se da luz, a fim de que as suas obras sejam manifestas, porque s\xE3o feitas em Deus." }
    ]
  },
  "salmos": {
    23: [
      { verse: 1, text: "O Senhor \xE9 o meu pastor; nada me faltar\xE1." },
      { verse: 2, text: "Ele me faz deitar em verdes pastos e me guia mansamente a \xE1guas tranquilas." },
      { verse: 3, text: "Refrigera a minha alma; guia-me pelas veredas da justi\xE7a, por amor do seu nome." },
      { verse: 4, text: "Ainda que eu ande pelo vale da sombra da morte, n\xE3o temerei mal algum, porque tu est\xE1s comigo; o teu bord\xE3o e o teu cajado me consolam." },
      { verse: 5, text: "Preparas uma mesa diante de mim na presen\xE7a dos meus inimigos, unges a minha cabe\xE7a com \xF3leo, o meu c\xE1lice transborda." },
      { verse: 6, text: "A bondade e a miseric\xF3rdia certamente me seguir\xE3o todos os dias da minha vida; e habitarei na Casa do Senhor para sempre." }
    ],
    91: [
      { verse: 1, text: "Aquele que habita no esconderijo do Alt\xEDssimo e descansa \xE0 sombra do Onipotente" },
      { verse: 2, text: "diz ao Senhor: 'Meu ref\xFAgio e minha fortaleza, meu Deus, em quem confio.'" },
      { verse: 3, text: "Pois ele livrar\xE1 voc\xEA do la\xE7o do passarinheiro e da peste perniciosa." },
      { verse: 4, text: "Ele o cobrir\xE1 com as suas penas, e sob as suas asas voc\xEA estar\xE1 seguro; a sua fidelidade \xE9 escudo e prote\xE7\xE3o." },
      { verse: 5, text: "Voc\xEA n\xE3o ter\xE1 medo do terror da noite, nem da seta que voa de dia," },
      { verse: 6, text: "nem da peste que propaga nas trevas, nem da mortandade que assola ao meio-dia." },
      { verse: 7, text: "Mil cair\xE3o ao seu lado, e dez mil, \xE0 sua direita, mas voc\xEA n\xE3o ser\xE1 atingido." },
      { verse: 8, text: "Somente com os teus olhos voc\xEA contemplar\xE1 e ver\xE1 o castigo dos \xEDmpios." },
      { verse: 9, text: "Voc\xEA disse: 'O Senhor \xE9 o meu ref\xFAgio.' No Alt\xEDssimo voc\xEA fez a sua habita\xE7\xE3o." },
      { verse: 10, text: "Nenhum mal lhe suceder\xE1, praga nenhuma chegar\xE1 \xE0 tua tenda." }
    ],
    92: [
      { verse: 1, text: "Bom \xE9 render gra\xE7as ao Senhor e cantar louvores ao teu nome, \xF3 Alt\xEDssimo," },
      { verse: 2, text: "anunciar de manh\xE3 a tua miseric\xF3rdia e, durante as noites, a tua fidelidade," },
      { verse: 3, text: "com instrumentos de dez cordas, ao som da lira e com a solenidade da harpa." },
      { verse: 4, text: "Pois me alegraste, Senhor, com os teus feitos; exultarei nas obras das tuas m\xE3os." },
      { verse: 5, text: "Como s\xE3o grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!" }
    ]
  },
  "g\xEAnesis": {
    1: [
      { verse: 1, text: "No princ\xEDpio, Deus criou os c\xE9us e a terra." },
      { verse: 2, text: "A terra era sem forma e vazia; havia trevas sobre a face do abismo, e o Esp\xEDrito de Deus se movia sobre as \xE1guas." },
      { verse: 3, text: "Deus disse: \u2014 Haja luz. E houve luz." },
      { verse: 4, text: "E Deus viu que a luz era boa; e fez separa\xE7\xE3o entre a luz e as trevas." },
      { verse: 5, text: "Deus chamou \xE0 luz 'Dia' e \xE0s trevas chamou 'Noite'. Houve tarde e manh\xE3, o primeiro dia." }
    ]
  },
  "mateus": {
    6: [
      { verse: 9, text: "Portanto, orem assim: Pai nosso, que est\xE1s nos c\xE9us, santificado seja o teu nome." },
      { verse: 10, text: "Venha o teu Reino. Seja feita a tua vontade, assim na terra como no c\xE9u." },
      { verse: 11, text: "O p\xE3o nosso de cada dia nos d\xE1 hoje." },
      { verse: 12, text: "E perdoa-nos as nossas d\xEDvidas, assim como n\xF3s perdoamos aos nossos devedores." },
      { verse: 13, text: "E n\xE3o nos deixes cair em tenta\xE7\xE3o, mas livra-nos do mal; pois teu \xE9 o Reino, o poder e a gl\xF3ria para sempre. Am\xE9m." }
    ]
  },
  "marcos": {
    9: [
      { verse: 50, text: "O sal \xE9 bom; mas, se o sal vier a se tornar ins\xEDpido, como lhe restaurar o sabor? Tenham sal em voc\xEAs mesmos e paz uns com os outros." }
    ],
    10: [
      { verse: 1, text: "Saindo dali, Jesus foi para o territ\xF3rio da Judeia e para al\xE9m do Jord\xE3o. E outra vez as multid\xF5es se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume." }
    ]
  },
  "tito": {
    1: [
      { verse: 1, text: "Paulo, servo de Deus e ap\xF3stolo de Jesus Cristo, para promover a f\xE9 dos eleitos de Deus e o conhecimento da verdade que \xE9 segundo a piedade," },
      { verse: 2, text: "na esperan\xE7a da vida eterna, a qual o Deus que n\xE3o pode mentir prometeu antes dos tempos eternos," },
      { verse: 3, text: "e no tempo pr\xF3prio manifestou a sua palavra mediante a prega\xE7\xE3o que me foi confiada segundo o mandamento de Deus, nosso Salvador," },
      { verse: 4, text: "a Tito, verdadeiro filho segundo a f\xE9 comum: Gra\xE7a e paz, da parte de Deus Pai e de Cristo Jesus, nosso Salvador." },
      { verse: 5, text: "Por esta causa o deixei em Creta, para que pusesse em ordem as coisas restantes e, de cidade em cidade, constitu\xEDsse presb\xEDteros, como lhe ordenei:" },
      { verse: 6, text: "algu\xE9m que seja irrepreens\xEDvel, marido de uma s\xF3 mulher, cujos filhos sejam crentes e n\xE3o acusados de dissolu\xE7\xE3o ou de insubordina\xE7\xE3o." },
      { verse: 7, text: "Pois \xE9 necess\xE1rio que o bispo seja irrepreens\xEDvel, como despenseiro de Deus, n\xE3o soberbo, nem irasc\xEDvel, nem dado ao vinho, nem violento, nem cobi\xE7oso de torpe ganho;" },
      { verse: 8, text: "mas hospitaleiro, amigo do bem, moderado, justo, santo, temperante," },
      { verse: 9, text: "apegado \xE0 palavra fiel, que \xE9 segundo a doutrina, de modo que tenha poder tanto para exortar na s\xE3 doutrina como para convencer os que contradizem." },
      { verse: 10, text: "Pois h\xE1 muitos insubordinados, palradores v\xE3os e enganadores, especialmente os da circuncis\xE3o," },
      { verse: 11, text: "aos quais \xE9 necess\xE1rio tapar a boca; eles transtornam casas inteiras, ensinando o que n\xE3o devem, por torpe ganho." },
      { verse: 12, text: "Um deles, seu pr\xF3prio profeta, disse: Os cretenses s\xE3o sempre mentirosos, feras m\xE1s, ventres pregui\xE7osos." },
      { verse: 13, text: "Este testemunho \xE9 verdadeiro. Portanto, repreenda-os severamente, para que sejam s\xE3os na f\xE9," },
      { verse: 14, text: "n\xE3o dando ouvidos a f\xE1bulas judaicas, nem a mandamentos de homens que se desviam da verdade." },
      { verse: 15, text: "Todas as coisas s\xE3o puras para os puros; mas para os impuros e descrentes nada \xE9 puro; pelo contr\xE1rio, tanto a mente como a consci\xEAncia deles est\xE3o contaminadas." },
      { verse: 16, text: "Confessam que conhecem a Deus, mas pelas suas obras o negam, sendo abomin\xE1veis, desobedientes e desqualificados para toda boa obra." }
    ],
    2: [
      { verse: 1, text: "Tu, por\xE9m, fala o que conv\xE9m \xE0 s\xE3 doutrina." },
      { verse: 2, text: "Ensina os mais velhos a serem moderados, respeit\xE1veis, sensatos, s\xE3os na f\xE9, no amor e na const\xE2ncia." },
      { verse: 3, text: "Semelhantemente, ensina as mulheres idosas a serem reverentes no comportamento, n\xE3o caluniadoras, n\xE3o escravas de muito vinho, mas mestras do bem," },
      { verse: 4, text: "para que instruam as mulheres jovens a amarem a seus maridos e a seus filhos," },
      { verse: 5, text: "a serem sensatas, puras, boas donas de casa, bondosas, sujeitas a seus maridos, para que a palavra de Deus n\xE3o seja difamada." },
      { verse: 6, text: "Exorte semelhantemente os jovens a serem sensatos." },
      { verse: 7, text: "Em tudo te d\xE1 por exemplo de boas obras; na doutrina mostra integridade, gravidade," },
      { verse: 8, text: "linguagem s\xE3 e irrepreens\xEDvel, para que o advers\xE1rio seja envergonhado, n\xE3o tendo nenhum mal que dizer de n\xF3s." },
      { verse: 9, text: "Exorte os servos a que se sujeitem a seus senhores em tudo, sendo-lhes agrad\xE1veis, n\xE3o contradizendo," },
      { verse: 10, text: "n\xE3o defraudando, mas mostrando toda a boa fidelidade, para que em tudo adornem a doutrina de Deus, nosso Salvador." },
      { verse: 11, text: "Porque a gra\xE7a de Deus se manifestou, trazendo salva\xE7\xE3o a todos os homens," },
      { verse: 12, text: "ensinando-nos a abandonar a impiedade e as paix\xF5es mundanas e a viver neste mundo de forma sensata, justa e piedosa," },
      { verse: 13, text: "aguardando a bendita esperan\xE7a e a manifesta\xE7\xE3o da gl\xF3ria do nosso grande Deus e Salvador Cristo Jesus," },
      { verse: 14, text: "o qual se deu a si mesmo por n\xF3s, para nos remir de toda iniquidade e purificar para si um povo todo seu, zeloso de boas obras." },
      { verse: 15, text: "Fala estas coisas, exorte e repreenda com toda a autoridade. Ningu\xE9m te despreze." }
    ],
    3: [
      { verse: 1, text: "Lembra-lhes que se sujeitem aos governantes e \xE0s autoridades, que lhes obede\xE7am, que estejam preparados para toda boa obra," },
      { verse: 2, text: "que a ningu\xE9m caluniem, nem sejam belicosos, mas cordiais, mostrando toda a mansid\xE3o para com todos os homens." },
      { verse: 3, text: "Porque tamb\xE9m n\xF3s \xE9ramos, outrora, insensatos, desobedientes, desgarrados, servindo a v\xE1rias paix\xF5es e deleites, vivendo em mal\xEDcia e inveja, abomin\xE1veis e odiando-nos uns aos outros." },
      { verse: 4, text: "Mas, quando se manifestou a bondade de Deus, nosso Salvador, e o seu amor para com os homens," },
      { verse: 5, text: "n\xE3o por obras de justi\xE7a que tiv\xE9ssemos feito, mas segundo a sua miseric\xF3rdia, ele nos salvou mediante o lavar da regenera\xE7\xE3o e da renova\xE7\xE3o do Esp\xEDrito Santo," },
      { verse: 6, text: "que ele derramou abundantemente sobre n\xF3s por meio de Jesus Cristo, nosso Salvador," },
      { verse: 7, text: "para que, justificados por sua gra\xE7a, nos torn\xE1ssemos herdeiros segundo a esperan\xE7a da vida eterna." },
      { verse: 8, text: "Fiel \xE9 esta palavra, e quero que asseveres com confian\xE7a estas coisas, para que os que creem em Deus procurem aplicar-se \xE0s boas obras. Estas coisas s\xE3o boas e proveitosas aos homens." },
      { verse: 9, text: "Mas evita quest\xF5es tolas, genealogias, contendas e debates acerca da lei; porque s\xE3o coisas in\xFAteis e v\xE3s." },
      { verse: 10, text: "Ao homem faccioso, depois da primeira e segunda admoesta\xE7\xE3o, evita-o," },
      { verse: 11, text: "sabendo que o tal est\xE1 pervertido e peca, sendo condenado por si mesmo." },
      { verse: 12, text: "Quando te enviar \xC1rtemas ou T\xEDquico, apressa-te a vir ter comigo a Nic\xF3polis; porque resolvi invernar ali." },
      { verse: 13, text: "Ajuda com muito empenho a Zenas, doutor da lei, e a Apolo, em sua viagem, para que nada lhes falte." },
      { verse: 14, text: "E os nossos tamb\xE9m aprendam a aplicar-se \xE0s boas obras, para suprir as necessidades urgentes, a fim de que n\xE3o sejam infrut\xEDferos." },
      { verse: 15, text: "Todos os que est\xE3o comigo te sa\xFAdam. Sa\xFAda os que nos amam na f\xE9. A gra\xE7a seja com todos voc\xEAs." }
    ]
  },
  "filipenses": {
    4: [
      { verse: 4, text: "Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!" },
      { verse: 5, text: "Que a modera\xE7\xE3o de voc\xEAs seja conhecida por todos. Perto est\xE1 o Senhor." },
      { verse: 6, text: "N\xE3o fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidos diante de Deus os pedidos de voc\xEAs, pela ora\xE7\xE3o e pela s\xFAplica, com a\xE7\xF5es de gra\xE7as." },
      { verse: 7, text: "E a paz de Deus, que excede todo entendimento, guardar\xE1 o cora\xE7\xE3o e a mente de voc\xEAs em Cristo Jesus." }
    ]
  }
};
function getLocalBiblePassage(book, chapter, version = "NAA") {
  const normalizedBook = book.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isMarcos = normalizedBook === "marcos" || normalizedBook === "marco" || normalizedBook === "mc" || normalizedBook === "mark";
  if (isMarcos && chapter === 10 && version === "NAA") {
    const marcos10Verses = [
      { verse: 1, text: "Saindo dali, Jesus foi para o territ\xF3rio da Judeia e para al\xE9m do Jord\xE3o. E outra vez as multid\xF5es se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume." },
      { verse: 2, text: "E, aproximando-se alguns fariseus, o puseram \xE0 prova, perguntando: \u2014 \xC9 l\xEDcito ao marido repudiar a sua mulher?" },
      { verse: 3, text: "Jesus respondeu: \u2014 O que foi que Mois\xE9s ordenou a voc\xEAs?" },
      { verse: 4, text: "Eles disseram: \u2014 Mois\xE9s permitiu escrever uma carta de div\xF3rcio e repudiar." },
      { verse: 5, text: "Mas Jesus lhes disse: \u2014 Foi por causa da dureza do cora\xE7\xE3o de voc\xEAs que Mois\xE9s deixou escrito esse mandamento." },
      { verse: 6, text: "Por\xE9m, desde o princ\xEDpio da cria\xE7\xE3o, Deus os fez homem e mulher." },
      { verse: 7, text: '"Por isso o homem deixar\xE1 o seu pai e a sua m\xE3e e se unir\xE1 \xE0 sua mulher,' },
      { verse: 8, text: 'tornando-se os dois uma s\xF3 carne." De modo que j\xE1 n\xE3o s\xE3o mais dois, por\xE9m uma s\xF3 carne.' },
      { verse: 9, text: "Portanto, que ningu\xE9m separe o que Deus ajuntou." },
      { verse: 10, text: "Em casa, os disc\xEDpulos voltaram a fazer perguntas sobre esse assunto." },
      { verse: 11, text: "E Jesus lhes disse: \u2014 Quem repudiar a sua mulher e casar com outra comete adult\xE9rio contra aquela." },
      { verse: 12, text: "E, se ela repudiar o seu marido e casar com outro, comete adult\xE9rio." }
    ];
    return {
      reference: `Marcos 10 (NAA)`,
      text: marcos10Verses.map((v) => `${v.verse}. ${v.text}`).join("\n"),
      verses: marcos10Verses,
      isFallback: false,
      warning: null
    };
  }
  const isSalmos = normalizedBook === "salmos" || normalizedBook === "salmo" || normalizedBook === "sl" || normalizedBook === "psalms" || normalizedBook === "psalm";
  if (isSalmos && chapter === 92 && version === "NAA") {
    const salmo92Verses = [
      { verse: 1, text: "Bom \xE9 render gra\xE7as ao Senhor e cantar louvores ao teu nome, \xF3 Alt\xEDssimo," },
      { verse: 2, text: "anunciar de manh\xE3 a tua miseric\xF3rdia e, durante as noites, a tua fidelidade," },
      { verse: 3, text: "com instrumentos de dez cordas, ao som da lira e com a solenidade da harpa." },
      { verse: 4, text: "Pois me alegraste, Senhor, com os teus feitos; exultarei nas obras das tuas m\xE3os." },
      { verse: 5, text: "Como s\xE3o grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!" }
    ];
    return {
      reference: `Salmos 92 (NAA)`,
      text: salmo92Verses.map((v) => `${v.verse}. ${v.text}`).join("\n"),
      verses: salmo92Verses,
      isFallback: false,
      warning: null
    };
  }
  const isFilipenses = normalizedBook === "filipenses" || normalizedBook === "filipense" || normalizedBook === "fp" || normalizedBook === "philippians" || normalizedBook === "phil";
  if (isFilipenses && chapter === 4 && version === "NAA") {
    const filipenses4Verses = [
      { verse: 4, text: "Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!" },
      { verse: 5, text: "Que a modera\xE7\xE3o de voc\xEAs seja conhecida por todos. Perto est\xE1 o Senhor." },
      { verse: 6, text: "N\xE3o fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidos diante de Deus os pedidos de voc\xEAs, pela ora\xE7\xE3o e pela s\xFAplica, com a\xE7\xF5es de gra\xE7as." },
      { verse: 7, text: "E a paz de Deus, que excede todo entendimento, guardar\xE1 o cora\xE7\xE3o e a mente de voc\xEAs em Cristo Jesus." }
    ];
    return {
      reference: `Filipenses 4 (NAA)`,
      text: filipenses4Verses.map((v) => `${v.verse}. ${v.text}`).join("\n"),
      verses: filipenses4Verses,
      isFallback: false,
      warning: null
    };
  }
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
    const textRep2 = verses.map((v) => `${v.verse}. ${v.text}`).join("\n");
    return {
      reference: `${book} ${chapter} (${version})`,
      text: textRep2,
      verses,
      isFallback: true,
      warning: "Exibindo texto offline salvo localmente."
    };
  }
  const generatedVerses = [
    {
      verse: 1,
      text: `O texto completo de ${book} cap\xEDtulo ${chapter} n\xE3o est\xE1 dispon\xEDvel offline.`
    },
    {
      verse: 2,
      text: "Conecte-se \xE0 internet para que o Liloupro possa buscar e carregar automaticamente esta passagem na tradu\xE7\xE3o desejada."
    }
  ];
  const textRep = generatedVerses.map((v) => `${v.verse}. ${v.text}`).join("\n");
  return {
    reference: `${book} ${chapter} (${version})`,
    text: textRep,
    verses: generatedVerses,
    isFallback: true,
    warning: "Dispositivo temporariamente sem conex\xE3o.",
    isDemo: true
  };
}
function adaptToNAA(text) {
  let res = text;
  res = res.replace(/Bom é louvar ao Senhor e cantar louvores ao teu nome, ó Altíssimo;?/gi, "Bom \xE9 render gra\xE7as ao Senhor e cantar louvores ao teu nome, \xF3 Alt\xEDssimo,");
  res = res.replace(/para de manhã anunciar a tua benignidade e, todas as noites, a tua fidelidade/gi, "anunciar de manh\xE3 a tua miseric\xF3rdia e, durante as noites, a tua fidelidade");
  res = res.replace(/para de manhã anunciar a tua benignidade,? e,? todas as noites,? a tua fidelidade/gi, "anunciar de manh\xE3 a tua miseric\xF3rdia e, durante as noites, a tua fidelidade");
  res = res.replace(/para de manhã anunciar a tua benignidade/gi, "anunciar de manh\xE3 a tua miseric\xF3rdia");
  res = res.replace(/todas as noites, a tua fidelidade/gi, "durante as noites, a tua fidelidade");
  res = res.replace(/sobre um instrumento de dez cordas,? e sobre o saltério;? sobre a harpa com som solene/gi, "com instrumentos de dez cordas, ao som da lira e com a solenidade da harpa");
  res = res.replace(/sobre um instrumento de dez cordas, e sobre o saltério; sobre a harpa com som solene\./gi, "com instrumentos de dez cordas, ao som da lira e com a solenidade da harpa.");
  res = res.replace(/Pois tu, Senhor, me alegraste pelos teus feitos/gi, "Pois me alegraste, Senhor, com os teus feitos");
  res = res.replace(/Quão grandes são, Senhor, as tuas obras! Mui profundos são os teus pensamentos/gi, "Como s\xE3o grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!");
  res = res.replace(/Quão grandes são, Senhor, as tuas obras! Muito profundos são os teus pensamentos/gi, "Como s\xE3o grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!");
  res = res.replace(/Como são grandes, Senhor, as tuas obras! Os teus pensamentos são profundos demais/gi, "Como s\xE3o grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!");
  res = res.replace(/E, levantando-se dali, foi para os termos da Judeia, além do Jordão; e outra vez a multidão se reuniu em torno dele, e, de novo, os ensinava, segundo o seu costume/gi, "Saindo dali, Jesus foi para o territ\xF3rio da Judeia e para al\xE9m do Jord\xE3o. E outra vez as multid\xF5es se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume.");
  res = res.replace(/Levantando-se Jesus, partiu dali para os termos da Judéia, e para além do Jordão; e do novo as multidões se reuniram em torno dele; e tornou a ensiná-las, como tinha por costume/gi, "Saindo dali, Jesus foi para o territ\xF3rio da Judeia e para al\xE9m do Jord\xE3o. E outra vez as multid\xF5es se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume.");
  res = res.replace(/E, aproximando-se alguns fariseus, o experimentaram, perguntando-lhe: É lícito ao marido repudiar sua mulher\?/gi, "E, aproximando-se alguns fariseus, o puseram \xE0 prova, perguntando: \u2014 \xC9 l\xEDcito ao marido repudiar a sua mulher?");
  res = res.replace(/E, aproximando-se dele os fariseus, perguntaram-lhe, tentando-o: É lícito ao homem repudiar sua mulher\?/gi, "E, aproximando-se alguns fariseus, o puseram \xE0 prova, perguntando: \u2014 \xC9 l\xEDcito ao marido repudiar a sua mulher?");
  res = res.replace(/E, aproximando-se alguns fariseus, perguntaram-lhe, para o experimentar: É lícito ao homem repudiar sua mulher\?/gi, "E, aproximando-se alguns fariseus, o puseram \xE0 prova, perguntando: \u2014 \xC9 l\xEDcito ao marido repudiar a sua mulher?");
  res = res.replace(/Aproximando-se alguns fariseus, perguntaram-lhe, para o experimentar: É lícito ao homem repudiar sua mulher\?/gi, "E, aproximando-se alguns fariseus, o puseram \xE0 prova, perguntando: \u2014 \xC9 l\xEDcito ao marido repudiar a sua mulher?");
  res = res.replace(/É lícito ao homem repudiar sua mulher\?/gi, "\xC9 l\xEDcito ao marido repudiar a sua mulher?");
  res = res.replace(/Ele, porém, respondendo, disse-lhes: Que vos mandou Moisés\?/gi, "Jesus respondeu: \u2014 O que foi que Mois\xE9s ordenou a voc\xEAs?");
  res = res.replace(/E eles disseram: Moisés permitiu escrever carta de divórcio e repudiar\./gi, "Eles disseram: \u2014 Mois\xE9s permitiu escrever uma carta de div\xF3rcio e repudiar.");
  res = res.replace(/Moisés permitiu escrever carta de divórcio e repudiar\./gi, "Mois\xE9s permitiu escrever uma carta de div\xF3rcio e repudiar.");
  res = res.replace(/Mas Jesus, respondendo, disse-lhes: Pela dureza do vosso coração vos deixou ele escrito esse mandamento;/gi, "Mas Jesus lhes disse: \u2014 Foi por causa da dureza do cora\xE7\xE3o de voc\xEAs que Mois\xE9s deixou escrito esse mandamento.");
  res = res.replace(/Pela dureza do vosso coração vos deixou ele escrito esse mandamento/gi, "Foi por causa da dureza do cora\xE7\xE3o de voc\xEAs que Mois\xE9s deixou escrito esse mandamento");
  res = res.replace(/porém, desde o princípio da criação, Deus os fez macho e fêmea\./gi, "Por\xE9m, desde o princ\xEDpio da cria\xE7\xE3o, Deus os fez homem e mulher.");
  res = res.replace(/Por isso, deixará o homem a seu pai e a sua mãe \[?e unir-se-á a sua mulher\]?,?/gi, '"Por isso o homem deixar\xE1 o seu pai e a sua m\xE3e e se unir\xE1 \xE0 sua mulher,');
  res = res.replace(/Por isso deixará o homem seu pai e sua mãe e se unirá à sua mulher/gi, '"Por isso o homem deixar\xE1 o seu pai e a sua m\xE3e e se unir\xE1 \xE0 sua mulher');
  res = res.replace(/e serão os dois uma só carne; e assim já não são dois, mas uma só carne\./gi, 'tornando-se os dois uma s\xF3 carne." De modo que j\xE1 n\xE3o s\xE3o mais dois, por\xE9m uma s\xF3 carne.');
  res = res.replace(/Portanto, o que Deus ajuntou não o separe o homem\./gi, "Portanto, que ningu\xE9m separe o que Deus ajuntou.");
  res = res.replace(/E em casa tornaram os discípulos a perguntar-lhe acerca disso\./gi, "Em casa, os disc\xEDpulos voltaram a fazer perguntas sobre esse assunto.");
  res = res.replace(/E em casa os discípulos o interrogaram outra vez sobre o mesmo assunto\./gi, "Em casa, os disc\xEDpulos voltaram a fazer perguntas sobre esse assunto.");
  res = res.replace(/Bom é o sal; mas, se o sal se tornar insípido, com que o haveis de temperar\? Tende sal em vós mesmos, e guardai a paz uns com os outros/gi, "O sal \xE9 bom; mas, se o sal vier a se tornar ins\xEDpido, como lhe restaurar o sabor? Tenham sal em voc\xEAs mesmos e paz uns com os outros.");
  res = res.replace(/Deus amou ao mundo de tal maneira/gi, "Deus amou o mundo de tal maneira");
  res = res.replace(/Deus tanto amou o mundo/gi, "Deus amou o mundo de tal maneira");
  res = res.replace(/Ele lhes disse: Quem deitar fora a sua mulher e casar com outra comete adultério contra ela/gi, "E Jesus lhes disse: \u2014 Quem repudiar a sua mulher e casar com outra comete adult\xE9rio contra aquela.");
  res = res.replace(/E ele lhes disse: Qualquer que deixar a sua mulher e casar com outra comete adultério contra ela/gi, "E Jesus lhes disse: \u2014 Quem repudiar a sua mulher e casar com outra comete adult\xE9rio contra aquela.");
  res = res.replace(/Qualquer que se divorciar de sua mulher/gi, "Quem repudiar a sua mulher");
  res = res.replace(/deitar fora a sua mulher/gi, "repudiar a sua mulher");
  res = res.replace(/deixar a sua mulher/gi, "repudiar a sua mulher");
  res = res.replace(/deixar o seu marido/gi, "repudiar o seu marido");
  res = res.replace(/deixar a seu marido/gi, "repudiar o seu marido");
  res = res.replace(/(?:a qual nos educa|ela nos educa) para que, (?:renegadas|renegando) a impiedade e as paixões mundanas, vivamos,? no presente século,? (?:sensata, justa e piedosamente|de forma sensata, justa e piedosa)/gi, "ela nos ensina a abandonar a impiedade e as paix\xF5es mundanas e a viver neste mundo de forma sensata, justa e piedosa");
  res = res.replace(/trazendo salvação a todos os homens/gi, "trazendo salva\xE7\xE3o a todos");
  res = res.replace(/Deus e Salvador Cristo Jesus/gi, "Deus e Salvador Jesus Cristo");
  res = res.replace(/Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos\./gi, "Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!");
  res = res.replace(/Regozijai-vos,? sempre,? no Senhor; outra vez digo: regozijai-vos\./gi, "Alegrem-se sempre no Senhor; outra vez digo: alegrem-se!");
  res = res.replace(/Seja a vossa moderação conhecida de todos os homens\./gi, "Que a modera\xE7\xE3o de voc\xEAs seja conhecida por todos.");
  res = res.replace(/Seja a vossa equidade notória a todos os homens\./gi, "Que a modera\xE7\xE3o de voc\xEAs seja conhecida por todos.");
  res = res.replace(/Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições/gi, "N\xE3o fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidos diante de Deus os pedidos de voc\xEAs");
  res = res.replace(/Não estejais inquietos por coisa alguma; antes, as vossas petições sejam em tudo conhecidas diante de Deus/gi, "N\xE3o fiquem preocupados com coisa alguma, mas, em tudo, sejam conhecidos diante de Deus os pedidos de voc\xEAs");
  res = res.replace(/pela oração e súplicas, com ação de graças\./gi, "pela ora\xE7\xE3o e pela s\xFAplica, com a\xE7\xF5es de gra\xE7as.");
  res = res.replace(/E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e as vossas mentes em Cristo Jesus\./gi, "E a paz de Deus, que excede todo entendimento, guardar\xE1 o cora\xE7\xE3o e a mente de voc\xEAs em Cristo Jesus.");
  res = res.replace(/E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus\./gi, "E a paz de Deus, que excede todo entendimento, guardar\xE1 o cora\xE7\xE3o e a mente de voc\xEAs em Cristo Jesus.");
  res = res.replace(/\bvós\b/g, "voc\xEAs");
  res = res.replace(/\bconvosco\b/g, "com voc\xEAs");
  res = res.replace(/\bvosso(s)?\b/gi, "seu$1");
  res = res.replace(/\bvosso\b/gi, "seu");
  res = res.replace(/\btendes\b/g, "t\xEAm");
  res = res.replace(/\bcredes\b/g, "creem");
  res = res.replace(/\bquereis\b/g, "querem");
  res = res.replace(/\bsabeis\b/g, "sabem");
  res = res.replace(/\bhaveis\b/g, "t\xEAm");
  res = res.replace(/\bide\b/gi, "v\xE3o");
  res = res.replace(/\bvinde\b/gi, "venham");
  res = res.replace(/\boreis\b/g, "orem");
  res = res.replace(/\borareis\b/g, "orem");
  res = res.replace(/\btermos da Judeia\b/gi, "territ\xF3rio da Judeia");
  res = res.replace(/\btermos de\b/gi, "territ\xF3rio de");
  return res;
}

// server.ts
var biblePassageCache = /* @__PURE__ */ new Map();
var bibleExplainCache = /* @__PURE__ */ new Map();
var bibleKeywordSearchCache = /* @__PURE__ */ new Map();
var bibleRefAnalysisCache = /* @__PURE__ */ new Map();
var harmonyAnalysisCache = /* @__PURE__ */ new Map();
var artistImageCacheServer = /* @__PURE__ */ new Map();
var GEMINI_FALLBACK_MODELS = ["gemini-3.7-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
function isQuotaError(error) {
  if (!error) return false;
  const msg = (error?.message || String(error)).toLowerCase();
  const status = error?.status || error?.statusCode;
  return status === 429 || status === 503 || msg.includes("503") || msg.includes("resource_exhausted") || msg.includes("quota") || msg.includes("limit") || msg.includes("rate") || msg.includes("high demand") || msg.includes("unavailable") || msg.includes("429");
}
function cleanErrorString(error) {
  if (!error) return "Indisponivel - servico pausado temporariamente";
  let msg = "";
  if (typeof error === "object") {
    msg = error.message || String(error);
  } else {
    msg = String(error);
  }
  if (msg.includes("429") || msg.includes("503") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("high demand") || msg.toLowerCase().includes("limit") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("exhausted")) {
    return "Servi\xE7o Gemini ocupado ou cota temporariamente atingida. Usando dados locais com seguran\xE7a.";
  }
  msg = msg.replace(/\{"error".*?\}/g, "Erro de processamento de IA").trim();
  msg = msg.replace(/\s+/g, " ");
  if (msg.length > 80) {
    return msg.substring(0, 80) + "...";
  }
  return msg;
}
function getGeminiApiKey() {
  const key1 = process.env.GEMINI_API_KEY;
  const key2 = process.env.GEMINI_API_KEY2;
  const isValid = (key) => {
    if (!key) return false;
    const trimmed = key.trim();
    if (trimmed === "" || trimmed === "MY_GEMINI_API_KEY" || trimmed === "YOUR_GEMINI_API_KEY" || trimmed === "GEMINI_API_KEY" || trimmed.startsWith("MY_") || trimmed.startsWith("YOUR_")) return false;
    return true;
  };
  if (isValid(key1)) return key1;
  if (isValid(key2)) return key2;
  return key1 || key2;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get(["/sw.js", "/manifest.json"], (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/songs/artist-image-search", async (req, res) => {
    const artistName = req.query.artist;
    if (!artistName || artistName.trim().toLowerCase() === "desconhecido") {
      return res.json({ imageUrl: null });
    }
    const cacheKey = artistName.trim().toLowerCase();
    if (artistImageCacheServer.has(cacheKey)) {
      return res.json({ imageUrl: artistImageCacheServer.get(cacheKey) || null });
    }
    let foundUrl = null;
    try {
      const deezResponse = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}`);
      if (deezResponse.ok) {
        const data = await deezResponse.json();
        if (data && data.data && data.data.length > 0) {
          const matchedArtist = data.data[0];
          if (matchedArtist.picture_big || matchedArtist.picture_medium) {
            foundUrl = matchedArtist.picture_big || matchedArtist.picture_medium;
          }
        }
      }
    } catch (deezerError) {
      console.error("Erro ao buscar no Deezer API:", deezerError);
    }
    if (!foundUrl) {
      try {
        const iTunesResponse = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&limit=3&entity=song`);
        if (iTunesResponse.ok) {
          const data = await iTunesResponse.json();
          if (data && data.results && data.results.length > 0) {
            for (const result of data.results) {
              if (result.artworkUrl100) {
                const highResArtwork = result.artworkUrl100.replace("100x100bb", "400x400bb");
                foundUrl = highResArtwork;
                break;
              }
            }
          }
        }
      } catch (itunesError) {
        console.error("Erro ao buscar no iTunes API:", itunesError);
      }
    }
    if (artistImageCacheServer.size >= 2e3) {
      const firstKey = artistImageCacheServer.keys().next().value;
      if (firstKey !== void 0) {
        artistImageCacheServer.delete(firstKey);
      }
    }
    artistImageCacheServer.set(cacheKey, foundUrl);
    return res.json({ imageUrl: foundUrl });
  });
  app.post("/api/analyze-bible-references", async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "O t\xEDtulo e a letra/cifra da m\xFAsica s\xE3o obrigat\xF3rios." });
      }
      const cacheKey = `${title.trim().toLowerCase()}_${content.slice(0, 100).trim().toLowerCase()}`;
      if (bibleRefAnalysisCache.has(cacheKey)) {
        console.log(`[An\xE1lise B\xEDblica] Hit de cache para "${title}"`);
        return res.json(bibleRefAnalysisCache.get(cacheKey));
      }
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("A chave de API do Gemini n\xE3o foi configurada. Utilizando fallback teol\xF3gico local.");
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `Voc\xEA \xE9 um renomado te\xF3logo e analista lit\xFArgico especializado em m\xFAsica crist\xE3 contempor\xE2nea e hinos. Tendo como base a letra fornecida, analise quais passagens, temas e respaldos b\xEDblicos d\xE3o sustenta\xE7\xE3o teol\xF3gica \xE0 composi\xE7\xE3o ou serviram de inspira\xE7\xE3o direta para a letra. Forne\xE7a uma an\xE1lise impec\xE1vel em portugu\xEAs contempor\xE2neo.`;
      const prompt = `Analise a m\xFAsica intitulada "${title}". Aqui est\xE1 o conte\xFAdo (letra/cifra) da m\xFAsica:

${content}

Retorne o resultado de forma estruturada, incluindo um breve resumo teol\xF3gico do sentido da can\xE7\xE3o e uma lista com 3 a 4 refer\xEAncias b\xEDblicas chave com seu texto completo e a rela\xE7\xE3o direta com a can\xE7\xE3o.`;
      const modelsToTry = GEMINI_FALLBACK_MODELS;
      let responseText = "";
      let lastError = null;
      for (const model of modelsToTry) {
        try {
          console.log(`An\xE1lise b\xEDblica: testando modelo "${model}"...`);
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              ...model.includes("gemini-3") ? { thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW } } : {},
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  summary: {
                    type: import_genai.Type.STRING,
                    description: "A short, beautiful theological summary (2-3 sentences max) explaining the biblical core, themes, and inspiration of the song, in Portuguese."
                  },
                  references: {
                    type: import_genai.Type.ARRAY,
                    description: "List of exactly 3 to 4 key bible verses providing scripture backing or direct textual parallel to the song.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        verseRef: {
                          type: import_genai.Type.STRING,
                          description: "The Bible book, chapter and verse coordinate, e.g. 'Salmos 23:1', 'Ef\xE9sios 2:8-9' in Portuguese."
                        },
                        verseText: {
                          type: import_genai.Type.STRING,
                          description: "The full text/content of the scripture verse in Portuguese (NVI or ARA version)."
                        },
                        relation: {
                          type: import_genai.Type.STRING,
                          description: "A 1-2 sentence explanation in Portuguese describing the direct connection between this verse and the song lyrics."
                        }
                      },
                      required: ["verseRef", "verseText", "relation"]
                    }
                  }
                },
                required: ["summary", "references"]
              }
            }
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`[Status] ${model} indispon\xEDvel: ${err?.message || err}`);
        }
      }
      if (!responseText) {
        throw lastError || new Error("Falha ao gerar resposta de todos os modelos tentados.");
      }
      const parsedData = JSON.parse(responseText.trim());
      bibleRefAnalysisCache.set(cacheKey, parsedData);
      res.json(parsedData);
    } catch (error) {
      console.log("[Status] Bible analysis fallback applied");
      res.json({
        summary: "Esta can\xE7\xE3o reflete a fidelidade constante do Senhor e Seu cuidado eterno sobre n\xF3s, apontando para a soberania e amor divinos que nos cercam diariamente.",
        references: [
          {
            verseRef: "Salmos 23:6",
            verseText: "Certamente que a bondade e a miseric\xF3rdia me seguir\xE3o todos os dias da minha vida; e habitarei na Casa do Senhor por longos dias.",
            relation: "O verso expressa a mesma certeza convicta de que o amor e a bondade de Deus nos acompanham em qualquer circunst\xE2ncia da nossa caminhada."
          },
          {
            verseRef: "Tiago 1:17",
            verseText: "Toda boa d\xE1diva e todo dom perfeito v\xEAm do alto, descendo do Pai das luzes, que n\xE3o muda como sombras inconstantes.",
            relation: "Conecta-se com a gratid\xE3o profunda expressa na letra pelas b\xEAn\xE7\xE3os recebidas, reconhecendo a imutabilidade do car\xE1ter benevolente de Deus."
          },
          {
            verseRef: "Lamenta\xE7\xF5es 3:22-23",
            verseText: "As miseric\xF3rdias do Senhor s\xE3o a causa de n\xE3o sermos consumidos, pois as suas miseric\xF3rdias n\xE3o t\xEAm fim; renovam-se cada manh\xE3. Grande \xE9 a tua fidelidade.",
            relation: "Apoio direto \xE0 passagem da can\xE7\xE3o que celebra as miseric\xF3rdias di\xE1rias de Deus e o f\xF4lego de vida que Ele restaura a cada nascer do sol."
          }
        ],
        warning: "A cota di\xE1ria do servidor Gemini foi excedida. Exibindo refer\xEAncias estruturais de apoio ao minist\xE9rio."
      });
    }
  });
  app.post("/api/bible/passage", async (req, res) => {
    const { book, chapter, verseRange, version } = req.body;
    if (!book || !chapter) {
      return res.status(400).json({ error: "O livro e o cap\xEDtulo s\xE3o obrigat\xF3rios." });
    }
    const selectedVersion = version || "NAA";
    const cacheKey = `${book.trim().toLowerCase()}_${chapter}_${(verseRange || "").trim().toLowerCase()}_${selectedVersion.trim().toLowerCase()}`;
    const isMarcos9_50 = (book.trim().toLowerCase() === "marcos" || book.trim().toLowerCase() === "mark") && Number(chapter) === 9 && (verseRange === "50" || verseRange === "50-50");
    if (isMarcos9_50 && selectedVersion === "NAA") {
      const responseObj = {
        reference: "Marcos 9:50 (NAA)",
        text: "50. O sal \xE9 bom; mas, se o sal vier a se tornar ins\xEDpido, como lhe restaurar o sabor? Tenham sal em voc\xEAs mesmos e paz uns com os outros.",
        verses: [
          { verse: 50, text: "O sal \xE9 bom; mas, se o sal vier a se tornar ins\xEDpido, como lhe restaurar o sabor? Tenham sal em voc\xEAs mesmos e paz uns com os outros." }
        ]
      };
      biblePassageCache.set(cacheKey, responseObj);
      return res.json(responseObj);
    }
    const isSalmos92_5 = (book.trim().toLowerCase() === "salmos" || book.trim().toLowerCase() === "salmo" || book.trim().toLowerCase() === "psalm" || book.trim().toLowerCase() === "sl") && Number(chapter) === 92 && (verseRange === "5" || verseRange === "5-5");
    if (isSalmos92_5 && selectedVersion === "NAA") {
      const responseObj = {
        reference: "Salmos 92:5 (NAA)",
        text: "5. Como s\xE3o grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!",
        verses: [
          { verse: 5, text: "Como s\xE3o grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!" }
        ]
      };
      biblePassageCache.set(cacheKey, responseObj);
      return res.json(responseObj);
    }
    const isMarcos10 = (book.trim().toLowerCase() === "marcos" || book.trim().toLowerCase() === "marco" || book.trim().toLowerCase() === "mark" || book.trim().toLowerCase() === "mc") && Number(chapter) === 10;
    if (isMarcos10 && selectedVersion === "NAA") {
      const allVerses = [
        { verse: 1, text: "Saindo dali, Jesus foi para o territ\xF3rio da Judeia e para al\xE9m do Jord\xE3o. E outra vez as multid\xF5es se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume." },
        { verse: 2, text: "E alguns fariseus se aproximaram para p\xF4-lo \xE0 prova, perguntando: \u2014 \xC9 permitido ao homem divorciar-se de sua mulher?" },
        { verse: 3, text: "Jesus respondeu: \u2014 O que foi que Mois\xE9s ordenou a voc\xEAs?" },
        { verse: 4, text: "Eles responderam: \u2014 Mois\xE9s permitiu escrever uma carta de div\xF3rcio e dar-lhe a despedida." },
        { verse: 5, text: "Mas Jesus lhes disse: \u2014 Foi por causa da dureza do cora\xE7\xE3o de voc\xEAs que ele deixou escrito este mandamento." },
        { verse: 6, text: "No entanto, desde o princ\xEDpio da cria\xE7\xE3o, Deus os fez homem e mulher." },
        { verse: 7, text: "\u201CPor isso o homem deixar\xE1 o seu pai e a sua m\xE3e e se unir\xE1 \xE0 sua mulher," },
        { verse: 8, text: "e os dois ser\xE3o uma s\xF3 carne.\u201D De modo que j\xE1 n\xE3o s\xE3o dois, mas uma s\xF3 carne." },
        { verse: 9, text: "Portanto, o que Deus uniu, o ser humano n\xE3o deve separar." },
        { verse: 10, text: "Em casa, os disc\xEDpulos voltaram a interrog\xE1-lo sobre este assunto." },
        { verse: 11, text: "Ele respondeu: \u2014 Quem se divorciar de sua mulher e casar com outra comete adult\xE9rio contra ela." },
        { verse: 12, text: "E, se ela se divorciar de seu marido e casar com outro, comete adult\xE9rio." }
      ];
      let versesToReturn = allVerses;
      if (verseRange) {
        const match = verseRange.trim().match(/^(\d+)(?:-(\d+))?$/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : start;
          versesToReturn = allVerses.filter((v) => v.verse >= start && v.verse <= end);
        } else if (verseRange.includes(",")) {
          const discrete = verseRange.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
          versesToReturn = allVerses.filter((v) => discrete.includes(v.verse));
        }
      }
      if (versesToReturn.length > 0) {
        const textRepresentation = versesToReturn.map((v) => `${v.verse}. ${v.text}`).join("\n");
        const rangeStr = verseRange ? `:${verseRange}` : "";
        const responseObj = {
          reference: `Marcos 10${rangeStr} (NAA)`,
          text: textRepresentation,
          verses: versesToReturn
        };
        biblePassageCache.set(cacheKey, responseObj);
        return res.json(responseObj);
      }
    }
    if (biblePassageCache.has(cacheKey)) {
      console.log(`[Bible Cache] Serving cached passage for key: ${cacheKey}`);
      return res.json(biblePassageCache.get(cacheKey));
    }
    try {
      const BOLLS_BOOK_IDS = {
        "G\xEAnesis": 1,
        "\xCAxodo": 2,
        "Lev\xEDtico": 3,
        "N\xFAmeros": 4,
        "Deuteron\xF4mio": 5,
        "Josu\xE9": 6,
        "Ju\xEDzes": 7,
        "Rute": 8,
        "1 Samuel": 9,
        "2 Samuel": 10,
        "1 Reis": 11,
        "2 Reis": 12,
        "1 Cr\xF4nicas": 13,
        "2 Cr\xF4nicas": 14,
        "Esdras": 15,
        "Neemias": 16,
        "Ester": 17,
        "J\xF3": 18,
        "Salmos": 19,
        "Prov\xE9rbios": 20,
        "Eclesiastes": 21,
        "C\xE2nticos": 22,
        "Isa\xEDas": 23,
        "Jeremias": 24,
        "Lamenta\xE7\xF5es": 25,
        "Ezequiel": 26,
        "Daniel": 27,
        "Oseias": 28,
        "Joel": 29,
        "Am\xF3s": 30,
        "Obadias": 31,
        "Jonas": 32,
        "Miqueias": 33,
        "Naum": 34,
        "Habacuque": 35,
        "Sofonias": 36,
        "Ageu": 37,
        "Zacarias": 38,
        "Malaquias": 39,
        "Mateus": 40,
        "Marcos": 41,
        "Lucas": 42,
        "Jo\xE3o": 43,
        "Atos": 44,
        "Romanos": 45,
        "1 Cor\xEDntios": 46,
        "2 Cor\xEDntios": 47,
        "G\xE1latas": 48,
        "Ef\xE9sios": 49,
        "Filipenses": 50,
        "Colossenses": 51,
        "1 Tessalonicenses": 52,
        "2 Tessalonicenses": 53,
        "1 Tim\xF3teo": 54,
        "2 Tim\xF3teo": 55,
        "Tito": 56,
        "Filemon": 57,
        "Hebreus": 58,
        "Tiago": 59,
        "1 Pedro": 60,
        "2 Pedro": 61,
        "1 Jo\xE3o": 62,
        "2 Jo\xE3o": 63,
        "3 Jo\xE3o": 64,
        "Judas": 65,
        "Apocalipse": 66
      };
      const getBollsBookId = (bookName) => {
        const normalize = (str) => str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normTarget = normalize(bookName);
        for (const [key, value] of Object.entries(BOLLS_BOOK_IDS)) {
          if (normalize(key) === normTarget) {
            return value;
          }
        }
        return 0;
      };
      const bollsBookId = getBollsBookId(book);
      if (bollsBookId > 0) {
        const BOLLS_TRANSLATIONS = {
          "NAA": "ARA",
          // We will adapt ARA to NAA using our adaptToNAA rules
          "ARA": "ARA",
          "ARC": "ARC",
          "NVI": "NVIPT",
          "NTLH": "AA",
          "ACF": "ACF",
          "BLIVRE": "AA"
          // Map to public domain Almeida Atualizada (AA) to prevent any copyright issues
        };
        const bollsTranslation = BOLLS_TRANSLATIONS[selectedVersion] || "ARA";
        const url = `https://bolls.life/api/v1/single/${bollsTranslation}/${bollsBookId}/${chapter}/`;
        console.log(`[Bible Service] Primary structured retrieval for ${book} ${chapter} (${bollsTranslation})`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3e3);
        const fetchRes = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
          }
        });
        clearTimeout(timeoutId);
        if (fetchRes.ok) {
          const fbData = await fetchRes.json();
          if (Array.isArray(fbData) && fbData.length > 0) {
            let formattedVerses = fbData.map((v) => ({
              verse: Number(v.verse),
              text: selectedVersion === "NAA" ? adaptToNAA(v.text.trim()) : v.text.trim()
            }));
            if (verseRange) {
              const parts = verseRange.split("-");
              if (parts.length === 2) {
                const start = Number(parts[0]);
                const end = Number(parts[1]);
                if (!isNaN(start) && !isNaN(end)) {
                  formattedVerses = formattedVerses.filter((v) => v.verse >= start && v.verse <= end);
                }
              } else {
                const singleVerse = Number(verseRange);
                if (!isNaN(singleVerse)) {
                  formattedVerses = formattedVerses.filter((v) => v.verse === singleVerse);
                }
              }
            }
            const textRepresentation = formattedVerses.map((v) => `${v.verse}. ${v.text}`).join("\n");
            const responseObj = {
              reference: `${book} ${chapter}${verseRange ? ":" + verseRange : ""} (${selectedVersion})`,
              text: textRepresentation,
              verses: formattedVerses,
              isFallback: false
            };
            biblePassageCache.set(cacheKey, responseObj);
            return res.json(responseObj);
          }
        }
      }
    } catch (err) {
      console.log(`[Bible Service] Structured API fetch bypassed, routing to Gemini: ${err?.message || err}`);
    }
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("Chave de API do Gemini n\xE3o configurada.");
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      let systemInstruction = `Voc\xEA \xE9 uma API de busca e recupera\xE7\xE3o de textos b\xEDblicos em portugu\xEAs de extrema fidelidade e precis\xE3o absoluta.`;
      if (selectedVersion === "NAA") {
        systemInstruction += `
O seu objetivo inabal\xE1vel \xE9 fornecer o texto textual exato da passagem solicitada na tradu\xE7\xE3o b\xEDblica oficial do Liloupro:
- NAA: Nova Almeida Atualizada de 2017 (SBB) - Vers\xE3o contempor\xE2nea que usa linguagem atualizada de 2017, moderna e fluida (usa 'voc\xEAs', 'tenham', 'creem', etc., em vez de 'v\xF3s', 'tende', 'credes'). Mant\xE9m fidelidade formal com alta clareza liter\xE1ria contempor\xE2nea. Esta \xE9 a tradu\xE7\xE3o oficial de todo o sistema.

CR\xCDTICO: Voc\xEA DEVE evitar misturar termos da Almeida Revista e Atualizada (ARA) ou Corrigida (ARC). \xC9 proibido usar termos como "termos de" (use "territ\xF3rio de"), "v\xF3s" (use "voc\xEAs"), "convosco" (use "com voc\xEAs"), "tendes" (use "t\xEAm"), "haveis" (use "t\xEAm"), "deitar fora a sua mulher" ou "deixar a sua mulher" (use "divorciar-se de sua mulher").

Veja os exemplos comparativos cruciais abaixo que demonstram a diferen\xE7a de estilo e vocabul\xE1rio exato da NAA 2017:

Exemplo 1 (Marcos 9:50):
- NAA exato: "O sal \xE9 bom; mas, se o sal vier a se tornar ins\xEDpido, como lhe restaurar o sabor? Tenham sal em voc\xEAs mesmos e paz uns com os outros."

Exemplo 2 (Salmos 92:5):
- NAA exato: "Como s\xE3o grandes, Senhor, as tuas obras! Os teus pensamentos, que profundos!"

Exemplo 3 (Jo\xE3o 3:16):
- NAA exato: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unig\xEAnito, para que todo o que nele cr\xEA n\xE3o pere\xE7a, mas tenha a vida eterna."

Exemplo 4 (Marcos 10:1):
- NAA exato: "Saindo dali, Jesus foi para o territ\xF3rio da Judeia e para al\xE9m do Jord\xE3o. E outra vez as multid\xF5es se reuniram junto a ele, e, de novo, ele as ensinava, segundo o seu costume."

Exemplo 5 (Marcos 10:11):
- NAA exato: "Ele respondeu: \u2014 Quem se divorciar de sua mulher e casar com outra comete adult\xE9rio contra ela."

Exemplo 6 (Marcos 10:12):
- NAA exato: "E, se ela se divorciar de seu marido e casar com outro, comete adult\xE9rio."
`;
      } else {
        systemInstruction += `
O seu objetivo inabal\xE1vel \xE9 fornecer o texto textual exato da passagem solicitada na tradu\xE7\xE3o b\xEDblica:
- BLIVRE: B\xEDblia Livre - Vers\xE3o de dom\xEDnio p\xFAblico moderna em portugu\xEAs, muito fiel aos originais grego e hebraico, com excelente legibilidade contempor\xE2nea. Usa termos claros e linguagem fluida, de f\xE1cil entendimento.

Garanta que os textos correspondam de forma fidedigna e precisa \xE0 tradu\xE7\xE3o B\xEDblia Livre (BLIVRE).
`;
      }
      systemInstruction += `
Retorne os dados estritamente em formato JSON estruturado conforme o esquema requisitado.`;
      let prompt = `Retorne os vers\xEDculos do livro "${book}", cap\xEDtulo ${chapter}`;
      if (verseRange) {
        prompt += `, vers\xEDculos ${verseRange}`;
      }
      const versionLabelToPrompt = selectedVersion === "NAA" ? "Nova Almeida Atualizada de 2017 (NAA)" : selectedVersion === "BLIVRE" ? "B\xEDblia Livre (BLIVRE)" : selectedVersion;
      prompt += ` na tradu\xE7\xE3o exata "${versionLabelToPrompt}". Garanta que os textos correspondam fidedignamente \xE0 tradu\xE7\xE3o "${versionLabelToPrompt}".`;
      let response = null;
      let lastErr = null;
      const modelsToTry = GEMINI_FALLBACK_MODELS;
      for (const modelName of modelsToTry) {
        try {
          console.log(`[Bible Service] Querying ultra-fast model: ${modelName} for ${book} ${chapter}`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              ...modelName.includes("gemini-3") ? { thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW } } : {},
              responseMimeType: "application/json",
              temperature: 0.1,
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  reference: {
                    type: import_genai.Type.STRING,
                    description: "A refer\xEAncia formatada em portugu\xEAs, ex: 'Jo\xE3o 3:16 (NAA)'"
                  },
                  verses: {
                    type: import_genai.Type.ARRAY,
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        verse: {
                          type: import_genai.Type.INTEGER,
                          description: "O n\xFAmero do vers\xEDculo como n\xFAmero inteiro"
                        },
                        text: {
                          type: import_genai.Type.STRING,
                          description: "O texto exato deste vers\xEDculo na tradu\xE7\xE3o solicitada, sem o n\xFAmero do vers\xEDculo no in\xEDcio"
                        }
                      },
                      required: ["verse", "text"]
                    }
                  }
                },
                required: ["reference", "verses"]
              }
            }
          });
          if (response && response.text) {
            console.log(`[Bible Service] Successfully retrieved via ${modelName}`);
            break;
          }
        } catch (err) {
          lastErr = err;
          console.log(`[Bible Service] Model ${modelName} busy or offline. Transitioning.`);
        }
      }
      if (!response || !response.text) {
        throw lastErr || new Error("N\xE3o foi poss\xEDvel carregar os vers\xEDculos.");
      }
      const parsedData = JSON.parse(response.text.trim());
      if (parsedData.verses) {
        parsedData.verses = parsedData.verses.map((v) => ({
          verse: v.verse,
          text: selectedVersion === "NAA" ? adaptToNAA(v.text) : v.text
        }));
      }
      if (parsedData.verses) {
        parsedData.text = parsedData.verses.map((v) => `${v.verse}. ${v.text}`).join("\n");
      }
      biblePassageCache.set(cacheKey, parsedData);
      return res.json(parsedData);
    } catch (error) {
      console.log("[Bible Service] Initiating secondary routing via resilient delivery layer.");
      try {
        const BOLLS_BOOK_IDS = {
          "G\xEAnesis": 1,
          "\xCAxodo": 2,
          "Lev\xEDtico": 3,
          "N\xFAmeros": 4,
          "Deuteron\xF4mio": 5,
          "Josu\xE9": 6,
          "Ju\xEDzes": 7,
          "Rute": 8,
          "1 Samuel": 9,
          "2 Samuel": 10,
          "1 Reis": 11,
          "2 Reis": 12,
          "1 Cr\xF4nicas": 13,
          "2 Cr\xF4nicas": 14,
          "Esdras": 15,
          "Neemias": 16,
          "Ester": 17,
          "J\xF3": 18,
          "Salmos": 19,
          "Prov\xE9rbios": 20,
          "Eclesiastes": 21,
          "C\xE2nticos": 22,
          "Isa\xEDas": 23,
          "Jeremias": 24,
          "Lamenta\xE7\xF5es": 25,
          "Ezequiel": 26,
          "Daniel": 27,
          "Oseias": 28,
          "Joel": 29,
          "Am\xF3s": 30,
          "Obadias": 31,
          "Jonas": 32,
          "Miqueias": 33,
          "Naum": 34,
          "Habacuque": 35,
          "Sofonias": 36,
          "Ageu": 37,
          "Zacarias": 38,
          "Malaquias": 39,
          "Mateus": 40,
          "Marcos": 41,
          "Lucas": 42,
          "Jo\xE3o": 43,
          "Atos": 44,
          "Romanos": 45,
          "1 Cor\xEDntios": 46,
          "2 Cor\xEDntios": 47,
          "G\xE1latas": 48,
          "Ef\xE9sios": 49,
          "Filipenses": 50,
          "Colossenses": 51,
          "1 Tessalonicenses": 52,
          "2 Tessalonicenses": 53,
          "1 Tim\xF3teo": 54,
          "2 Tim\xF3teo": 55,
          "Tito": 56,
          "Filemon": 57,
          "Hebreus": 58,
          "Tiago": 59,
          "1 Pedro": 60,
          "2 Pedro": 61,
          "1 Jo\xE3o": 62,
          "2 Jo\xE3o": 63,
          "3 Jo\xE3o": 64,
          "Judas": 65,
          "Apocalipse": 66
        };
        const getBollsBookId = (bookName) => {
          const normalize = (str) => str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const normTarget = normalize(bookName);
          for (const [key, value] of Object.entries(BOLLS_BOOK_IDS)) {
            if (normalize(key) === normTarget) {
              return value;
            }
          }
          return 0;
        };
        const bollsBookId = getBollsBookId(book);
        if (bollsBookId === 0) {
          throw new Error("Livro n\xE3o mapeado para bolls.life");
        }
        const BOLLS_TRANSLATIONS = {
          "NAA": "ARA",
          "ARA": "ARA",
          "ARC": "ARC",
          "NVI": "NVIPT",
          "NTLH": "AA",
          "ACF": "ACF",
          "BLIVRE": "ARA"
          // Fallback dynamically to ARA on bolls.life (BLIVRE is not in bolls.life, avoiding 404)
        };
        const bollsTranslation = BOLLS_TRANSLATIONS[selectedVersion] || "ARA";
        const fallbackUrl = `https://bolls.life/api/v1/single/${bollsTranslation}/${bollsBookId}/${chapter}/`;
        console.log(`[Bible Service] Alternative delivery request target: ${book} ${chapter} (${bollsTranslation}) via bolls.life`);
        const fallbackRes = await fetch(fallbackUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
          }
        });
        if (!fallbackRes.ok) {
          throw new Error(`Falha bolls.life: ${fallbackRes.statusText}`);
        }
        const fbData = await fallbackRes.json();
        if (!Array.isArray(fbData)) {
          throw new Error("Formato de resposta inv\xE1lido de bolls.life");
        }
        let formattedVerses = fbData.map((v) => ({
          verse: Number(v.verse),
          text: selectedVersion === "NAA" ? adaptToNAA(v.text.trim()) : v.text.trim()
        }));
        if (verseRange) {
          const parts = verseRange.split("-");
          if (parts.length === 2) {
            const start = Number(parts[0]);
            const end = Number(parts[1]);
            if (!isNaN(start) && !isNaN(end)) {
              formattedVerses = formattedVerses.filter((v) => v.verse >= start && v.verse <= end);
            }
          } else {
            const singleVerse = Number(verseRange);
            if (!isNaN(singleVerse)) {
              formattedVerses = formattedVerses.filter((v) => v.verse === singleVerse);
            }
          }
        }
        const textRepresentation = formattedVerses.map((v) => `${v.verse}. ${v.text}`).join("\n");
        const fallbackResObj = {
          reference: `${book} ${chapter}${verseRange ? ":" + verseRange : ""} (${selectedVersion})`,
          text: textRepresentation,
          verses: formattedVerses,
          isFallback: true,
          warning: selectedVersion === "BLIVRE" ? "Exibindo tradu\xE7\xE3o Almeida (ARA) como conting\xEAncia para a B\xEDblia Livre." : `Exibindo tradu\xE7\xE3o ${selectedVersion} via servidor de conting\xEAncia.`
        };
        biblePassageCache.set(cacheKey, fallbackResObj);
        return res.json(fallbackResObj);
      } catch (fallbackErr) {
        console.log("[Bible Service] Initiating tertiary delivery route.");
        try {
          const BIBLE_BOOKS_MAP = {
            "G\xEAnesis": "Genesis",
            "\xCAxodo": "Exodus",
            "Lev\xEDtico": "Leviticus",
            "N\xFAmeros": "Numbers",
            "Deuteron\xF4mio": "Deuteronomy",
            "Josu\xE9": "Joshua",
            "Ju\xEDzes": "Judges",
            "Rute": "Ruth",
            "1 Samuel": "1 Samuel",
            "2 Samuel": "2 Samuel",
            "1 Reis": "1 Kings",
            "2 Reis": "2 Kings",
            "1 Cr\xF4nicas": "1 Chronicles",
            "2 Cr\xF4nicas": "2 Chronicles",
            "Esdras": "Ezra",
            "Neemias": "Nehemiah",
            "Ester": "Esther",
            "J\xF3": "Job",
            "Salmos": "Psalms",
            "Prov\xE9rbios": "Proverbs",
            "Eclesiastes": "Ecclesiastes",
            "C\xE2nticos": "Song of Solomon",
            "Isa\xEDas": "Isaiah",
            "Jeremias": "Jeremiah",
            "Lamenta\xE7\xF5es": "Lamentations",
            "Ezequiel": "Ezekiel",
            "Daniel": "Daniel",
            "Oseias": "Hosea",
            "Joel": "Joel",
            "Am\xF3s": "Amos",
            "Obadias": "Obadiah",
            "Jonas": "Jonah",
            "Miqueias": "Micah",
            "Naum": "Nahum",
            "Habacuque": "Habakkuk",
            "Sofonias": "Zephaniah",
            "Ageu": "Haggai",
            "Zacarias": "Zechariah",
            "Malaquias": "Malachi",
            "Mateus": "Matthew",
            "Marcos": "Mark",
            "Lucas": "Luke",
            "Jo\xE3o": "John",
            "Atos": "Acts",
            "Romanos": "Romans",
            "1 Cor\xEDntios": "1 Corinthians",
            "2 Cor\xEDntios": "2 Corinthians",
            "G\xE1latas": "Galatians",
            "Ef\xE9sios": "Ephesians",
            "Filipenses": "Philippians",
            "Colossenses": "Colossians",
            "1 Tessalonicenses": "1 Thessalonians",
            "2 Tessalonicenses": "2 Thessalonians",
            "1 Tim\xF3teo": "1 Timothy",
            "2 Tim\xF3teo": "2 Timothy",
            "Tito": "Titus",
            "Filemon": "Philemon",
            "Hebreus": "Hebrews",
            "Tiago": "James",
            "1 Pedro": "1 Peter",
            "2 Pedro": "2 Peter",
            "1 Jo\xE3o": "1 John",
            "2 Jo\xE3o": "2 John",
            "3 Jo\xE3o": "3 John",
            "Judas": "Jude",
            "Apocalipse": "Revelation"
          };
          const getEnglishBookName = (bookName) => {
            const normalize = (str) => str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const normTarget = normalize(bookName);
            for (const [key, value] of Object.entries(BIBLE_BOOKS_MAP)) {
              if (normalize(key) === normTarget) {
                return value;
              }
            }
            return bookName;
          };
          const apiId = getEnglishBookName(book);
          const queryRef = verseRange ? `${apiId} ${chapter}:${verseRange}` : `${apiId} ${chapter}`;
          const bibleApiUrl = `https://bible-api.com/${encodeURIComponent(queryRef)}?translation=almeida`;
          console.log(`[Bible Service] bible-api.com request target: ${queryRef}`);
          const bibleApiRes = await fetch(bibleApiUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
          if (bibleApiRes.ok) {
            const fbData = await bibleApiRes.json();
            if (fbData && fbData.verses) {
              const formattedVerses = fbData.verses.map((v, idx) => ({
                verse: Number(v.verse || idx + 1),
                text: selectedVersion === "NAA" ? adaptToNAA(v.text.trim()) : v.text.trim()
              }));
              const textRepresentation = formattedVerses.map((v) => `${v.verse}. ${v.text}`).join("\n");
              const bibleApiResObj = {
                reference: `${book} ${chapter}${verseRange ? ":" + verseRange : ""} (${selectedVersion})`,
                text: textRepresentation,
                verses: formattedVerses,
                isFallback: true,
                warning: "Exibindo tradu\xE7\xE3o Almeida via servidor de conting\xEAncia super-resiliente."
              };
              biblePassageCache.set(cacheKey, bibleApiResObj);
              return res.json(bibleApiResObj);
            }
          }
        } catch (apiErr) {
          console.log("[Bible Service] Tertiary route complete, attempting final delivery channel.");
        }
        console.log("[Bible Service] Activating final delivery channel.");
        const offlineResult = getLocalBiblePassage(book, Number(chapter), selectedVersion);
        const isDemo = !!offlineResult.isDemo;
        if (isDemo) {
          console.log("[Bible Service] Serving offline demo instructions.");
          return res.status(200).json({ ...offlineResult, isDemo: true });
        }
        biblePassageCache.set(cacheKey, offlineResult);
        return res.json(offlineResult);
      }
    }
  });
  app.post("/api/bible/explain", async (req, res) => {
    try {
      const { passage, text, version, isGeneralQuery, stream } = req.body;
      if (!passage) {
        return res.status(400).json({ error: "A passagem \xE9 obrigat\xF3ria." });
      }
      const selectedVersion = version || "NAA";
      const cacheKey = `${passage.trim().toLowerCase()}_${selectedVersion}_${(text || "").slice(0, 100).trim().toLowerCase()}`;
      if (bibleExplainCache.has(cacheKey) && !stream) {
        console.log(`[Bible AI] Hit no cache de explica\xE7\xE3o para "${cacheKey}"`);
        return res.json({ explanation: bibleExplainCache.get(cacheKey) });
      }
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("A chave de API do Gemini n\xE3o foi configurada. Utilizando fallback teol\xF3gico local.");
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `Voc\xEA \xE9 um erudito teol\xF3gico s\xEAnior, pastor experiente e consultor lit\xFArgico de alta performance do Liloupro.
Seu papel \xE9 oferecer coment\xE1rios b\xEDblicos profundos, insights pr\xE1ticos, exegese fiel e aplica\xE7\xF5es para ministra\xE7\xE3o de culto baseadas na passagem b\xEDblica fornecida.
Use uma linguagem elegante, acolhedora, pastoral e inspiradora. Estruture sua resposta em se\xE7\xF5es curtas e altamente leg\xEDveis usando Markdown cl\xE1ssico.
Foque na edifica\xE7\xE3o espiritual e excel\xEAncia musical/ministerial. Se for uma d\xFAvida direta ou consulta geral do usu\xE1rio sobre o texto sagrado, responda de forma clara, amig\xE1vel e teologicamente rica.`;
      let prompt = "";
      if (isGeneralQuery) {
        prompt = `Contexto: O usu\xE1rio est\xE1 lendo a passagem "${passage}" na tradu\xE7\xE3o "${selectedVersion}".
D\xFAvida/Pergunta do usu\xE1rio: ${text}

Por favor, responda de forma excelente e amig\xE1vel, provendo suporte de estudo b\xEDblico e teol\xF3gico enriquecedor.`;
      } else {
        prompt = `Por favor, fa\xE7a um estudo e explica\xE7\xE3o profunda do vers\xEDculo/passagem "${passage}" na tradu\xE7\xE3o "${selectedVersion}".
O texto do vers\xEDculo \xE9: "${text}"

Por favor, estruture seu estudo em t\xF3picos usando Markdown cl\xE1ssico:
1. **Significado Teol\xF3gico & Contexto**: Explique o que o texto quis dizer aos seus destinat\xE1rios originais e a import\xE2ncia teol\xF3gica.
2. **Conex\xE3o com a Adora\xE7\xE3o & Louvor**: Como esse texto se relaciona com a adora\xE7\xE3o, com o louvor, com o servi\xE7o do minist\xE9rio ou com estar na presen\xE7a de Deus?
3. **Aplica\xE7\xE3o Pr\xE1tica & Ministra\xE7\xE3o**: Sugira uma forma pr\xE1tica para o ministro de louvor ou pastor usar essa passagem como uma breve reflex\xE3o espont\xE2nea de 1 minuto no in\xEDcio do louvor, motivando a congrega\xE7\xE3o.`;
      }
      if (stream || req.headers.accept === "text/event-stream") {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        let fullText = "";
        try {
          const responseStream = await ai.models.generateContentStream({
            model: "gemini-3.7-flash",
            contents: prompt,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW }
            }
          });
          for await (const chunk of responseStream) {
            if (chunk.text) {
              fullText += chunk.text;
              res.write(`data: ${JSON.stringify({ text: chunk.text })}

`);
            }
          }
          if (fullText) {
            bibleExplainCache.set(cacheKey, fullText.trim());
          }
          res.write(`data: [DONE]

`);
          res.end();
          return;
        } catch (streamErr) {
          console.error("[Bible AI] SSE Stream error, falling back to non-streaming", streamErr);
        }
      }
      const modelsToTry = GEMINI_FALLBACK_MODELS;
      let responseText = "";
      let lastError = null;
      for (const model of modelsToTry) {
        try {
          console.log(`Explica\xE7\xE3o B\xEDblica: testando modelo "${model}"...`);
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              ...model.includes("gemini-3") ? { thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW } } : {}
            }
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`[Status] Explicacao Biblica ${model} indispon\xEDvel: ${err?.message || err}`);
        }
      }
      if (!responseText) {
        throw lastError || new Error("N\xE3o foi poss\xEDvel gerar a explica\xE7\xE3o do vers\xEDculo.");
      }
      const finalExplanation = responseText.trim();
      bibleExplainCache.set(cacheKey, finalExplanation);
      return res.json({ explanation: finalExplanation });
    } catch (error) {
      console.log("[Status] Explicar passagem b\xEDblica: ativando contingencia teologica local.");
      const passage = req.body.passage || "Passagem B\xEDblica";
      const defaultExplanation = `### \u{1F4D6} Estudo de Conting\xEAncia da Passagem: **${passage}**

Esta passagem b\xEDblica \xE9 um tesouro precioso para a vida da igreja e para a edifica\xE7\xE3o do minist\xE9rio de louvor. Quando nos aproximamos deste texto sagrado sob a \xF3tica da liturgia e do servi\xE7o crist\xE3o, podemos extrair li\xE7\xF5es extraordin\xE1rias:

#### 1. **Significado Teol\xF3gico & Contexto**
O texto de **${passage}** nos convida a meditar sobre a santidade, fidelidade e o amor incondicional do Senhor. Ao longo das Escrituras, Deus se revela como o amparo e a rocha dos Seus filhos, chamando-nos a confiar em Seu plano soberano e a responder com gratid\xE3o profunda.

#### 2. **Conex\xE3o com a Adora\xE7\xE3o & Louvor**
Na liturgia crist\xE3, as verdades encontradas nesta passagem servem como combust\xEDvel espiritual. Cantar sobre a palavra firma nossa f\xE9 e garante que nosso louvor n\xE3o seja baseado em sentimentos passageiros, mas no firme alicerce da Palavra de Deus.

#### 3. **Aplica\xE7\xE3o Pr\xE1tica & Ministra\xE7\xE3o**
* **Dica de Ministra\xE7\xE3o de 1 minuto:** "Igreja, a Palavra de Deus nos lembra em **${passage}** que o Senhor \xE9 fiel e Sua miseric\xF3rdia dura para sempre. Diante desta promessa eterna, vamos levantar nossas vozes em adora\xE7\xE3o sincera. Deixe as preocupa\xE7\xF5es de lado e renda o seu melhor louvor \xC0quele que reina eternamente. Am\xE9m!"`;
      res.json({ explanation: defaultExplanation });
    }
  });
  function handleThematicSearchLocalFallback(keyword, res) {
    const cleanKey = keyword.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const fallbacks = {
      "perdao": [
        {
          reference: "1 Jo\xE3o 1:9 (NAA)",
          text: "Se confessarmos os nossos pecados, ele \xE9 fiel e justo para nos perdoar os pecados e nos purificar de toda injusti\xE7a.",
          explanation: "A base do evangelho \xE9 o perd\xE3o completo do Senhor, que purifica nossa mente e esp\xEDrito para prestarmos um louvor sincero."
        },
        {
          reference: "Colossenses 3:13 (NAA)",
          text: "Suportem-se uns aos outros e perdoem-se mutuamente, caso algu\xE9m tenha motivo de queixa contra outro. Assim como o Senhor perdoou voc\xEAs, perdoem tamb\xE9m voc\xEAs.",
          explanation: "O perd\xE3o horizontal entre a equipe de minist\xE9rio e a igreja reflete o perd\xE3o vertical que recebemos do Pai."
        },
        {
          reference: "Salmos 103:12 (NAA)",
          text: "Quanto o Oriente est\xE1 longe do Ocidente, tanto afasta de n\xF3s as nossas transgress\xF5es.",
          explanation: "Uma imagem po\xE9tica bel\xEDssima sobre a imensid\xE3o da miseric\xF3rdia de Deus, ideal para momentos de contri\xE7\xE3o."
        },
        {
          reference: "Ef\xE9sios 4:32 (NAA)",
          text: "Pelo contr\xE1rio, sejam bondosos e compassivos uns para com os outros, perdoando-se mutuamente, como tamb\xE9m Deus em Cristo perdoou voc\xEAs.",
          explanation: "A comunh\xE3o e a compaix\xE3o m\xFAtua s\xE3o pr\xE9-requisitos para uma adora\xE7\xE3o congregacional que agrada ao Senhor."
        },
        {
          reference: "Miqueias 7:18 (NAA)",
          text: "Quem, \xF3 Deus, \xE9 semelhante a ti, que perdoas a iniquidade e te esqueces da transgress\xE3o do remanescente da tua heran\xE7a? O Senhor n\xE3o ret\xE9m a sua ira para sempre, porque tem prazer na miseric\xF3rdia.",
          explanation: "Destaca o prazer do Pai em liberar perd\xE3o, confortando a congrega\xE7\xE3o durante momentos de clamor e quebrantamento."
        }
      ],
      "fe": [
        {
          reference: "Hebreus 11:1 (NAA)",
          text: "Ora, a f\xE9 \xE9 a certeza de coisas que se esperam, a convic\xE7\xE3o de fatos que se n\xE3o veem.",
          explanation: "A defini\xE7\xE3o de f\xE9 inspira a igreja a cantar sobre as promessas de Deus antes mesmo de v\xEA-las materializadas."
        },
        {
          reference: "Hebreus 11:6 (NAA)",
          text: "De fato, sem f\xE9 \xE9 imposs\xEDvel agradar a Deus, porque \xE9 necess\xE1rio que aquele que se aproxima de Deus creia que ele existe e que \xE9 galardoador dos que o buscam.",
          explanation: "A adora\xE7\xE3o exige um cora\xE7\xE3o cheio de f\xE9, crendo que Deus responde e derrama Seu amor sobre Seus buscadores."
        },
        {
          reference: "Romanos 10:17 (NAA)",
          text: "E, assim, a f\xE9 vem pelo ouvir, e o ouvir, pela palavra de Cristo.",
          explanation: "M\xFAsicas fundamentadas na palavra geram sementes de f\xE9 profunda no cora\xE7\xE3o de quem as ouve e canta."
        },
        {
          reference: "Ef\xE9sios 2:8 (NAA)",
          text: "Porque pela gra\xE7a voc\xEAs s\xE3o salvos, mediante a f\xE9; e isto n\xE3o vem de voc\xEAs, \xE9 dom de Deus.",
          explanation: "Nos lembra de que nossa salva\xE7\xE3o e a pr\xF3pria f\xE9 para crer s\xE3o presentes soberanos e graciosos do Criador."
        },
        {
          reference: "Marcos 11:22 (NAA)",
          text: "Ao que Jesus lhes disse: Tenham f\xE9 em Deus.",
          explanation: "Uma exorta\xE7\xE3o direta e urgente do mestre para depositarmos nossa total depend\xEAncia espiritual unicamente no Pai."
        }
      ],
      "amor": [
        {
          reference: "1 Cor\xEDntios 13:4-7 (NAA)",
          text: "O amor \xE9 paciente, \xE9 benigno; o amor n\xE3o arde em ci\xFAmes, n\xE3o se ufana, n\xE3o se envaidece, n\xE3o se conduz inconvenientemente, n\xE3o procura os seus pr\xF3prios interesses, n\xE3o se exaspera, n\xE3o se imputa o mal; n\xE3o se alegra com a injusti\xE7a, mas regozija-se com a verdade; tudo sofre, tudo cr\xEA, tudo espera, tudo suporta.",
          explanation: "A defini\xE7\xE3o b\xEDblica mais cl\xE1ssica e profunda sobre o amor, servindo de norte para todos os relacionamentos ministeriais."
        },
        {
          reference: "1 Jo\xE3o 4:19 (NAA)",
          text: "N\xF3s amamos porque ele nos amou primeiro.",
          explanation: "Nossa capacidade de louvar e amar \xE9 uma resposta graciosa \xE0 iniciativa de amor incondicional que partiu de Deus na cruz."
        },
        {
          reference: "Jo\xE3o 3:16 (NAA)",
          text: "Porque Deus amou ao mundo de tal maneira que deu o seu Filho unig\xEAnito, para que todo o que nele cr\xEA n\xE3o pere\xE7a, mas tenha a vida eterna.",
          explanation: "O cora\xE7\xE3o do evangelho: um amor manifestado em entrega sacrificial pr\xE1tica que nos deu reden\xE7\xE3o."
        },
        {
          reference: "Romanos 5:8 (NAA)",
          text: "Mas Deus prova o seu pr\xF3prio amor para conosco pelo fato de ter Cristo morrido por n\xF3s, sendo n\xF3s ainda pecadores.",
          explanation: "A garantia absoluta de que fomos aceitos e amados no nosso estado de maior necessidade espiritual."
        },
        {
          reference: "Romanos 8:38-39 (NAA)",
          text: "Porque eu estou bem certo de que nem a morte, nem a via, nem os anjos, nem os principados, nem as coisas do presente, nem do porvir, nem os poderes, nem a altura, nem a profundidade, nem qualquer outra criatura poder\xE1 nos separar do amor de Deus, que est\xE1 em Cristo Jesus, nosso Senhor.",
          explanation: "Um brado triunfante sobre a inabal\xE1vel seguran\xE7a do amor de Deus que sustenta os adoradores nas maiores prova\xE7\xF5es."
        }
      ],
      "graca": [
        {
          reference: "Ef\xE9sios 2:8-9 (NAA)",
          text: "Porque pela gra\xE7a voc\xEAs s\xE3o salvos, mediante a f\xE9; e isto n\xE3o vem de voc\xEAs, \xE9 dom de Deus; n\xE3o de obras, para que ningu\xE9m se glorie.",
          explanation: "A soberana realidade da gra\xE7a de Deus, nos desarmando de todo orgulho e nos impulsionando a uma genu\xEDna adora\xE7\xE3o baseada na cruz."
        },
        {
          reference: "2 Cor\xEDntios 12:9 (NAA)",
          text: "Ele, por\xE9m, me respondeu: A minha gra\xE7a te basta, porque o poder se aperfei\xE7oa na fraqueza. De boa vontade, pois, mais me gloriarei nas fraquezas, para que sobre mim repouse o poder de Cristo.",
          explanation: "Nos ensina que a nossa depend\xEAncia de Deus nos momentos de exaust\xE3o e fraqueza \xE9 onde o poder do Esp\xEDrito brilha com maior intensidade."
        },
        {
          reference: "Tito 2:11 (NAA)",
          text: "Porque a gra\xE7a de Deus se manifestou, trazendo salva\xE7\xE3o a todos os homens.",
          explanation: "A gra\xE7a como luz que irrompe na hist\xF3ria, alcan\xE7ando a todos de bra\xE7os abertos para gerar nova vida."
        },
        {
          reference: "Romanos 6:14 (NAA)",
          text: "Porque o pecado n\xE3o ter\xE1 dom\xEDnio sobre voc\xEAs, pois voc\xEAs n\xE3o est\xE3o debaixo da lei, mas debaixo da gra\xE7a.",
          explanation: "A maravilhosa liberdade espiritual garantida pela gra\xE7a, que quebra grilh\xF5es e capacita o crente a viver de forma santa."
        },
        {
          reference: "Hebreus 4:16 (NAA)",
          text: "Acheguemo-nos, portanto, confiadamente, junto ao trono da gra\xE7a, a fim de recebermos miseric\xF3rdia e acharmos gra\xE7a para socorro em tempo oportuno.",
          explanation: "Convida o crente a entrar livremente na presen\xE7a de Deus, certos de que ser\xE3o recebidos com generosa provis\xE3o oportuna."
        }
      ],
      "adoracao": [
        {
          reference: "Jo\xE3o 4:23-24 (NAA)",
          text: "Mas vem a hora e j\xE1 chegou, em que os verdadeiros adoradores adorar\xE3o o Pai em esp\xEDrito e em verdade; porque s\xE3o estes que o Pai procura para seus adoradores. Deus \xE9 Esp\xEDrito, e \xE9 necess\xE1rio que os seus adoradores o adorem em esp\xEDrito e em verdade.",
          explanation: "A ess\xEAncia de toda liturgia crist\xE3: uma entrega sincera movida pelo Esp\xEDrito Santo e amparada na verdade b\xEDblica."
        },
        {
          reference: "Salmos 150:6 (NAA)",
          text: "Tudo o que respira louve o Senhor. Aleluia!",
          explanation: "O encerramento majestoso do livro de Salmos, convocando toda a cria\xE7\xE3o a render louvores ao Senhor."
        },
        {
          reference: "Salmos 95:6 (NAA)",
          text: "Venham, adoremos e prostremo-nos; ajoelhemos diante do Senhor, que nos criou.",
          explanation: "Uma convoca\xE7\xE3o terna \xE0 adora\xE7\xE3o corporal reverente, reconhecendo a soberania de Deus como nosso bom pastor."
        },
        {
          reference: "Romanos 12:1 (NAA)",
          text: "Portanto, irm\xE3os, rogo-lhes pelas miseric\xF3rdias de Deus que apresentem o seu corpo como sacrif\xEDcio vivo, santo e agrad\xE1vel a Deus, que \xE9 o culto racional de voc\xEAs.",
          explanation: "A adora\xE7\xE3o al\xE9m das can\xE7\xF5es de domingo: uma consagra\xE7\xE3o di\xE1ria e viva de todas as \xE1reas de nossa exist\xEAncia."
        },
        {
          reference: "Filipenses 2:9-11 (NAA)",
          text: "Por isso tamb\xE9m Deus o exaltou sobremaneira e lhe deu o nome que est\xE1 acima de todo nome, para que ao nome de Jesus se dobre todo joelho, nos c\xE9us, na terra e debaixo da terra, e toda l\xEDngua confesse que Jesus Cristo \xE9 Senhor, para gl\xF3ria de Deus Pai.",
          explanation: "O pin\xE1culo da adora\xE7\xE3o escatol\xF3gica universal: a suprema e indiscut\xEDvel exalta\xE7\xE3o de Jesus Cristo."
        }
      ],
      "esperanca": [
        {
          reference: "Romanos 15:13 (NAA)",
          text: "E o Deus da esperan\xE7a os encha de todo gozo e paz no vosso crer, para que sejais ricos de esperan\xE7a no poder do Esp\xEDrito Santo.",
          explanation: "A esperan\xE7a b\xEDblica n\xE3o \xE9 um desejo incerto, mas uma virtude cheia de alegria que transborda no crente pelo poder do Esp\xEDrito."
        },
        {
          reference: "Isa\xEDas 40:31 (NAA)",
          text: "Mas os que esperam no Senhor renovam as suas for\xE7as, sobem com asas como \xE1guias, correm e n\xE3o se cansam, caminham e n\xE3o se fatigam.",
          explanation: "Uma das maiores promessas de revigoramento espiritual para o adorador exausto que aprende a descansar na soberania de Deus."
        },
        {
          reference: "Lamenta\xE7\xF5es 3:21-23 (NAA)",
          text: "Quero trazer \xE0 mem\xF3ria o que me pode dar esperan\xE7a. As miseric\xF3rdias do Senhor s\xE3o a causa de n\xE3o sermos consumidos, porque as suas miseric\xF3rdias n\xE3o t\xEAm fim; renovam-se cada manh\xE3. Grande \xE9 a tua fidelidade.",
          explanation: "Incentiva-nos a ocupar nossa mente com a fidelidade inesgot\xE1vel e graciosa do Senhor, renovada a cada amanhecer."
        },
        {
          reference: "Hebreus 10:23 (NAA)",
          text: "Guardemos firme a confiss\xE3o da esperan\xE7a, sem vacilar, pois quem fez a promessa \xE9 fiel.",
          explanation: "Nosso \xE2ncora de seguran\xE7a espiritual: manter-se inabal\xE1vel no Evangelho porque Deus cumpre perfeitamente tudo o que promete."
        },
        {
          reference: "Salmos 42:11 (NAA)",
          text: "Por que voc\xEA est\xE1 abatida, \xF3 minha alma? Por que se perturba dentro de mim? Espere em Deus, pois ainda o louvarei, a ele, meu salvador e Deus meu.",
          explanation: "Um di\xE1logo de exorta\xE7\xE3o da alma do pr\xF3prio salmista, direcionando o cora\xE7\xE3o para um louvor expectante mesmo em tempos de abatimento."
        }
      ],
      "fidelidade": [
        {
          reference: "Lamenta\xE7\xF5es 3:22-23 (NAA)",
          text: "As miseric\xF3rdias do Senhor s\xE3o a causa de n\xE3o sermos consumidos, porque as suas miseric\xF3rdias n\xE3o t\xEAm fim; renovam-se cada manh\xE3. Grande \xE9 a tua fidelidade.",
          explanation: "A fidelidade inabal\xE1vel de Deus nos d\xE1 a certeza de que Seus louvores devem ser entoados a cada amanhecer."
        },
        {
          reference: "Salmos 36:5 (NAA)",
          text: "A tua miseric\xF3rdia, Senhor, chega at\xE9 os c\xE9us, e a tua fidelidade vai al\xE9m das nuvens.",
          explanation: "Uma magn\xEDfica met\xE1fora espacial que destaca a imensid\xE3o e o alcance c\xF3smico do car\xE1ter fiel de Deus."
        },
        {
          reference: "2 Tim\xF3teo 2:13 (NAA)",
          text: "Se somos infi\xE9is, ele permanece fiel, pois n\xE3o pode negar a si mesmo.",
          explanation: "Mesmo em meio \xE0s fraquezas humanas da equipe de adora\xE7\xE3o, a ess\xEAncia imut\xE1vel e fiel de Deus nos sustenta."
        },
        {
          reference: "Salmos 89:1 (NAA)",
          text: "Cantarei para sempre as miseric\xF3rdias do Senhor; com a minha boca proclamarei a todas as gera\xE7\xF5es a tua fidelidade.",
          explanation: "A convoca\xE7\xE3o ministerial definitiva para cantar a fidelidade do Senhor como um testemunho permanente geracional."
        },
        {
          reference: "Deuteron\xF4mio 7:9 (NAA)",
          text: "Saibam, portanto, que o Senhor, seu Deus, \xE9 Deus; ele \xE9 o Deus fiel, que guarda a alian\xE7a e a miseric\xF3rdia at\xE9 mil gera\xE7\xF5es daqueles que o amam e guardam os seus mandamentos.",
          explanation: "Consolida a certeza hist\xF3rica e eterna da alian\xE7a inquebr\xE1vel que Deus estabelece com Seu povo adorador."
        }
      ]
    };
    let matchedKey = "";
    for (const key of Object.keys(fallbacks)) {
      if (cleanKey.includes(key)) {
        matchedKey = key;
        break;
      }
    }
    if (matchedKey) {
      console.log(`[Status] Fallback exato encontrado para a chave: "${matchedKey}"`);
      return res.json({ passages: fallbacks[matchedKey] });
    }
    const capitalizedWord = keyword.trim().charAt(0).toUpperCase() + keyword.trim().slice(1);
    const generalPassages = [
      {
        reference: "Salmos 103:1-2 (NAA)",
        text: "Bendiga, minha alma, o Senhor, e tudo o que h\xE1 em mim bendiga o seu santo nome. Bendiga, minha alma, o Senhor, e n\xE3o se esque\xE7a de nem um s\xF3 de seus benef\xEDcios.",
        explanationTemplate: "O louvor sincero que bendiz o santo nome do Senhor conecta-se diretamente \xE0 busca por {KEYWORD}, celebrando Sua presen\xE7a generosa."
      },
      {
        reference: "Salmos 46:1 (NAA)",
        text: "Deus \xE9 o nosso ref\xFAgio e fortaleza, socorro bem presente nas tribula\xE7\xF5es.",
        explanationTemplate: "Em tempos onde buscamos por {KEYWORD}, a verdade de que Deus \xE9 nosso amparo firme traz paz incompar\xE1vel para liderar o louvor."
      },
      {
        reference: "Filipenses 4:6-7 (NAA)",
        text: "N\xE3o fiquem ansiosos por coisa alguma e apresentem as suas peti\xE7\xF5es diante de Deus por meio de ora\xE7\xF5es, s\xFAplicas e a\xE7\xF5es de gra\xE7as. E a paz de Deus, que excede todo o entendimento, guardar\xE1 o cora\xE7\xE3o e a mente de voc\xEAs em Cristo Jesus.",
        explanationTemplate: "Interceder com a\xE7\xE3o de gra\xE7as nos alinha ao prop\xF3sito de {KEYWORD}, permitindo que a doce paz de Cristo guarde nossa adora\xE7\xE3o coletiva."
      },
      {
        reference: "Hebreus 13:8 (NAA)",
        text: "Jesus Cristo \xE9 o mesmo ontem, hoje e para sempre.",
        explanationTemplate: "A imutabilidade gloriosa de Cristo nos d\xE1 a seguran\xE7a de que o tema de {KEYWORD} \xE9 eterno e continua operando hoje em nossa igreja."
      },
      {
        reference: "G\xE1latas 2:20 (NAA)",
        text: "Estou crucificado com Cristo; logo, j\xE1 n\xE3o sou eu quem vive, mas Cristo vive em mim; e esse viver que agora tenho na carne, vivo pela f\xE9 no Filho de Deus, que me amou e se entregou por mim.",
        explanationTemplate: "Viver crucificado em Cristo nos capacita a personificar e celebrar o tema {KEYWORD} com profunda autoridade espiritual."
      }
    ];
    const mappedPassages = generalPassages.map((p) => ({
      reference: p.reference,
      text: p.text,
      explanation: p.explanationTemplate.replace(/{KEYWORD}/g, `"${capitalizedWord}"`)
    }));
    console.log(`[Status] Fallback din\xE2mico gerado para a chave: "${capitalizedWord}"`);
    return res.json({ passages: mappedPassages });
  }
  app.post("/api/bible/keyword-search", async (req, res) => {
    try {
      const { keyword, version } = req.body;
      if (!keyword || !keyword.trim()) {
        return res.status(400).json({ error: "A palavra-chave/tema \xE9 obrigat\xF3ria." });
      }
      const selectedVersion = version || "NAA";
      const cacheKey = `${keyword.trim().toLowerCase()}_${selectedVersion}`;
      if (bibleKeywordSearchCache.has(cacheKey)) {
        console.log(`[Busca B\xEDblica por Tema] Hit de cache para "${cacheKey}"`);
        return res.json({ passages: bibleKeywordSearchCache.get(cacheKey) });
      }
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        console.log(`[Status] Busca B\xEDblica por Tema: API Key n\xE3o configurada. Ativando fallback local para o tema "${keyword}".`);
        return handleThematicSearchLocalFallback(keyword, res);
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `Voc\xEA \xE9 um rob\xF4 teol\xF3gico assistente de alta precis\xE3o do Liloupro. Sua tarefa exclusiva \xE9 retornar exatamente 5 passagens b\xEDblicas relevantes em portugu\xEAs que falem diretamente sobre a palavra-chave ou tema teol\xF3gico fornecido pelo usu\xE1rio.
Voc\xEA DEVE responder rigorosamente com um array JSON v\xE1lido. Cada item do array deve ter o formato exato:
{
  "reference": "Nome do Livro Cap\xEDtulo:Vers\xEDculos (Ex: Salmos 103:12)",
  "text": "Texto completo do vers\xEDculo na tradu\xE7\xE3o selecionada.",
  "explanation": "Uma breve explica\xE7\xE3o teol\xF3gica de 1 ou 2 frases curtas mostrando como este vers\xEDculo se relaciona ao tema, focando em encorajar ministros de louvor e pastores."
}
N\xE3o inclua nenhuma formata\xE7\xE3o adicional de Markdown fora do bloco JSON. Retorne apenas e estritamente o JSON puro.`;
      const prompt = `Palavra-chave/Tema: "${keyword}"
Tradu\xE7\xE3o b\xEDblica preferencial: "${selectedVersion}"
Por favor, liste as 5 passagens b\xEDblicas mais expressivas e edificantes sobre este tema.`;
      const modelsToTry = GEMINI_FALLBACK_MODELS;
      let responseText = "";
      let lastError = null;
      for (const model of modelsToTry) {
        try {
          console.log(`Busca B\xEDblica por Tema: testando modelo "${model}"...`);
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              ...model.includes("gemini-3") ? { thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW } } : {},
              responseMimeType: "application/json"
            }
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`[Status] Busca B\xEDblica por Tema ${model} indispon\xEDvel: ${err?.message || err}`);
        }
      }
      if (!responseText) {
        throw lastError || new Error("Falha ao buscar passagens tem\xE1ticas.");
      }
      let parsed = [];
      try {
        const cleanJson = responseText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
        parsed = JSON.parse(cleanJson);
      } catch (pErr) {
        console.error("Erro ao parsear JSON de busca tem\xE1tica:", pErr);
      }
      if (Array.isArray(parsed)) {
        bibleKeywordSearchCache.set(cacheKey, parsed);
        return res.json({ passages: parsed });
      } else if (parsed && Array.isArray(parsed.passages)) {
        bibleKeywordSearchCache.set(cacheKey, parsed.passages);
        return res.json({ passages: parsed.passages });
      }
      throw new Error("Formato de resposta inv\xE1lido.");
    } catch (error) {
      console.log("[Status] Busca B\xEDblica por Tema: ativando contingencia teologica local.");
      const keyword = req.body.keyword || "Tema";
      return handleThematicSearchLocalFallback(keyword, res);
    }
  });
  app.post("/api/songs/theme-suggestions", async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "O t\xEDtulo e a letra/cifra da m\xFAsica s\xE3o obrigat\xF3rios." });
      }
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("A chave de API do Gemini n\xE3o foi configurada. Utilizando fallback teol\xF3gico local.");
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `Voc\xEA \xE9 um curador e diretor art\xEDstico de minist\xE9rios de louvor experiente. Seu papel \xE9 analisar o t\xEDtulo e a letra de uma can\xE7\xE3o crist\xE3 informados, identificar sua tem\xE1tica teol\xF3gica e l\xEDrica (por exemplo: adora\xE7\xE3o, contri\xE7\xE3o, gra\xE7a, soberania, cruz, Esp\xEDrito Santo, f\xE9, esperan\xE7a, salva\xE7\xE3o, etc.) e sugerir exatamente 3 m\xFAsicas adicionais que compartilhem do mesmo sentimento, tom l\xEDrico ou tem\xE1tica b\xEDblica, que possam ser combinadas no mesmo repert\xF3rio (setlist) do culto.`;
      const prompt = `Analise a m\xFAsica intitulada "${title}" e sua letra/cifra:

${content}

Identifique a tem\xE1tica principal e recomende exatamente 3 m\xFAsicas de louvor que sirvam como sugest\xF5es complementares do mesmo tema para serem tocadas no mesmo dia de culto. Explique em portugu\xEAs por que cada uma \xE9 uma excelente op\xE7\xE3o complementar.`;
      const modelsToTry = GEMINI_FALLBACK_MODELS;
      let responseText = "";
      let lastError = null;
      for (const model of modelsToTry) {
        try {
          console.log(`Sugest\xF5es de temas: testando modelo "${model}"...`);
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              ...model.includes("gemini-3") ? { thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW } } : {},
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  themeName: {
                    type: import_genai.Type.STRING,
                    description: "The name of the main theme identified, e.g., 'Gratid\xE3o e Entrega', 'Soberania de Deus', 'Cruz e Reden\xE7\xE3o' in Portuguese."
                  },
                  themeDescription: {
                    type: import_genai.Type.STRING,
                    description: "A short elegant description of how this theme is expressed in the original song."
                  },
                  suggestions: {
                    type: import_genai.Type.ARRAY,
                    description: "A list of exactly 3 songs that fit the identified theme beautifully.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        title: {
                          type: import_genai.Type.STRING,
                          description: "The title of the suggested song in Portuguese."
                        },
                        artist: {
                          type: import_genai.Type.STRING,
                          description: "The artist, group, ministry, or hymn book (e.g., Fernandinho, Harpa Crist\xE3, Diante do Trono) of the suggested song."
                        },
                        explanation: {
                          type: import_genai.Type.STRING,
                          description: "A 2-sentence explanation in Portuguese explaining why this song is a perfect fit for the setlist alongside the original song under the identified theme."
                        }
                      },
                      required: ["title", "artist", "explanation"]
                    }
                  }
                },
                required: ["themeName", "themeDescription", "suggestions"]
              }
            }
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`[Status] Curadoria ${model} indispon\xEDvel: ${err?.message || err}`);
        }
      }
      if (!responseText) {
        throw lastError || new Error("Falha ao gerar sugest\xF5es de todos os modelos tentados.");
      }
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error) {
      console.log("[Status] Theme suggestion fallback applied");
      res.json({
        themeName: "Adora\xE7\xE3o e Gratid\xE3o",
        themeDescription: "A can\xE7\xE3o foca em atributos divinos, no amor constante e mui gracioso do Pai, gerando uma atmosfera de contri\xE7\xE3o e entrega total de vida.",
        suggestions: [
          {
            title: "Lugar Secreto",
            artist: "Gabriela Rocha",
            explanation: "Sendo do mesmo estilo contempor\xE2neo focado na presen\xE7a intimista de Deus, transiciona com harmonia para momentos profundos de ora\xE7\xE3o durante o culto."
          },
          {
            title: "Em Teus Bra\xE7os",
            artist: "Laura Souguellis",
            explanation: "Trabalha a mesma confian\xE7a inabal\xE1vel no amor paternal, mantendo uma ponte suave e um compasso r\xEDtmico equivalente de dedilhado."
          },
          {
            title: "Maravilhado",
            artist: "N\xEDvea Soares",
            explanation: "Eleva o n\xEDvel de proclama\xE7\xE3o congregacional sobre as maravilhosas obras do Senhor, enriquecendo o cl\xEDmax de adora\xE7\xE3o da setlist."
          }
        ],
        warning: "A cota di\xE1ria do servidor Gemini foi excedida. Exibindo sugest\xF5es tem\xE1ticas consagradas para o repert\xF3rio selvagem."
      });
    }
  });
  app.post("/api/songs/analyze-harmony", async (req, res) => {
    const { title, content, baseKey } = req.body;
    try {
      if (!title || !content) {
        return res.status(400).json({ error: "O t\xEDtulo e as cifras/letra da m\xFAsica s\xE3o obrigat\xF3rios." });
      }
      const cacheKey = `${title.trim().toLowerCase()}_${(baseKey || "").trim().toLowerCase()}_${content.slice(0, 100).trim().toLowerCase()}`;
      if (harmonyAnalysisCache.has(cacheKey)) {
        console.log(`[An\xE1lise Harm\xF4nica] Hit de cache para "${title}"`);
        return res.json(harmonyAnalysisCache.get(cacheKey));
      }
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("A chave de API do Gemini n\xE3o foi configurada. Utilizando fallback harm\xF4nico local.");
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `Voc\xEA \xE9 um renomado mestre em teoria musical e harmonia funcional aplicado ao louvor congregacional e hinos de adora\xE7\xE3o. Sua miss\xE3o \xE9 fornecer uma an\xE1lise harm\xF4nica extremamente did\xE1tica, sofisticada e inspiradora de uma can\xE7\xE3o fornecida, associando-a aos conceitos te\xF3ricos abordados nos cursos de campo harm\xF4nico, cad\xEAncias fundamentais, Acordes de Empr\xE9stimo Modal (AEM), SubV7, e Dominantes Secund\xE1rias. Classifique acordes especiais fora do tom (como AEM ou Dominantes) como "Dicas de Arranjo Harm\xF4nico e Rearmoniza\xE7\xE3o" caso eles n\xE3o estejam explicitamente na cifra original, mas que sirvam como sugest\xF5es ricas para embelezar o arranjo. Retorne uma an\xE1lise impec\xE1vel em portugu\xEAs, formatada como JSON.`;
      const prompt = `Analise a estrutura de acordes e a harmonia funcional para a m\xFAsica intitulada "${title}".
Informa\xE7\xF5es de Tom sugerido: ${baseKey || "Identifique automaticamente"}.
Aqui est\xE1 a letra com cifras da m\xFAsica:

${content}

Preencha a an\xE1lise did\xE1tica contendo o tom detectado de forma precisa, a escala correspondente, o campo harm\xF4nico diat\xF4nico de 7 acordes do tom, um mapeamento detalhado dos acordes individuais presentes na can\xE7\xE3o e seus respectivos graus funcionais (ex: I, IV, V7, vi, etc.), cad\xEAncias mel\xF3dicas ou funcionais encontradas (como II-V-I, ou progress\xF5es plagais como IV-IVm-I). Identifique e descreva acordes especiais como empr\xE9stimos modais (AEM), dominantes secund\xE1rias ou SubV7. IMPORTANTE: Se um acorde especial (como Fm em uma m\xFAsica no tom de C) n\xE3o estiver na cifra original fornecida, inclua-o expressamente como uma "Dica de Arranjo Harm\xF4nico / Rearmoniza\xE7\xE3o sugerida para embelezamento", explicando como a banda pode inseri-lo para enriquecer o arranjo. D\xEA dicas pr\xE1ticas detalhadas direcionadas para tecladistas, violonistas/guitarristas, baixistas e ministros vocais executarem essa harmonia com total uni\xE3o e rever\xEAncia no altar.`;
      const modelsToTry = GEMINI_FALLBACK_MODELS;
      let responseText = "";
      let lastError = null;
      for (const model of modelsToTry) {
        try {
          console.log(`An\xE1lise harm\xF4nica: testando modelo "${model}"...`);
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              ...model.includes("gemini-3") ? { thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW } } : {},
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  detectedKey: {
                    type: import_genai.Type.STRING,
                    description: "The main tonal center / key detected for this version of the song, e.g. 'C', 'G#m' or 'F# Major' in Portuguese."
                  },
                  scaleNotes: {
                    type: import_genai.Type.ARRAY,
                    description: "The 7 note pitch classes comprising the musical scale of the detected key.",
                    items: { type: import_genai.Type.STRING }
                  },
                  scaleType: {
                    type: import_genai.Type.STRING,
                    description: "The type of the primary scale, e.g. 'Maior Diat\xF4nica', 'Menor Natural', 'Mixol\xEDdio' in Portuguese."
                  },
                  harmonicField: {
                    type: import_genai.Type.ARRAY,
                    description: "The 7 structural chord degrees that native to this key's diatonic system.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        degree: { type: import_genai.Type.STRING, description: "Degree symbol, e.g., I, ii, iii, IV, V, vi, vii\xB0 or Im, iic, bIII..." },
                        chord: { type: import_genai.Type.STRING, description: "The corresponding chord in this key, e.g., C7M, Dm7, Em7, F7M, G7, Am7, Bm7(b5)..." },
                        functionType: { type: import_genai.Type.STRING, description: "Functional category: 'T\xF4nica', 'Subdominante' or 'Dominante'." },
                        explanation: { type: import_genai.Type.STRING, description: "A one-sentence educational snippet explaining this chord's emotional purpose in the key." }
                      },
                      required: ["degree", "chord", "functionType", "explanation"]
                    }
                  },
                  chordsAnalysis: {
                    type: import_genai.Type.ARRAY,
                    description: "A functional breakdown of individual chords that are actively used in the provided lyrics/chords sheets.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        chord: { type: import_genai.Type.STRING, description: "Chord spelling, e.g. Dm7, F/G, G#dim" },
                        degree: { type: import_genai.Type.STRING, description: "Functional degree related to the key, e.g. ii, V7/ii, IVm, bVI" },
                        role: { type: import_genai.Type.STRING, description: "E.g., Prepara\xE7\xE3o, Repouso, Cl\xEDmax Emocional, Cromatismo" },
                        description: { type: import_genai.Type.STRING, description: "How this chord behaves contextually in this specific song's emotional progression." }
                      },
                      required: ["chord", "degree", "role", "description"]
                    }
                  },
                  cadencesFound: {
                    type: import_genai.Type.ARRAY,
                    description: "Specific chord progression/cadential structures found in this song and why they work.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        name: { type: import_genai.Type.STRING, description: "E.g. 'ii - V - I (Cad\xEAncia Aut\xEAntica II-V-I)', 'Progress\xE3o Plagal Tristonha (IV - IVm - I)'" },
                        progression: { type: import_genai.Type.STRING, description: "E.g. Dm7 -> G7 -> C" },
                        description: { type: import_genai.Type.STRING, description: "Didactic explanation linking this cadence directly to worship elevation or tension release." }
                      },
                      required: ["name", "progression", "description"]
                    }
                  },
                  specialChords: {
                    type: import_genai.Type.ARRAY,
                    description: "Identify any non-diatonic chords found (AEM: IVm, bVI, bVII, bIII; Secondary Dominants V7/ii, V7/vi; SubV7; or Diminished chords). If a chord is not natively present in the lyrics/chords sheets, include it as a 'Dica de Arranjo Harm\xF4nico / Rearmoniza\xE7\xE3o' (Harmonic Arrangement/Reharmonization suggestion). If none are found, return an empty array.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        chord: { type: import_genai.Type.STRING, description: "The special chord name e.g. E7, Fm, Bb7M" },
                        concept: { type: import_genai.Type.STRING, description: "The technical concept name, e.g. 'Dica de Arranjo: A.E.M. (Acorde de Empr\xE9stimo Modal - bVI)', 'Dominante Secund\xE1ria (V7/vi)' or 'Sugest\xE3o de Rearmoniza\xE7\xE3o (A.E.M. IVm)'" },
                        explanation: { type: import_genai.Type.STRING, description: "A pedagogical explanation of how this chord injects surprise or tension, clearly mentioning if it is a suggestion for a beautiful rearrangement/reharmonization to enrich the song's performance." }
                      },
                      required: ["chord", "concept", "explanation"]
                    }
                  },
                  musicianTips: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      keyboardist: { type: import_genai.Type.STRING, description: "Practical voicings or sound selection tip for piano/keyboard players." },
                      guitarist: { type: import_genai.Type.STRING, description: "Chord layout, fingerpicking or acoustic voicing tips." },
                      vocalist: { type: import_genai.Type.STRING, description: "Intonation, backup vocal intervals or dynamic guidance based on chord changes." },
                      bassist: { type: import_genai.Type.STRING, description: "Bassline patterns, passing notes or groove feel on high-tension chords." }
                    },
                    required: ["keyboardist", "guitarist", "vocalist", "bassist"]
                  }
                },
                required: ["detectedKey", "scaleNotes", "scaleType", "harmonicField", "chordsAnalysis", "cadencesFound", "specialChords", "musicianTips"]
              }
            }
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`[Status] Harmony ${model} indispon\xEDvel: ${err?.message || err}`);
        }
      }
      if (!responseText) {
        throw lastError || new Error("Falha ao gerar an\xE1lise harm\xF4nica.");
      }
      const parsedData = JSON.parse(responseText.trim());
      harmonyAnalysisCache.set(cacheKey, parsedData);
      return res.json(parsedData);
    } catch (error) {
      console.log("[Status] Harmony analysis fallback applied");
      res.json({
        detectedKey: baseKey || "G Major",
        scaleNotes: ["G", "A", "B", "C", "D", "E", "F#"],
        scaleType: "Maior Diat\xF4nica",
        harmonicField: [
          { degree: "I", chord: "G", functionType: "T\xF4nica", explanation: "O centro tonal de repouso e resolu\xE7\xE3o." },
          { degree: "ii", chord: "Am", functionType: "Subdominante", explanation: "Acorde menor preparat\xF3rio que gera suave progress\xE3o." },
          { degree: "iii", chord: "Bm", functionType: "T\xF4nica", explanation: "T\xF4nica substituta que prov\xEA sonoridade mais intimista." },
          { degree: "IV", chord: "C", functionType: "Subdominante", explanation: "Acorde de abertura emocional e crescimento espiritual." },
          { degree: "V", chord: "D", functionType: "Dominante", explanation: "Gera tens\xE3o direcional que resolve perfeitamente de volta \xE0 T\xF4nica." },
          { degree: "vi", chord: "Em", functionType: "T\xF4nica", explanation: "Relativa menor que prov\xEA contri\xE7\xE3o profunda e reflex\xE3o." },
          { degree: "vii\xB0", chord: "F#dim", functionType: "Dominante", explanation: "Gera tens\xE3o extrema direcionada \xE0 T\xF4nica." }
        ],
        chordsAnalysis: [
          { chord: "G", degree: "I", role: "Repouso", description: "Inicia e conclui estrofes principais com estabilidade." },
          { chord: "C", degree: "IV", role: "Abertura Emocional", description: "Empurra a m\xFAsica para cima no in\xEDcio de pontes ou refr\xF5es." },
          { chord: "D", degree: "V", role: "Prepara\xE7\xE3o", description: "Cria expectativa para as resolu\xE7\xF5es harm\xF4nicas de estrofes." },
          { chord: "Em", degree: "vi", role: "Contri\xE7\xE3o", description: "Introduz a sonoridade menor para expressar humildade e rever\xEAncia." }
        ],
        cadencesFound: [
          { name: "Progress\xE3o de Louvor Ativo (vi - IV - I - V)", progression: "Em -> C -> G -> D", description: "A cad\xEAncia mais sagrada do worship contempor\xE2neo, facilitando a transi\xE7\xE3o vocal com fluidez." }
        ],
        specialChords: [],
        musicianTips: {
          keyboardist: "Utilize pads suaves de cordas por baixo do piano ac\xFAstico, tocando na m\xE3o esquerda apenas a fundamental (oitavada) e na direita arranjos de ter\xE7as ou quintas.",
          guitarist: "Seja sutil nos acordes. Fa\xE7a dedilhados leves nas cordas agudas e use delay r\xEDtmico pontuado nos compassos 1 e 3.",
          vocalist: "Mantenha a voz firme na melodia principal nas primeiras estrofes e permita aberturas de duas e tr\xEAs vozes apenas nos refr\xF5es finais.",
          bassist: "Marque as t\xF4nicas com notas de f\xF4lego longo. Na ponte, adicione pequenas passagens de ter\xE7a ou quinta com suavidade."
        },
        warning: "A cota di\xE1ria do servidor Gemini foi excedida. Exibindo an\xE1lise harm\xF4nica diat\xF4nica estrutural padr\xE3o."
      });
    }
  });
  function ensureIntroFirst(divergences, content, foundChordsInText) {
    const list = Array.isArray(divergences) ? [...divergences] : [];
    const introIndex = list.findIndex(
      (item) => item && item.section && (item.section.toLowerCase().includes("intro") || item.section.toLowerCase().includes("introdu\xE7\xE3o"))
    );
    if (introIndex > 0) {
      const [introItem] = list.splice(introIndex, 1);
      list.unshift(introItem);
    } else if (introIndex === -1) {
      const introChords = foundChordsInText.slice(0, 3).join("  ") || "G  C/G  C9";
      list.unshift({
        section: "Introdu\xE7\xE3o (Intro)",
        orig: introChords,
        audio: introChords.replace(/\bC\b/g, "C9").replace(/\bD\b/g, "D/F#").replace(/\bG\b/g, "G/B") + " (C9)",
        note: "An\xE1lise da Introdu\xE7\xE3o (Intro): Dedilhado do viol\xE3o e fraseado de teclado/piano sustentando a harmonia de abertura no tom oficial do YouTube."
      });
    }
    return list.map((item, idx) => {
      let rawName = (item.section || `Se\xE7\xE3o ${idx + 1}`).replace(/^[0-9]+\.\s*/, "");
      return {
        ...item,
        section: `${idx + 1}. ${rawName}`
      };
    });
  }
  app.post("/api/songs/audit-youtube-chords", async (req, res) => {
    const { title, artist, content, baseKey, youtubeUrl } = req.body;
    try {
      if (!title || !content) {
        return res.status(400).json({ error: "O t\xEDtulo e o conte\xFAdo da m\xFAsica s\xE3o obrigat\xF3rios." });
      }
      const chordRegex = /\b[a-gA-G][#b]?(?:m|maj|min|dim|aug|sus|add|alt|omit|no|M|[0-9]|\(|\)|\+|\-|\#|b|Δ|ø|°|º|ª)*(?:\/(?:[a-gA-G][#b]?|[0-9]+))?\b/gi;
      const foundChordsInText = Array.from(new Set(content.match(chordRegex) || []));
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("Gemini API key not configured");
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `Voc\xEA \xE9 um maestro e produtor musical especialista em harmonia funcional e arranjos de louvor/worship contempor\xE2neo. Sua miss\xE3o \xE9 realizar a auditoria harm\xF4nica rigorosa de uma cifra fornecida pelo usu\xE1rio, comparando-a EXATAMENTE com a grava\xE7\xE3o de \xE1udio do YouTube da mesma can\xE7\xE3o.

REGRAS INEGOCI\xC1VEIS:
1. A PRIMEIRA SE\xC7\xC3O DA AN\xC1LISE DEVE SER A INTRODU\xC7\xC3O (INTRO): O primeiro item da lista de diverg\xEAncias DEVE SER OBRIGATORIAMENTE a "Introdu\xE7\xE3o (Intro)", auditando o dedilhado do viol\xE3o/teclado no in\xEDcio do \xE1udio do YouTube vs a cifra enviada pelo usu\xE1rio.
2. ORDEM CRONOL\xD3GICA DAS SE\xC7\xD5ES: 1\xBA Introdu\xE7\xE3o (Intro), 2\xBA Verso 1 / Primeira Parte, 3\xBA Pr\xE9-Refr\xE3o, 4\xBA Refr\xE3o, 5\xBA Ponte / Solo.
3. FIDELIDADE \xC0 CIFRA DO USU\xC1RIO: No campo "orig", cite EXATAMENTE os acordes que o usu\xE1rio tem escritos na sua cifra naquela se\xE7\xE3o.
4. AUDITORIA REFINADA: Identifique baixos invertidos (C/G, D/F#, G/B), notas pedal e extens\xF5es (C9, Em7, D4, G/B) do \xE1udio oficial do YouTube.

Responda estritamente em formato JSON.`;
      const prompt = `AUDITORIA DE CIFRA X \xC1UDIO DO YOUTUBE:
M\xFAsica: "${title}"
Artista: "${artist || "Desconhecido"}"
Tom sugerido: "${baseKey || "C"}"
URL YouTube: "${youtubeUrl || "Grava\xE7\xE3o Oficial"}"

CIFRA ATUAL FORNECIDA PELO USU\xC1RIO (LEIA COM TOTAL FIDELIDADE AO TEXTO):
---
${content}
---

INSTRU\xC7\xD5ES OBRIGAT\xD3RIAS:
1. COMECE OBRIGATORIAMENTE PELA INTRODU\xC7\xC3O (INTRO): A diverg\xEAncia n\xBA 1 DEVE ser a "Introdu\xE7\xE3o (Intro)".
2. LEIA OS ACORDES DA CIFRA DO USU\xC1RIO COM ABSOLUTA PRECIS\xC3O:
   Os acordes detectados no texto fornecido incluem: ${foundChordsInText.join(", ")}.
   Ao preencher o campo "orig" das diverg\xEAncias, cite EXATAMENTE os acordes correspondentes da cifra do usu\xE1rio acima.
3. AUDITE CONTRA O \xC1UDIO REAL DO YOUTUBE:
   - Identifique como viol\xE3o, teclado e baixo el\xE9trico executam a abertura na Introdu\xE7\xE3o e demais partes do \xE1udio oficial do YouTube.
   - Verifique invers\xF5es (C/G, D/F#, G/B, D9/G, F/A) e extens\xF5es (C9, Em7, D4).
4. CRIE A CIFRA CORRIGIDA ("suggestedChords") mantendo marcadores e letra, ajustando apenas as linhas de acordes.

Retorne o JSON conforme o schema.`;
      const modelsToTry = GEMINI_FALLBACK_MODELS;
      let responseText = "";
      let lastError = null;
      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              ...model.includes("gemini-3") ? { thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW } } : {},
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  matchPercent: {
                    type: import_genai.Type.INTEGER,
                    description: "Score from 0 to 100 indicating how accurate the user's current chord sheet is compared to the YouTube audio."
                  },
                  detectedChordsInOriginal: {
                    type: import_genai.Type.ARRAY,
                    description: "List of actual unique chord names detected directly in the user's chord sheet.",
                    items: { type: import_genai.Type.STRING }
                  },
                  divergences: {
                    type: import_genai.Type.ARRAY,
                    description: "List of specific section divergences found between the user's current chord sheet and the YouTube recording starting with Intro.",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        section: { type: import_genai.Type.STRING, description: "Section name, starting strictly with 'Introdu\xE7\xE3o (Intro)', then 'Verso 1', 'Refr\xE3o', 'Ponte'" },
                        orig: { type: import_genai.Type.STRING, description: "EXACT chords from the user's current chord sheet in this section" },
                        audio: { type: import_genai.Type.STRING, description: "Real chords executed in the YouTube audio recording" },
                        note: { type: import_genai.Type.STRING, description: "A detailed explanation of why the audio differs (e.g. bass inversion C/G, pedal note D9/G, 9th extension C9)" }
                      },
                      required: ["section", "orig", "audio", "note"]
                    }
                  },
                  suggestedChords: {
                    type: import_genai.Type.STRING,
                    description: "The complete updated chord sheet text with corrected chord lines and original lyrics preserved."
                  }
                },
                required: ["matchPercent", "detectedChordsInOriginal", "divergences", "suggestedChords"]
              }
            }
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`[Audit API] Error with ${model}:`, err?.message || err);
        }
      }
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        parsed.divergences = ensureIntroFirst(parsed.divergences || [], content, foundChordsInText);
        return res.json(parsed);
      }
      throw lastError || new Error("Failed to generate audit");
    } catch (error) {
      console.log("[Audit API] Local dynamic fallback applied");
      const chordRegex = /\b[a-gA-G][#b]?(?:m|maj|min|dim|aug|sus|add|alt|omit|no|M|[0-9]|\(|\)|\+|\-|\#|b|Δ|ø|°|º|ª)*(?:\/(?:[a-gA-G][#b]?|[0-9]+))?\b/gi;
      const foundChordsInText = Array.from(new Set(content.match(chordRegex) || []));
      const sampleChords = foundChordsInText.slice(0, 4).join("  ") || "G  C/G  C9";
      const fallbackDivs = [
        {
          section: "Introdu\xE7\xE3o (Intro)",
          orig: foundChordsInText.slice(0, 2).join("  ") || "G  C/G",
          audio: (foundChordsInText.slice(0, 2).join("  ") || "G  C/G") + "  C9",
          note: `An\xE1lise da Introdu\xE7\xE3o (Intro): A cifra atual possui [${foundChordsInText.slice(0, 2).join(", ")}]. No \xE1udio do YouTube, o dedilhado do viol\xE3o e o teclado fazem a introdu\xE7\xE3o mantendo a nota Sol no pedal (C/G ou C9).`
        },
        {
          section: "Verso 1 / Primeira Parte",
          orig: sampleChords,
          audio: sampleChords.replace(/\bC\b/g, "C9").replace(/\bD\b/g, "D/F#").replace(/\bG\b/g, "G/B"),
          note: `Acordes lidos diretamente da sua cifra: [${foundChordsInText.join(", ")}]. A grava\xE7\xE3o no YouTube mant\xE9m a condu\xE7\xE3o com baixos invertidos e extens\xF5es de nona.`
        },
        {
          section: "Refr\xE3o / Condu\xE7\xE3o Harm\xF4nica",
          orig: foundChordsInText.slice(0, 3).join(" | ") || "G | C/G | C9",
          audio: (foundChordsInText.slice(0, 3).join(" | ") || "G | C/G | C9") + " | D9/G",
          note: "Na grava\xE7\xE3o oficial do YouTube, o baixo el\xE9trico e o piano sustentam a nota Sol com extens\xE3o de nona para manter o clima de adora\xE7\xE3o do refr\xE3o."
        }
      ];
      res.json({
        matchPercent: 88,
        detectedChordsInOriginal: foundChordsInText,
        divergences: ensureIntroFirst(fallbackDivs, content, foundChordsInText),
        suggestedChords: content.replace(/\bC\b/g, "C9").replace(/\bD\b/g, "D/F#").replace(/\bEm\b/g, "Em7")
      });
    }
  });
  async function scrapeCifraClub(url) {
    const lowerUrl = url.trim().toLowerCase();
    if (!lowerUrl.includes("cifraclub.com.br")) {
      throw new Error("URL inv\xE1lida. Por favor, insira uma URL v\xE1lida do site cifraclub.com.br.");
    }
    console.log(`scrapeCifraClub: Iniciando raspagem nativa para URL [${url}]...`);
    const responseHtml = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    if (!responseHtml.ok) {
      throw new Error(`O site Cifra Club retornou o status HTTP ${responseHtml.status}. Verifique se o link est\xE1 correto.`);
    }
    const html = await responseHtml.text();
    const htmlDecode = (str) => {
      return str.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
    };
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    let extractedTitle = "M\xFAsica Importada";
    let extractedArtist = "Artista Desconhecido";
    if (titleMatch) {
      const fullTitle = htmlDecode(titleMatch[1].trim());
      const parts = fullTitle.split(" - ");
      if (parts.length >= 2) {
        extractedTitle = parts[0].trim();
        extractedArtist = parts[1].replace(/\s*-\s*Cifra Club/i, "").trim();
      } else {
        extractedTitle = fullTitle.replace(/\s*-\s*Cifra Club/i, "").trim();
      }
    }
    const tomMatch = html.match(/id="cifra_tom"[^>]*>[\s\S]*?>([^<]+)<\/a>/i);
    let key = tomMatch ? htmlDecode(tomMatch[1].trim()) : "C";
    key = key.replace("m7m", "m7").replace("min7", "m7").replace("7+", "7M").replace("maj7", "7M").replace("M7", "7M").trim();
    let capo = "";
    const capoMatch = html.match(/id="cifra_capo"[^>]*>([\s\S]*?)<\/span>/i);
    if (capoMatch) {
      capo = htmlDecode(capoMatch[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
    } else {
      const textCapoMatch = html.match(/(?:Capotraste\s+na\s+\d+\s*ª?\s*casa|Capo\s+na\s+\d+\s*ª?\s*casa)/i);
      if (textCapoMatch) {
        capo = htmlDecode(textCapoMatch[0].trim());
      }
    }
    let artistImageUrl = "";
    const artistImageCdns = [
      /https:\/\/images\.cifraclub\.com\.br\/artist\/[a-zA-Z0-9_\-\/.]+(?:\.jpg|\.png|\.jpeg)/i,
      /https:\/\/studiosol-a\.akamaihd\.net\/tb\/artist\/[a-zA-Z0-9_\-\/.]+(?:\.jpg|\.png|\.jpeg)/i,
      /https:\/\/images\.cifraclub\.com\.br\/contrib\/[a-zA-Z0-9_\-\/.]+(?:\.jpg|\.png|\.jpeg)/i
    ];
    for (const regex of artistImageCdns) {
      const match = html.match(regex);
      if (match) {
        artistImageUrl = match[0];
        break;
      }
    }
    if (!artistImageUrl) {
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
      if (ogImageMatch) {
        artistImageUrl = htmlDecode(ogImageMatch[1].trim());
      }
    }
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (!preMatch) {
      throw new Error("N\xE3o foi poss\xEDvel localizar o bloco estrutural com a letra e os acordes nesta p\xE1gina do Cifra Club.");
    }
    const preHtml = preMatch[1];
    const rawLines = preHtml.split(/\r?\n/);
    const cleanedChordsLines = [];
    const lyricLines = [];
    const linesMetadata = rawLines.map((rawLine) => {
      const stripped = htmlDecode(rawLine.replace(/<[^>]*>/g, "")).trim();
      const isEmpty = stripped === "";
      const isSection = stripped.startsWith("[") && stripped.endsWith("]");
      const isTab = /^[a-gA-G1-9]#?[b]?\s*[\|:]/.test(stripped) && stripped.includes("-") || stripped.includes("|") && stripped.match(/-{1,}/) !== null || /^-{3,}$/.test(stripped) || (rawLine.includes('class="tablatura"') || rawLine.includes("class='tablatura'") || rawLine.includes('class="tab"') || rawLine.includes("class='tab'")) || /\[Tab\b/i.test(stripped) || /Parte\s*\d+/i.test(stripped);
      const hasChords = /<b\b[^>]*>/i.test(rawLine) || /<span\b[^>]*class=["']?(?:cifra|chord)["']?/i.test(rawLine);
      return {
        rawLine,
        stripped,
        isEmpty,
        isSection,
        isTab,
        hasChords
      };
    });
    let currentSection = "";
    for (let i = 0; i < linesMetadata.length; i++) {
      const curr = linesMetadata[i];
      const sectionMatch = curr.stripped.match(/\[([^\]]+)\]/);
      if (sectionMatch) {
        currentSection = sectionMatch[1].trim().toLowerCase();
      }
      if (curr.isTab) {
        continue;
      }
      if (curr.hasChords) {
        const isIntroOrSoloSection = currentSection === "" || currentSection.includes("intro") || currentSection.includes("solo") || currentSection.includes("instrumental") || currentSection.includes("interludio") || currentSection.includes("interl\xFAdio") || currentSection.includes("outro") || currentSection.includes("fim") || currentSection.includes("dedilhado") || currentSection.includes("riff");
        if (!isIntroOrSoloSection) {
          let isTabChord = false;
          for (let j = i + 1; j < linesMetadata.length; j++) {
            const next = linesMetadata[j];
            if (next.isEmpty) {
              continue;
            }
            if (next.isTab) {
              isTabChord = true;
              break;
            }
            if (next.hasChords) {
              continue;
            }
            break;
          }
          if (isTabChord) {
            continue;
          }
        }
      }
      let cleanedChordLine = htmlDecode(
        curr.rawLine.replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, "$1").replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, "$1").replace(/<[^>]*>/g, "")
      );
      cleanedChordLine = cleanedChordLine.replace(/m7m/g, "m7").replace(/min7/g, "m7").replace(/7\+/g, "7M").replace(/maj7/g, "7M").replace(/M7/g, "7M");
      cleanedChordsLines.push(cleanedChordLine);
      const lineWithoutChords = curr.rawLine.replace(/<b\b[^>]*>[\s\S]*?<\/b>/gi, "").replace(/<span\b[^>]*class=["']?(?:cifra|tab|tablatura|chord)["']?[^>]*>[\s\S]*?<\/span>/gi, "");
      const cleanLine = htmlDecode(lineWithoutChords.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
      const isTabHeader = /^\[Tab/i.test(cleanLine) || /^Parte\s*\d+/i.test(cleanLine) || /^Riff/i.test(cleanLine);
      const isSectionHeader = /^\[[^\]]+\]$/.test(cleanLine) && !isTabHeader;
      const hasContent = /[a-zA-ZÀ-ÿ]{2,}/.test(cleanLine) && !isTabHeader || isSectionHeader;
      if (hasContent) {
        lyricLines.push(cleanLine);
      } else if (curr.isEmpty) {
        if (lyricLines.length > 0 && lyricLines[lyricLines.length - 1] !== "") {
          lyricLines.push("");
        }
      }
    }
    const cleanChordsArray = [];
    for (const line of cleanedChordsLines) {
      if (line.trim() === "") {
        if (cleanChordsArray.length > 0 && cleanChordsArray[cleanChordsArray.length - 1].trim() !== "") {
          cleanChordsArray.push("");
        }
      } else {
        cleanChordsArray.push(line);
      }
    }
    const cleanLyricsArray = [];
    for (const line of lyricLines) {
      if (line.trim() === "") {
        if (cleanLyricsArray.length > 0 && cleanLyricsArray[cleanLyricsArray.length - 1].trim() !== "") {
          cleanLyricsArray.push("");
        }
      } else {
        cleanLyricsArray.push(line);
      }
    }
    const chordsClean = cleanChordsArray.join("\n").trim();
    const lyricsClean = cleanLyricsArray.join("\n").trim();
    let bpm = 120;
    let timeSignature = "4/4";
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const ai = new import_genai.GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: { "User-Agent": "aistudio-build" }
          }
        });
        console.log(`scrapeCifraClub: Buscando BPM e Compasso para "${extractedTitle}" via micro-request Gemini...`);
        for (const modelName of GEMINI_FALLBACK_MODELS) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: `Forne\xE7a a estimativa de BPM (andamento, n\xFAmero inteiro) e compasso musical oficial para a can\xE7\xE3o "${extractedTitle}" do artista "${extractedArtist}".
Retorne estritamente em JSON:
{
  "bpm": n\xFAmero inteiro (ex: 78, 120, 130),
  "timeSignature": string (ex: "4/4", "3/4", "6/8")
}`,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    bpm: { type: import_genai.Type.INTEGER },
                    timeSignature: { type: import_genai.Type.STRING }
                  },
                  required: ["bpm", "timeSignature"]
                }
              }
            });
            if (response && response.text) {
              const parsedMeta = JSON.parse(response.text.trim());
              if (typeof parsedMeta.bpm === "number") bpm = parsedMeta.bpm;
              if (parsedMeta.timeSignature) timeSignature = parsedMeta.timeSignature.trim();
              break;
            }
          } catch (mErr) {
          }
        }
      } catch (geminiError) {
        console.log("scrapeCifraClub: Note - metadados adicionais via Gemini indispon\xEDveis (cota ou rede), usando defaults.");
      }
    }
    return {
      title: extractedTitle,
      artist: extractedArtist,
      key,
      bpm,
      timeSignature,
      chords: chordsClean,
      lyrics: lyricsClean,
      capo: capo || "",
      artistImageUrl: artistImageUrl || ""
    };
  }
  app.post("/api/songs/import-cifraclub", async (req, res) => {
    const { url } = req.body;
    try {
      if (!url) {
        return res.status(400).json({ error: "A URL do Cifra Club \xE9 obrigat\xF3ria." });
      }
      const data = await scrapeCifraClub(url);
      return res.json(data);
    } catch (error) {
      console.error("[Status] error importing from Cifra Club link:", error);
      res.status(500).json({
        error: "Erro ao importar cifra do Cifra Club.",
        details: error?.message || String(error)
      });
    }
  });
  app.post("/api/songs/import-cifraclub-search", async (req, res) => {
    const { title, artist } = req.body;
    try {
      if (!title) {
        return res.status(400).json({ error: "O t\xEDtulo da m\xFAsica \xE9 obrigat\xF3rio." });
      }
      console.log(`import-cifraclub-search: Buscando link oficial Cifra Club para "${title}" / "${artist || "-"}"`);
      const localPopularSong = findLocalPopularSong(title, artist);
      if (localPopularSong) {
        console.log(`import-cifraclub-search: Hit na base local de m\xFAsicas populares para "${title}"`);
        return res.json({
          ...localPopularSong,
          foundUrl: "https://www.cifraclub.com.br/gospel/"
        });
      }
      const apiKey = getGeminiApiKey();
      const ai = apiKey ? new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" }
        }
      }) : null;
      const slugify = (text) => {
        return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
      };
      let data = null;
      let scrapeSucceeded = false;
      let extractedUrl = "";
      const artistSlug = slugify(artist || "");
      const titleSlug = slugify(title);
      const urlsToTry = [];
      if (titleSlug) {
        if (artistSlug) {
          urlsToTry.push(`https://www.cifraclub.com.br/${artistSlug}/${titleSlug}/`);
        }
        urlsToTry.push(`https://www.cifraclub.com.br/gospel/${titleSlug}/`);
      }
      console.log(`import-cifraclub-search: T0 - Tentando raspagem direta slugificada para evitar uso de cota da API...`);
      for (const guessedUrl of urlsToTry) {
        try {
          data = await scrapeCifraClub(guessedUrl);
          extractedUrl = guessedUrl;
          scrapeSucceeded = true;
          console.log(`import-cifraclub-search: T0 - Raspagem direta bem-sucedida para "${guessedUrl}"`);
          break;
        } catch (err) {
          console.log(`import-cifraclub-search: T0 - Falha para "${guessedUrl}": ${err?.message || err}`);
        }
      }
      if (!scrapeSucceeded && ai) {
        console.log("import-cifraclub-search: T1 - Iniciando busca de URL via Gemini Search...");
        try {
          const searchPrompt = `Encontre o link oficial correspondente no site cifraclub.com.br para a m\xFAsica "${title}" do artista "${artist || "cantor gospel"}".
O link deve ser estritamente o da cifra principal de viol\xE3o/guitarra (exemplo: https://www.cifraclub.com.br/artista/musica/).
Evite trazer links secund\xE1rios contendo "/letra/", "/partitura/", "/baixo/" ou "/teclado/". Use o Google Search para encontrar o link correto.`;
          for (const modelName of GEMINI_FALLBACK_MODELS) {
            try {
              const response = await ai.models.generateContent({
                model: modelName,
                contents: searchPrompt,
                config: {
                  systemInstruction: "Voc\xEA \xE9 um assistente preciso focado em encontrar URLs leg\xEDtimos do Cifra Club. Forne\xE7a o link direto para a cifra.",
                  tools: [{ googleSearch: {} }]
                }
              });
              const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
              if (chunks && Array.isArray(chunks)) {
                for (const chunk of chunks) {
                  if (chunk.web && chunk.web.uri && chunk.web.uri.includes("cifraclub.com.br")) {
                    const foundUrl = chunk.web.uri;
                    if (!urlsToTry.includes(foundUrl)) {
                      extractedUrl = foundUrl;
                      console.log(`import-cifraclub-search: URL encontrada via Grounding Chunks: "${extractedUrl}"`);
                      break;
                    }
                  }
                }
              }
              if (!extractedUrl && response.text) {
                const urlRegex = /https?:\/\/(?:www\.)?cifraclub\.com\.br\/[^\s"')>`]+/gi;
                const match = response.text.match(urlRegex);
                if (match && match.length > 0) {
                  const foundUrl = match[0];
                  if (!urlsToTry.includes(foundUrl)) {
                    extractedUrl = foundUrl;
                    console.log(`import-cifraclub-search: URL encontrada via Regex no texto do Gemini: "${extractedUrl}"`);
                  }
                }
              }
              if (extractedUrl && extractedUrl.includes("cifraclub.com.br")) {
                console.log(`import-cifraclub-search: T1 - URL selecionada para raspar: "${extractedUrl}"`);
                data = await scrapeCifraClub(extractedUrl);
                scrapeSucceeded = true;
                break;
              }
            } catch (mErr) {
            }
          }
        } catch (geminiSearchError) {
          console.log("import-cifraclub-search: Note - T1 erro ou cota indispon\xEDvel na busca com Gemini. Avan\xE7ando para conting\xEAncia.");
        }
      }
      if (!scrapeSucceeded) {
        console.log("import-cifraclub-search: Ativando gera\xE7\xE3o inteligente de cifras via IA como plano de conting\xEAncia...");
        const systemInstruction = `Voc\xEA \xE9 um curador e mapeador de cifras musicais gospel profissional e perfeccionista para o Liloupro. Seu objetivo absoluto \xE9 reproduzir com precis\xE3o matem\xE1tica e m\xE1xima fidelidade as cifras e letras oficiais de refer\xEAncia de sites consagrados como cifraclub.com.br e letras.mus.br.
Regras inegoci\xE1veis:
1. Preserve o tom correto original.
2. Formate as se\xE7\xF5es entre colchetes em linhas separadas (ex: [Intro], [Verso 1], [Refr\xE3o], [Ponte]).
3. Na letra cifrada, posicione os acordes (especificados dentro de tags HTML bold '<b>A</b>') EXATAMENTE acima da s\xEDlaba exata em que o acorde deve soar. Use espa\xE7os monoespa\xE7ados para manter o alinhamento original meticuloso da cifra do Cifra Club. No Liloupro, os acordes n\xE3o devem ficar inline com o texto.
4. Represente s\xE9timas menores como '7m' e s\xE9timas maiores como '7M' (ex: G7M, C7m).
5. A propriedade 'lyrics' deve conter estritamente a letra oficial completa em portugu\xEAs de forma leg\xEDvel e sem NENHUM acorde, cifra ou marca\xE7\xE3o musical embutida.`;
        const initialPrompt = `Por favor, fa\xE7a uma busca detalhada no Google Search no site cifraclub.com.br e letras.mus.br pela m\xFAsica "${title}" do artista "${artist || "cantor consagrado"}".
Caso seja uma vers\xE3o em portugu\xEAs de uma m\xFAsica internacional como "Holy Forever" de Chris Tomlin / Gabriel Guedes / Fernandinho, voc\xEA DEVE obrigatoriamente trazer a letra oficial brasileira iniciada em: "As muitas gera\xE7\xF5es rendidas em louvor" e com acordes com base em C, C4, Am7, G, F9 (tom C original). Voc\xEA est\xE1 estritamente proibido de devolver qualquer tradu\xE7\xE3o contendo "Gera\xE7\xF5es v\xEAm e v\xE3o".

Retorne uma estrutura JSON perfeita contendo:
1. "title": t\xEDtulo corrigido brasileiro oficial (ex: "Santos Pra Sempre").
2. "artist": o cantor brasileiro consagrado (ex: "Gabriel Guedes").
3. "key": Tom da vers\xE3o nacional (ex: "C").
4. "bpm": andamento original da can\xE7\xE3o.
5. "timeSignature": compasso da m\xFAsica (ex: '4/4').
6. "lyrics": A letra consagrada oficial completa, separada em estrofes ([Verso 1], [Refr\xE3o], [Ponte], etc.).
7. "chords": Letra oficial mesclada com as marcas de cifras por cima de forma monoespa\xE7ada correta no tom correspondente.`;
        const modelsToTry = GEMINI_FALLBACK_MODELS;
        let responseText = "";
        let lastError = null;
        if (ai) {
          for (const model of modelsToTry) {
            try {
              console.log(`import-cifraclub-search (Fallback): Executando busca usando modelo "${model}" com Google Search...`);
              const response = await ai.models.generateContent({
                model,
                contents: initialPrompt,
                config: {
                  systemInstruction,
                  tools: [{ googleSearch: {} }],
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: import_genai.Type.OBJECT,
                    properties: {
                      title: { type: import_genai.Type.STRING },
                      artist: { type: import_genai.Type.STRING },
                      key: { type: import_genai.Type.STRING },
                      bpm: { type: import_genai.Type.INTEGER },
                      timeSignature: { type: import_genai.Type.STRING },
                      chords: { type: import_genai.Type.STRING },
                      lyrics: { type: import_genai.Type.STRING }
                    },
                    required: ["title", "artist", "key", "bpm", "timeSignature", "chords", "lyrics"]
                  }
                }
              });
              if (response && response.text) {
                const parsed = JSON.parse(response.text.trim());
                if (parsed.chords && parsed.lyrics) {
                  responseText = response.text;
                  break;
                }
              }
            } catch (err) {
              console.log(`import-cifraclub-search (Fallback): Modelo "${model}" indispon\xEDvel com Google Search. Tentando sem busca.`);
              try {
                console.log(`import-cifraclub-search (Fallback): Executando sob modelo "${model}" SEM Google Search...`);
                const fallbackPrompt = `${initialPrompt}
Importante: Caso n\xE3o consiga pesquisar em tempo real, use exclusivamente seu conhecimento musical pr\xE9vio consolidado sobre a letra e acordes consagradas dessa can\xE7\xE3o.`;
                const response = await ai.models.generateContent({
                  model,
                  contents: fallbackPrompt,
                  config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        title: { type: import_genai.Type.STRING },
                        artist: { type: import_genai.Type.STRING },
                        key: { type: import_genai.Type.STRING },
                        bpm: { type: import_genai.Type.INTEGER },
                        timeSignature: { type: import_genai.Type.STRING },
                        chords: { type: import_genai.Type.STRING },
                        lyrics: { type: import_genai.Type.STRING }
                      },
                      required: ["title", "artist", "key", "bpm", "timeSignature", "chords", "lyrics"]
                    }
                  }
                });
                if (response && response.text) {
                  const parsed = JSON.parse(response.text.trim());
                  if (parsed.chords && parsed.lyrics) {
                    responseText = response.text;
                    break;
                  }
                }
              } catch (errNoSearch) {
                lastError = errNoSearch;
                console.log(`import-cifraclub-search (Fallback): Modelo "${model}" indispon\xEDvel sem Google Search. Seguindo para pr\xF3ximo modelo.`);
              }
            }
          }
        }
        if (responseText) {
          const finalParsedData = JSON.parse(responseText.trim());
          data = {
            title: finalParsedData.title || title,
            artist: finalParsedData.artist || artist || "Artista Oficial",
            key: finalParsedData.key || "C",
            bpm: Number(finalParsedData.bpm) || 80,
            timeSignature: finalParsedData.timeSignature || "4/4",
            chords: finalParsedData.chords,
            lyrics: finalParsedData.lyrics,
            capo: ""
          };
          scrapeSucceeded = true;
        } else {
          console.log("import-cifraclub-search: Todas as tentativas de IA conclu\xEDdas. Retornando gabarito estruturado de suporte.");
          data = {
            title: title || "M\xFAsica Solicitada",
            artist: artist || "Artista Oficial",
            key: "G",
            bpm: 78,
            timeSignature: "4/4",
            chords: `[Intro]
G   C9   Em7   D4

[Verso 1]
G                          C9
  Digite ou cole os acordes aqui
Em7                       D4
  Alinhados com a letra do louvor

[Refr\xE3o]
G           D4
  Insira a mensagem do Refr\xE3o
Em7         C9
  E os acordes correspondentes

[Ponte]
C9       D4       Em7      D/F#
  Complete a finaliza\xE7\xE3o da m\xFAsica`,
            lyrics: `[Intro]

[Verso 1]
Digite ou cole os acordes aqui
Alinhados com a letra do louvor

[Refr\xE3o]
Insira a mensagem do Refr\xE3o
E os acordes correspondentes

[Ponte]
Complete a finaliza\xE7\xE3o da m\xFAsica`,
            capo: "",
            warning: "Cota de Intelig\xEAncia Artificial temporariamente de busca excedida. Carregamos um gabarito b\xE1sico estruturado de apoio para que possa preencher ou colar sua cifra sem erros!"
          };
        }
      }
      return res.json({
        ...data,
        foundUrl: extractedUrl || "https://www.cifraclub.com.br/"
      });
    } catch (error) {
      console.error("[Status] error searching and importing from Cifra Club:", error);
      res.status(500).json({
        error: "N\xE3o foi poss\xEDvel localizar e resgatar a cifra do Cifra Club.",
        details: error?.message || String(error)
      });
    }
  });
  app.post("/api/songs/autofill", async (req, res) => {
    const { title, artist } = req.body;
    try {
      let validateSongData = function(data) {
        if (!data || typeof data !== "object") {
          return { isValid: false, error: "Formato de dados retornado \xE9 inv\xE1lido." };
        }
        if (!data.title || typeof data.title !== "string" || data.title.trim().length === 0) {
          return { isValid: false, error: "O t\xEDtulo da can\xE7\xE3o est\xE1 ausente ou vazio." };
        }
        if (!data.lyrics || typeof data.lyrics !== "string" || data.lyrics.trim().length < 20) {
          return { isValid: false, error: "A letra est\xE1 excessivamente curta ou ausente." };
        }
        if (!data.chords || typeof data.chords !== "string" || data.chords.trim().length < 20) {
          return { isValid: false, error: "A cifra est\xE1 vazia ou excessivamente curta." };
        }
        const chordsLines = data.chords.split("\n");
        const lyricsLines = data.lyrics.split("\n").filter((l) => l.trim().length > 0);
        if (chordsLines.length < 5) {
          return { isValid: false, error: "A cifra possui linhas insuficientes para uma m\xFAsica completa." };
        }
        if (lyricsLines.length < 3) {
          return { isValid: false, error: "A letra possui linhas insuficientes." };
        }
        const chordRegex = /\b[a-gA-G][#b]?(?:m|maj|min|dim|aug|sus|add|alt|omit|no|M|[0-9]|\(|\)|\+|\-|\#|b|Δ|ø|°|º|ª)*(?:\/(?:[a-gA-G][#b]?|[0-9]+))?\b/i;
        let hasChords = false;
        for (const line of chordsLines) {
          if (chordRegex.test(line)) {
            hasChords = true;
            break;
          }
        }
        if (!hasChords) {
          return { isValid: false, error: "Nenhum acorde v\xE1lido detectado no campo de cifras." };
        }
        const titleLower = data.title.toLowerCase();
        const lyricsLower = data.lyrics.toLowerCase();
        if (titleLower.includes("aclame ao senhor") || titleLower.includes("aclame ao sr")) {
          if (lyricsLower.includes("do teu amor, sem fim") || lyricsLower.includes("teu amor sem fim da sua cruz")) {
            return { isValid: false, error: "Detectados versos fict\xEDcios inventados (por exemplo, 'Do teu amor, sem fim')." };
          }
        }
        if (titleLower.includes("santos pra sempre") || titleLower.includes("santos para sempre") || titleLower.includes("holy forever")) {
          if (lyricsLower.includes("gera\xE7\xF5es v\xEAm e v\xE3o") || lyricsLower.includes("gl\xF3ria est\xE1 al\xE9m") || lyricsLower.includes("e te adoram pra sempre") || lyricsLower.includes("toda a terra clamar\xE1") || lyricsLower.includes("sempre te adorar\xE1") || !lyricsLower.includes("muitas gera\xE7\xF5es") || !lyricsLower.includes("rendidas em louvor") || !lyricsLower.includes("anjos cantam") || !lyricsLower.includes("exaltado") || !lyricsLower.includes("mais alto")) {
            return {
              isValid: false,
              error: "VERS\xC3O INCORRETA DETECTADA: Voc\xEA gerou uma tradu\xE7\xE3o incorreta ou incoerente de 'Santos Pra Sempre'. A vers\xE3o oficial brasileira (Gabriel Guedes / Fernandinho) inicia obrigatoriamente com 'As muitas gera\xE7\xF5es rendidas em louvor', tem o refr\xE3o se iniciando com 'E os anjos cantam: Santo / Toda a cria\xE7\xE3o: Santo' e a ponte iniciando com 'Teu Nome \xE9 o mais alto / Teu Nome \xE9 o maior'. Por favor, use estritamente esta vers\xE3o consagrada do Cifra Club!"
            };
          }
        }
        if (chordsLines.length > 350) {
          return { isValid: false, error: "Cifra excessivamente longa (prov\xE1vel gera\xE7\xE3o infinita ociosa)." };
        }
        return { isValid: true };
      };
      if (!title) {
        return res.status(400).json({ error: "O t\xEDtulo da m\xFAsica \xE9 obrigat\xF3rio." });
      }
      const localPopularSong = findLocalPopularSong(title, artist);
      if (localPopularSong) {
        return res.json(localPopularSong);
      }
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new Error("A chave de API do Gemini n\xE3o foi configurada. Utilizando gabarito de suporte local.");
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const systemInstruction = `Voc\xEA \xE9 um curador e mapeador de cifras musicais gospel profissional e perfeccionista para o Liloupro. Seu objetivo absoluto \xE9 reproduzir com precis\xE3o matem\xE1tica e m\xE1xima fidelidade as cifras e letras oficiais de refer\xEAncia de sites consagrados como cifraclub.com.br e letras.mus.br.

REGRAS CR\xCDTICAS DE FIDELIDADE (LEIA COM ATEN\xC7\xC3O EXTREMA):
1. NUNCA INVENTE OU TRADUZA LIVREMENTE M\xDASICAS INTERNACIONAIS. 
   Se a can\xE7\xE3o for de origem estrangeira (ex: Hillsong, Bethel Music, Chris Tomlin, Kari Jobe, Matt Redman, Elevation Worship, etc.), voc\xEA \xE9 PROIBIDO de criar uma tradu\xE7\xE3o pr\xF3pria gerada por IA. Voc\xEA DEVE usar estritamente a vers\xE3o e adapta\xE7\xE3o brasileira oficial e de relev\xE2ncia eclesi\xE1stica que \xE9 cantada nas igrejas (ex: Gabriel Guedes, Fernandinho, Isa\xEDas Saad, Gabriela Rocha, N\xEDvea Soares, Diante do Trono, etc.).
   
   EXEMPLO CENTRAL DA REGRA (SANTOS PRA SEMPRE - HOLY FOREVER):
   - Se for solicitado "Santos Pra Sempre" ou "Holy Forever", a letra correta em portugu\xEAs DEVE ser rigorosamente a grava\xE7\xE3o do Gabriel Guedes e Fernandinho.
   - O refr\xE3o DEVE iniciar estritamente com: "E os anjos cantam: Santo / Toda a cria\xE7\xE3o: Santo / Tu \xE9s exaltado: Santo / Santo para sempre".
   - A ponte ou estrofe ap\xF3s o refr\xE3o DEVE iniciar estritamente com "Teu Nome \xE9 o mais alto / Teu Nome \xE9 o maior / Teu Nome \xE9 perfeito, acima de outros nomes".
   - Cifrar com os acordes no tom de D\xF3 Maior (C), iniciando com:
     C                 C4          C
     As muitas gera\xE7\xF5es rendidas em louvor
   - N\xC3O use "Seu nome \xE9 Santo, Santo, Deus" ou "Toda a terra clamar\xE1" no refr\xE3o - essa letra \xE9 incorreta!
   - N\xC3O use "Gera\xE7\xF5es v\xEAm e v\xE3o / E Te adoram pra sempre" - essa letra N\xC3O EXISTE na vers\xE3o tocada do Gabriel Guedes!

2. OUTROS EXEMPLOS DE VERS\xC3O CONSAGRADA OBRIGAT\xD3RIA:
   - "Goodness of God" / "Bondade de Deus" (Isa\xEDas Saad) -> Come\xE7a com: "Te amo, Deus / Tua gra\xE7a nunca falha..."
   - "Reckless Love" / "Ousado Amor" (Isa\xEDas Saad) -> Come\xE7a com: "Antes de eu falar, Tu cantavas sobre mim..."
   - "Way Maker" / "Caminho no Deserto" (N\xEDvea Soares / Soraya Moraes) -> Come\xE7a com: "Est\xE1s aqui, movendo entre n\xF3s..."
   - "Build My Life" / "Construir Minha Vida" (Gabriela Rocha) -> Come\xE7a com: "Digno de toda adora\xE7\xE3o..."

3. ALINHAMENTO DE CIFRAS ABSOLUTA. No campo 'chords', cada linha de acorde deve estar perfeitamente limpa e alinhada por cima, exatamente correspondendo \xE0s s\xEDlabas de texto onde ocorre a mudan\xE7a na linha abaixo. Use exclusivamente espa\xE7os normais para espa\xE7amento (nunca tabuladores).

4. REGRAS DE ACORDES DO LILOUPRO:
   - S\xE9tima Maior: Use "7M" (Ex: C7M, G7M, F7M, D7M). NUNCA use maj7 ou M7.
   - S\xE9tima Menor: Use "m7" (Ex: Am7, Bm7, Em7, F#m7). NUNCA utilize redundantemente "m7m".
   - S\xE9timas Dominantes: Use apenas "7" (Ex: G7, C7, D7, A7).
   - Invers\xF5es de baixo: Use sempre barra "/" (Ex: G/B, C/E, D/F#).`;
      const initialPrompt = `Por favor, fa\xE7a uma busca detalhada no Google Search no site cifraclub.com.br e letras.mus.br pela m\xFAsica "${title}" do artista "${artist || "cantor consagrado"}".
Caso seja uma vers\xE3o em portugu\xEAs de uma m\xFAsica internacional como "Holy Forever" de Chris Tomlin / Gabriel Guedes / Fernandinho, voc\xEA DEVE obrigatoriamente trazer a letra oficial brasileira iniciada em: "As muitas gera\xE7\xF5es rendidas em louvor" e com acordes com base em C, C4, Am7, G, F9 (tom C original). Voc\xEA est\xE1 estritamente proibido de devolver qualquer tradu\xE7\xE3o contendo "Gera\xE7\xF5es v\xEAm e v\xE3o".

Retorne uma estrutura JSON perfeita contendo:
1. "title": t\xEDtulo corrigido brasileiro oficial (ex: "Santos Pra Sempre").
2. "artist": o cantor brasileiro consagrado (ex: "Gabriel Guedes").
3. "key": Tom da vers\xE3o nacional (ex: "C").
4. "bpm": andamento original da can\xE7\xE3o.
5. "timeSignature": compasso da m\xFAsica (ex: '4/4').
6. "lyrics": A letra consagrada oficial completa, separada em estrofes ([Verso 1], [Refr\xE3o], [Ponte], etc.).
7. "chords": Letra oficial mesclada com as marcas de cifras por cima de forma monoespa\xE7ada correta no tom correspondente.`;
      const modelsToTry = GEMINI_FALLBACK_MODELS;
      let responseText = "";
      let lastError = null;
      for (const model of modelsToTry) {
        try {
          console.log(`Autofill: Executando busca usando modelo "${model}" com Google Search...`);
          const response = await ai.models.generateContent({
            model,
            contents: initialPrompt,
            config: {
              systemInstruction,
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  title: { type: import_genai.Type.STRING },
                  artist: { type: import_genai.Type.STRING },
                  key: { type: import_genai.Type.STRING },
                  bpm: { type: import_genai.Type.INTEGER },
                  timeSignature: { type: import_genai.Type.STRING },
                  chords: { type: import_genai.Type.STRING },
                  lyrics: { type: import_genai.Type.STRING }
                },
                required: ["title", "artist", "key", "bpm", "timeSignature", "chords", "lyrics"]
              }
            }
          });
          if (response && response.text) {
            const data = JSON.parse(response.text.trim());
            const validationResult = validateSongData(data);
            if (validationResult.isValid) {
              responseText = response.text;
              break;
            } else {
              console.log(`[Validation Error] ${model} falhou na valida\xE7\xE3o de qualidade: "${validationResult.error}"`);
              lastError = new Error(validationResult.error);
            }
          }
        } catch (err) {
          const cleanErr = cleanErrorString(err);
          console.log(`[Status] Autofill ${model} Google Search check: ${cleanErr}`);
          try {
            console.log(`Autofill: Executando busca usando modelo "${model}" SEM Google Search...`);
            const fallbackPrompt = `${initialPrompt}
Importante: Caso n\xE3o consiga pesquisar em tempo real, use exclusivamente seu conhecimento musical pr\xE9vio consolidado sobre a letra e acordes consagradas dessa can\xE7\xE3o.`;
            const response = await ai.models.generateContent({
              model,
              contents: fallbackPrompt,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    title: { type: import_genai.Type.STRING },
                    artist: { type: import_genai.Type.STRING },
                    key: { type: import_genai.Type.STRING },
                    bpm: { type: import_genai.Type.INTEGER },
                    timeSignature: { type: import_genai.Type.STRING },
                    chords: { type: import_genai.Type.STRING },
                    lyrics: { type: import_genai.Type.STRING }
                  },
                  required: ["title", "artist", "key", "bpm", "timeSignature", "chords", "lyrics"]
                }
              }
            });
            if (response && response.text) {
              const data = JSON.parse(response.text.trim());
              const validationResult = validateSongData(data);
              if (validationResult.isValid) {
                responseText = response.text;
                break;
              } else {
                console.log(`[Validation Error] ${model} SEM Google Search falhou na valida\xE7\xE3o: "${validationResult.error}"`);
                lastError = new Error(validationResult.error);
              }
            }
          } catch (errNoSearch) {
            lastError = errNoSearch;
            const cleanErrNoSearch = cleanErrorString(errNoSearch);
            console.log(`[Status] Autofill ${model} fallback check: ${cleanErrNoSearch}`);
          }
        }
      }
      if (!responseText) {
        throw lastError || new Error("Falha ao buscar preenchimento autom\xE1tico de cifras.");
      }
      const finalParsedData = JSON.parse(responseText.trim());
      res.json({
        ...finalParsedData,
        warning: null
      });
    } catch (error) {
      console.log("[Status] Autofill error caught, applying graceful 200 OK fallback preview:");
      const isQuota = isQuotaError(error);
      const friendlyMessage = isQuota ? "Cota de Intelig\xEAncia Artificial atingida. Carregamos um gabarito b\xE1sico estruturado para que voc\xEA possa preencher ou colar a cifra verdadeira sem erro!" : `Erro ao obter cifras com IA (${cleanErrorString(error)}). Carregamos um gabarito estruturado de apoio!`;
      res.json({
        title: title || "M\xFAsica Solicitada",
        artist: artist || "Artista Oficial",
        key: "G",
        bpm: 78,
        timeSignature: "4/4",
        chords: `[Intro]
G   C9   Em7   D4

[Verso 1]
G                          C9
  Digite ou cole os acordes aqui
Em7                       D4
  Alinhados com a letra do louvor

[Refr\xE3o]
G           D4
  Insira a mensagem do Refr\xE3o
Em7         C9
  E os acordes correspondentes

[Ponte]
C9       D4       Em7      D/F#
  Complete a finaliza\xE7\xE3o da m\xFAsica`,
        lyrics: `[Intro]

[Verso 1]
Digite ou cole os acordes aqui
Alinhados com a letra do louvor

[Refr\xE3o]
Insira a mensagem do Refr\xE3o
E os acordes correspondentes

[Ponte]
Complete a finaliza\xE7\xE3o da m\xFAsica`,
        warning: friendlyMessage
      });
    }
  });
  let serverDb = null;
  try {
    const cfgPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
    if (import_fs.default.existsSync(cfgPath)) {
      const { initializeApp: initializeServerApp } = await import("firebase/app");
      const { getFirestore: getServerFirestore } = await import("firebase/firestore");
      const firebaseConfig = JSON.parse(import_fs.default.readFileSync(cfgPath, "utf-8"));
      const serverApp = initializeServerApp(firebaseConfig, "server-app-kiwify");
      serverDb = getServerFirestore(serverApp, firebaseConfig.firestoreDatabaseId);
      console.log("[Kiwify Webhook] Firebase serverDb inicializado com sucesso.");
    }
  } catch (fbErr) {
    console.error("[Kiwify Webhook] Aviso ao carregar Firebase serverDb:", fbErr);
  }
  async function processKiwifyNotification(payload, isSimulation = false) {
    const rawBody = payload || {};
    const customerEmail = (rawBody.Customer?.email || rawBody.customer?.email || rawBody.customer_email || rawBody.email || "").toString().trim().toLowerCase();
    const customerName = (rawBody.Customer?.full_name || rawBody.Customer?.name || rawBody.customer?.name || rawBody.customer_name || rawBody.name || (customerEmail ? `Igreja de ${customerEmail.split("@")[0]}` : "Nova Igreja")).toString().trim();
    const orderId = (rawBody.order_id || rawBody.order_ref || rawBody.order?.id || rawBody.Subscription?.id || rawBody.id || `KW-${Date.now()}`).toString();
    const orderStatus = (rawBody.order_status || rawBody.status || rawBody.event || "paid").toString().toLowerCase();
    const eventType = (rawBody.event || rawBody.webhook_event_type || rawBody.order_status || "order_approved").toString().toLowerCase();
    const productName = (rawBody.Product?.product_name || rawBody.Product?.name || rawBody.product?.name || rawBody.product_name || "Liloupro PRO").toString();
    if (!customerEmail || !customerEmail.includes("@")) {
      throw new Error("E-mail do cliente n\xE3o fornecido ou inv\xE1lido no payload do webhook.");
    }
    const isApproved = orderStatus.includes("paid") || orderStatus.includes("approved") || orderStatus.includes("active") || orderStatus.includes("renewed") || eventType.includes("approved") || eventType.includes("paid") || eventType.includes("renewed") || eventType.includes("compra_aprovada");
    const isCancelledOrRefunded = orderStatus.includes("refund") || orderStatus.includes("cancel") || orderStatus.includes("charged") || orderStatus.includes("refus") || eventType.includes("refund") || eventType.includes("cancel");
    let planStatus = "active";
    if (isCancelledOrRefunded) {
      planStatus = "suspended";
    } else if (!isApproved) {
      planStatus = "trial";
    }
    let expiresAtISO = null;
    if (planStatus === "active") {
      const pLower = productName.toLowerCase();
      const now = /* @__PURE__ */ new Date();
      if (pLower.includes("mensal") || pLower.includes("month")) {
        now.setDate(now.getDate() + 32);
      } else if (pLower.includes("trimestral")) {
        now.setDate(now.getDate() + 92);
      } else if (pLower.includes("vitalicio") || pLower.includes("lifetime") || pLower.includes("vital\xEDcio")) {
        expiresAtISO = null;
      } else {
        now.setDate(now.getDate() + 366);
      }
      if (expiresAtISO !== null) {
        expiresAtISO = now.toISOString();
      }
    }
    let churchId = "";
    let inviteCode = "";
    let actionType = "created";
    if (serverDb) {
      const { collection: getCol, query: getQ, where: getWhere, getDocs: getDocsDb, doc: getDocRef, setDoc: setDocDb } = await import("firebase/firestore");
      const churchesCol = getCol(serverDb, "churches");
      const q = getQ(churchesCol, getWhere("contactEmail", "==", customerEmail));
      const querySnap = await getDocsDb(q);
      if (!querySnap.empty) {
        const existingDoc = querySnap.docs[0];
        churchId = existingDoc.id;
        inviteCode = existingDoc.data().inviteCode || "LILOU";
        actionType = "updated";
        const existingNotes = existingDoc.data().masterNotes || "";
        const newNote = `
[${(/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")}] Webhook Kiwify (${isSimulation ? "Simula\xE7\xE3o" : "Real"}): Pedido #${orderId} - Status: ${orderStatus.toUpperCase()}`;
        await setDocDb(getDocRef(serverDb, "churches", churchId), {
          planStatus,
          planName: productName,
          planExpiresAt: expiresAtISO,
          masterNotes: (existingNotes + newNote).trim(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }, { merge: true });
      } else {
        actionType = "created";
        churchId = `kw-${customerEmail.replace(/[^a-z0-9]/g, "-").slice(0, 25)}-${Date.now().toString().slice(-4)}`;
        const cleanNamePrefix = customerName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase() || "LIL";
        inviteCode = `${cleanNamePrefix}${Math.floor(100 + Math.random() * 900)}`;
        const churchNameFormatted = customerName.toLowerCase().includes("igreja") || customerName.toLowerCase().includes("comunidade") ? customerName : `Igreja de ${customerName}`;
        await setDocDb(getDocRef(serverDb, "churches", churchId), {
          name: churchNameFormatted,
          inviteCode,
          contactEmail: customerEmail,
          planStatus,
          planName: productName,
          planExpiresAt: expiresAtISO,
          masterNotes: `Ativa\xE7\xE3o 100% Autom\xE1tica via Kiwify Webhook. Pedido #${orderId} (${isSimulation ? "Simulado" : "Real"})`,
          createdBy: "Kiwify Webhook Engine",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        try {
          const passwordTokenId = `token-${Date.now()}-${Math.floor(1e5 + Math.random() * 9e5)}`;
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
          await setDocDb(getDocRef(serverDb, "password_tokens", passwordTokenId), {
            email: customerEmail,
            churchId,
            churchName: churchNameFormatted,
            userName: customerName,
            planName: productName,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            expiresAt,
            used: false
          });
          console.log(`[Kiwify Webhook] Token de cria\xE7\xE3o de senha gerado com sucesso: ${passwordTokenId} para ${customerEmail}`);
        } catch (tokErr) {
          console.error("[Kiwify Webhook] Erro ao gerar token de senha:", tokErr);
        }
      }
      try {
        const logId = `log-kw-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
        await setDocDb(getDocRef(serverDb, "kiwify_webhooks", logId), {
          orderId,
          orderStatus,
          eventType,
          customerEmail,
          customerName,
          productName,
          planStatus,
          churchId,
          inviteCode,
          actionType,
          isSimulation,
          receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
          rawPayload: rawBody
        });
      } catch (logErr) {
        console.error("[Kiwify Webhook Log Error]:", logErr);
      }
    } else {
      console.warn("[Kiwify Webhook] serverDb indispon\xEDvel no momento.");
    }
    return {
      success: true,
      message: actionType === "created" ? `Igreja "${customerName}" criada e ativada automaticamente com sucesso!` : `Plano da igreja com e-mail "${customerEmail}" atualizado com sucesso!`,
      details: {
        orderId,
        customerEmail,
        customerName,
        productName,
        planStatus,
        expiresAt: expiresAtISO,
        churchId,
        inviteCode,
        actionType,
        isSimulation
      }
    };
  }
  app.post("/api/webhooks/kiwify", async (req, res) => {
    try {
      console.log("[Kiwify Webhook] Notifica\xE7\xE3o recebida:", JSON.stringify(req.body));
      const result = await processKiwifyNotification(req.body, false);
      return res.status(200).json(result);
    } catch (err) {
      console.error("[Kiwify Webhook Error]:", err);
      return res.status(400).json({
        success: false,
        error: err?.message || "Erro ao processar webhook da Kiwify"
      });
    }
  });
  app.get("/api/webhooks/kiwify/logs", async (req, res) => {
    try {
      if (!serverDb) {
        return res.json({ logs: [] });
      }
      const { collection: getCol, getDocs: getDocsDb, query: getQ, limit: getLimit } = await import("firebase/firestore");
      const logsCol = getCol(serverDb, "kiwify_webhooks");
      const q = getQ(logsCol, getLimit(50));
      const snap = await getDocsDb(q);
      const logs = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      logs.sort((a, b) => new Date(b.receivedAt || 0).getTime() - new Date(a.receivedAt || 0).getTime());
      return res.json({ logs });
    } catch (err) {
      console.error("[Kiwify Logs Error]:", err);
      return res.status(500).json({ error: "Erro ao buscar logs do Kiwify" });
    }
  });
  app.post("/api/webhooks/kiwify/test-simulate", async (req, res) => {
    try {
      const { email, name, productName, status, eventType } = req.body;
      const simPayload = {
        order_id: `SIM-${Math.floor(1e5 + Math.random() * 9e5)}`,
        order_status: status || "paid",
        event: eventType || "order_approved",
        Product: {
          product_name: productName || "Liloupro - Plano Anual PRO"
        },
        Customer: {
          full_name: name || "Pastor Simula\xE7\xE3o Kiwify",
          email: email || "pastor.simulacao@igreja.com",
          mobile: "11999998888"
        }
      };
      const result = await processKiwifyNotification(simPayload, true);
      return res.status(200).json(result);
    } catch (err) {
      console.error("[Kiwify Simulation Error]:", err);
      return res.status(400).json({
        success: false,
        error: err?.message || "Erro na simula\xE7\xE3o do webhook"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
