import type { Book } from '../types/api';
import { normalize } from './storefront';

// Textos da prévia de leitura do Gabinete 3D. Tudo aqui é puro (sem React e sem canvas).
//
// Para cadastrar a prévia de outro livro, acrescente uma entrada em PREVIEWS usando o
// título sem acentos e em minúsculas como chave. Livros sem prévia cadastrada recebem
// uma "nota da edição" montada com os dados do próprio livro.

/** Quantas páginas qualquer visitante pode ler antes do convite para assinar. */
export const FREE_PAGES = 3;

export type PreviewBlock =
  | { type: 'chapter'; number: string; title: string }
  | { type: 'paragraph'; text: string };

export interface BookPreview {
  blocks: PreviewBlock[];
  /** Texto curto da página final, depois do último trecho disponível. */
  closing: string;
}

const p = (text: string): PreviewBlock => ({ type: 'paragraph', text });
const chapter = (number: string, title: string): PreviewBlock => ({
  type: 'chapter',
  number,
  title,
});

// Machado de Assis, "Dom Casmurro" (1899) — obra em domínio público.
const DOM_CASMURRO: BookPreview = {
  closing: 'Fim do trecho disponível nesta demonstração.',
  blocks: [
    chapter('Capítulo primeiro', 'Do título'),
    p(
      'Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu. Cumprimentou-me, sentou-se ao pé de mim, falou da Lua e dos ministros, e acabou recitando-me versos. A viagem era curta, e os versos pode ser que não fossem inteiramente maus. Sucedeu, porém, que, como eu estava cansado, fechei os olhos três ou quatro vezes; tanto bastou para que ele interrompesse a leitura e metesse os versos no bolso.',
    ),
    p('— Continue, disse eu acordando.'),
    p('— Já acabei, murmurou ele.'),
    p('— São muito bonitos.'),
    p(
      'Vi-lhe fazer um gesto para tirá-los outra vez do bolso, mas não passou do gesto; estava amuado. No dia seguinte entrou a dizer de mim nomes feios, e acabou alcunhando-me Dom Casmurro. Os vizinhos, que não gostam dos meus hábitos reclusos e calados, deram curso à alcunha, que afinal pegou. Nem por isso me zanguei. Contei a anedota aos amigos da cidade, e eles, por graça, chamam-me assim, alguns em bilhetes: “Dom Casmurro, domingo vou jantar com você.” — “Vou para Petrópolis, Dom Casmurro; a casa é a mesma da Renânia; vê se deixas essa caverna do Engenho Novo, e vai lá passar uns quinze dias comigo.” — “Meu caro Dom Casmurro, não cuide que o dispenso do teatro amanhã; venha e dormirá aqui na cidade; dou-lhe camarote, dou-lhe chá, dou-lhe cama; só não lhe dou moça.”',
    ),
    p(
      'Não consultes dicionários. Casmurro não está aqui no sentido que eles lhe dão, mas no que lhe pôs o vulgo de homem calado e metido consigo. Dom veio por ironia, para atribuir-me fumos de fidalgo. Tudo por estar cochilando! Também não achei melhor título para a minha narração; se não tiver outro daqui até ao fim do livro, vai este mesmo. O meu poeta do trem ficará sabendo que não lhe guardo rancor. E com pequeno esforço, sendo o título seu, poderá cuidar que a obra é sua. Há livros que apenas terão isso dos seus autores; alguns nem tanto.',
    ),
    chapter('Capítulo II', 'Do livro'),
    p(
      'Agora que expliquei o título, passo a escrever o livro. Antes disso, porém, digamos os motivos que me põem a pena na mão.',
    ),
    p(
      'Vivo só, com um criado. A casa em que moro é própria; fi-la construir de propósito, levado de um desejo tão particular que me vexa imprimi-lo, mas vá lá. Um dia, há bastantes anos, lembrou-me reproduzir no Engenho Novo a casa em que me criei na antiga Rua de Mata-cavalos, dando-lhe o mesmo aspecto e economia daquela outra, que desapareceu. Construtor e pintor entenderam bem as indicações que lhes fiz: é o mesmo prédio assobradado, três janelas de frente, varanda ao fundo, as mesmas alcovas e salas. Na principal destas, a pintura do teto e das paredes é mais ou menos igual, umas grinaldas de flores miúdas e grandes pássaros que as tomam nos bicos, de espaço a espaço. Nos quatro cantos do teto as figuras das estações, e ao centro das paredes os medalhões de César, Augusto, Nero e Massinissa, com os nomes por baixo... Não alcanço a razão de tais personagens. Quando fomos para a casa de Mata-cavalos, já ela estava assim decorada; vinha do decênio anterior. Naturalmente era gosto do tempo meter sabor clássico e figuras antigas em pinturas americanas. O mais é também análogo e parecido. Tenho chacarinha, flores, legume, uma casuarina, um poço e lavadouro. Uso louça velha e mobília velha. Enfim, agora, como outrora, há aqui o mesmo contraste da vida interior, que é pacata, com a exterior, que é ruidosa.',
    ),
    p(
      'O meu fim evidente era atar as duas pontas da vida, e restaurar na velhice a adolescência. Pois, senhor, não consegui recompor o que foi nem o que fui. Em tudo, se o rosto é igual, a fisionomia é diferente. Se só me faltassem os outros, vá; um homem consola-se mais ou menos das pessoas que perde; mas falto eu mesmo, e esta lacuna é tudo. O que aqui está é, mal comparando, semelhante à pintura que se põe na barba e nos cabelos, e que apenas conserva o hábito externo, como se diz nas autópsias; o interno não aguenta tinta. Uma certidão que me desse vinte anos de idade poderia enganar os estranhos, como todos os documentos falsos, mas não a mim. Os amigos que me restam são de data recente; todos os antigos foram estudar a geologia dos campos-santos. Quanto às amigas, algumas datam de quinze anos, outras de menos, e quase todas creem na mocidade. Duas ou três fariam crer nela aos outros, mas a língua que falam obriga muita vez a consultar os dicionários, e tal frequência é cansativa.',
    ),
    p(
      'Entretanto, vida diferente não quer dizer vida pior; é outra coisa. A certos respeitos, aquela vida antiga aparece-me despida de muitos encantos que lhe achei; mas é também exato que perdeu muito espinho que a fez molesta, e, de memória, conservo alguma recordação doce e feiticeira. Em verdade, pouco apareço e menos falo. Distrações raras. O mais do tempo é gasto em hortar, jardinar e ler; como bem e não durmo mal.',
    ),
    p(
      'Ora, como tudo cansa, esta monotonia acabou por exaurir-me também. Quis variar, e lembrou-me escrever um livro.',
    ),
    chapter('Capítulo III', 'A denúncia'),
    p(
      'Ia entrar na sala de visitas, quando ouvi proferir o meu nome e escondi-me atrás da porta. A casa era a da Rua de Mata-cavalos, o mês novembro, o ano é que é um tanto remoto, mas eu não hei de trocar as datas à minha vida só para agradar às pessoas que não amam histórias velhas; o ano era de 1857.',
    ),
    p(
      '— D. Glória, a senhora persiste na ideia de meter o nosso Bentinho no seminário? É mais que tempo, e já agora pode haver uma dificuldade.',
    ),
    p('— Que dificuldade?'),
    p('— Uma grande dificuldade.'),
    p(
      'Minha mãe quis saber o que era. José Dias, depois de alguns instantes de concentração, veio ver se havia alguém no corredor; não deu por mim, voltou e, abafando a voz, disse que a dificuldade estava na casa ao pé, a gente do Pádua.',
    ),
    p('— A gente do Pádua?'),
    p(
      '— Há algum tempo estou para lhe dizer isto, mas não me atrevia. Não me parece bonito que o nosso Bentinho ande metido nos cantos com a filha do Tartaruga, e esta é a dificuldade, porque se eles pegam de namoro, a senhora terá muito que lutar para separá-los.',
    ),
  ],
};

// Machado de Assis, "O Alienista" (1882) — obra em domínio público.
const O_ALIENISTA: BookPreview = {
  closing: 'Fim do trecho disponível nesta demonstração.',
  blocks: [
    chapter('Capítulo I', 'De como Itaguaí ganhou uma casa de orates'),
    p(
      'As crônicas da vila de Itaguaí dizem que em tempos remotos vivera ali um certo médico, o Dr. Simão Bacamarte, filho da nobreza da terra e o maior dos médicos do Brasil, de Portugal e das Espanhas. Estudara em Coimbra e Pádua. Aos trinta e quatro anos regressou ao Brasil, não podendo el-rei alcançar dele que ficasse em Coimbra, regendo a universidade, ou em Lisboa, expedindo os negócios da monarquia.',
    ),
    p('— A ciência, disse ele a Sua Majestade, é o meu emprego único; Itaguaí é o meu universo.'),
    p(
      'Dito isto, meteu-se em Itaguaí, e entregou-se de corpo e alma ao estudo da ciência, alternando as curas com as leituras, e demonstrando os teoremas com cataplasmas. Aos quarenta anos casou com D. Evarista da Costa e Mascarenhas, senhora de vinte e cinco anos, viúva de um juiz de fora, e não bonita nem simpática.',
    ),
  ],
};

const PREVIEWS: Record<string, BookPreview> = {
  'dom casmurro': DOM_CASMURRO,
  'o alienista': O_ALIENISTA,
};

/** Prévia genérica para livros ainda sem trecho cadastrado. */
function editorialNote(book: Book): BookPreview {
  const year = book.publishedYear ? `, publicado em ${book.publishedYear}` : '';
  return {
    closing: 'Fim da nota da edição.',
    blocks: [
      chapter('Nota da edição', book.title),
      p(
        `Esta é a prévia de ${book.title}, de ${book.author}${year}. O trecho de leitura deste título ainda está sendo preparado pela nossa equipe editorial, e enquanto isso deixamos aqui algumas palavras sobre a edição que chega até você.`,
      ),
      p(
        'Cada exemplar do acervo BookWise passa pelas mãos de quem cuida da loja antes de seguir para a estante: conferimos a costura, o corte das páginas e a firmeza da capa. É o mesmo livro que você acabou de girar no gabinete, agora aberto para uma primeira conversa.',
      ),
      p(
        'Folhear antes de levar é um hábito antigo das livrarias de bairro, e foi pensando nele que criamos esta sala de leitura. Leia com calma, volte quando quiser e, se a história pedir mais tempo, o plano de assinatura libera o livro inteiro, sem pressa e sem marcador perdido.',
      ),
      p(
        'Os assinantes leem todas as páginas de todos os títulos do acervo digital, guardam o ponto onde pararam e recebem as novidades da curadoria antes de chegarem às prateleiras.',
      ),
    ],
  };
}

export function previewFor(book: Book): BookPreview {
  return PREVIEWS[normalize(book.title).trim()] ?? editorialNote(book);
}
