// Windows icons as pixel rows, one letter per pixel, so the page can draw
// them in text (see pixelRows in buffer.js). '.' is transparent; every other
// letter is a colour of PALETTE. Straight pixel dumps of the .ico files,
// nothing hand-edited: regenerate them if an icon changes, with
// scripts/ico_to_rows.py.

// The icons' own 16-colour Windows palette, kept as is. Swap the values here
// to tint every drawing at once.
export const PALETTE = {
  k: '#000000', // black
  w: '#ffffff', // white
  s: '#808080', // grey
  S: '#c0c0c0', // silver
  r: '#800000', // maroon
  R: '#ff0000', // red
  o: '#808000', // olive
  y: '#ffff00', // yellow
  g: '#008000', // green
  G: '#00ff00', // lime
  t: '#008080', // teal
  c: '#00ffff', // cyan
  n: '#000080', // navy
  b: '#0000ff', // blue
  p: '#800080', // purple
  m: '#ff00ff', // fuchsia
}

// public/favicon.ico: a tree.
export const TREE = [
  '..........gggggggggggg..........',
  '.......gggwgwgGgwgggggggGg......',
  '....gggwgygGgygggGgGgGgGgGg.....',
  '...gwGgGgGgyggggggggGgGggggg....',
  '..gwggggwgggGgGggGGgGggggggggg..',
  '.gwgGygggGgggggGgggggGgGggGgGgg.',
  'gGgGggGgGgGgGgGgggGGgGgggggggggg',
  'ggGygggggggggggGggggggGgGgGgggGk',
  'gwggggGgggGgggGggGgGgggggGgGggkk',
  'ggwGgggggGggggggggggGgGgGggggkgk',
  '.gggGgGgGgGggGgggGgggggggggGkgkk',
  '.gGggggggGgggGGgGgggGgggGgkggkk.',
  '..ggGgggGgggGggGgggGgGgkgkgkkgk.',
  '...kGgGgggGgGgggGgGgggGkkgkgkk..',
  '....kkokkGgggGggggggkgkgkkgkk...',
  '......krkkkkggggggGkgkgkkkk.....',
  '.......ork..kkkokgkkkkkkk.......',
  '........ork..rrkkk..orkk........',
  '.........ork.oork..orkk.........',
  '..........orkookk.orkk..........',
  '...........oroorkorkk...........',
  '............oookkrkk............',
  '.............oorkkk.............',
  '.............ookkk..............',
  '.............oork...............',
  '.............ookk...............',
  '.............oork...............',
  '.............ookk...............',
  '.............oork...............',
  '.............ookrk..............',
  '............ookrkrk.............',
  '...........kkkkkkkkk............',
]

// icons/portfolio.ico: a computer with a globe.
export const PORTFOLIO = [
  '..............sssssssg........',
  '............sswSSSGGgggb......',
  '..........ssSwGGGGgggggbbb....',
  '.........swGwGgGggggggbbbbk...',
  '...sssssssssswGggbbgbbbbbbnk..',
  '..sSSSSSSSSSskggbbbbbgbbbbnk..',
  '.sSSSSSSSSSsskgbbbbbgGgbbnngk.',
  'swwwwwwwwwssskbbbbbgGgnbnggGk.',
  'sSSSSSSSSSssskbbbggbgnbngGSGgk',
  'sSSSSSSSSSsskkbbbssbnbnbgSGggk',
  'sSSSSSSSSSskSkbbsSSssnggSGgGgk',
  'sssssssssskSskbbsSkSSssSGgGggk',
  'swwwwwwwwwSsskbsSkbkkSSssGgggk',
  'sSSSSSSSSSssskbsSkbcbkkSSssgkk',
  'sSSSSSSSSSsskksSkbbbbbbkkSSssk',
  'sSSSSSSSSSskSksSkbbbbbbbbkwSsk',
  'sssssssssskSssSkbbbbbbbbbwSSsk',
  'swwwwwwwwwSsssSkbbbbbbbbbwSsk.',
  'sSSSSSSSSSsssSSSwbbbbbbbwSSsk.',
  'sSSSSSSSSSsssksSSwwbbbbbwSsk..',
  'sSSSSSSGgSsssskksSSwwbbwSsk...',
  'sSSSSSSSSsswwSSskksSSwwSSsk...',
  '.kkkkkkssSSskwwSSskksSSSsk....',
  '.....ssSSsskwskwwSSskksSsk....',
  '.....swwskwsskwskwwSSskkkk....',
  '.....ssswwskwsskwskwSSSssk....',
  '.....kkssswwskwsskSSSssssk....',
  '.......kkssswwskSSSsssskk.....',
  '.........kkssswwSsssskk.......',
  '...........kksssssskk.........',
  '.............kksskk...........',
  '...............kk.............',
]

// icons/pifmgr/pifmgr_037.ico (from pifmgr.dll): a shield and a sword.
export const SHIELD = [
  '...oooooooo......ss.............',
  '..ooyyyyyyyo....swws..........sk',
  '.ooykkkkkkkyk.sswwSwsss.....sssk',
  '.oyk.oSsoksoykwwSwSSwwwssssswwsk',
  'oyk..owyokwwoykSnwSnSSSwwwwwSSsk',
  'oyk..owyokSSoyknbwSnnnnSSSSSnSsk',
  'oyk..owyoknnoykbpwSnbRbnnnnnbSsk',
  '.oyk.owyokboykbpbwSnRbRbRbRbRSsk',
  '..ookooooookkbpbpwSnbRbRbRbRbSsk',
  '....kkkkkkkkbpbpbwSnRbRbRbRbRSsk',
  '.....swSskpbpbpbpwSnbRbRbRbRbSsk',
  '.....swSskbpbpbpbwSnRbRbRbRbRSsk',
  '.....swSskpbpbpbpwSnbRbRbRbRbSsk',
  '.....swSskbpbpbpbwSnRbRbRbRbRSsk',
  '.....swSskpbpbpbpwSnbRbRbRbRbSsk',
  '.....swSskwwwwwwwwwwwwwwwwwwwSsk',
  '.....swSskSSSSSSSwSSSSSSSSSSSSsk',
  '.....swSsknnnnnnnwSnnnnnnnnnSSsk',
  '.....swSskbRbRbRbwSnpbpbpbpbSssk',
  '.....swSskRbRbRbRwSnbpbpbpbsSsk.',
  '.....swSskbRbRbRbwSnpbpbpbpSSsk.',
  '.....swSskRbRbRbRwSnbpbpbpbSssk.',
  '.....swSsknRbRbRbwSnpbpbpbsSsk..',
  '.....swSsknbRbRbRwSnbpbpbpSSsk..',
  '.....swSskSnbRbRbwSnpbpbpSSsk...',
  '.....swSskwSnnRbRwSnbpbpSSsk....',
  '.....swSskswSSnnbwSnpbSSSsk.....',
  '.....swSsk.swwSSnwSnSSSssk......',
  '.....swSsk..sswwSwSSSsskk.......',
  '.....swSsk....sswwSsskk.........',
  '......sSk.......ssskk...........',
  '.......k..........k.............',
]

// icons/100.ico: a globe on its stand.
export const GLOBE = [
  '..........SSSmmccmmSS.....oo......',
  '........SccccccmmcccccS..ooSo.....',
  '......SmcccccmmccmmccccSkowySo....',
  '.....SScsmccmccccccmmcssskowySo...',
  '....ScccccsmccccccccsmGGSskoyyo...',
  '...ScccccmccscccccssGGmGGSskyySo..',
  '..SSccccmccccscccsGGGGGmGSskoyyo..',
  '..SmSccmcccccwswscGGGGGGmGStkoySo.',
  '.SGGmcmcccccwcwswccGGGGGGmStpkoyo.',
  'SGGGGmcccccwcwswswccGGGGGsStpkoySo',
  'SGGGmcScccwcwswcwscccGGGscstpkoyyo',
  'SGGsGcmScwcwswcwcwmgggggscstptkooo',
  'SGGmGccmwcwswcwcwcgmgggsccSpttkooo',
  'sGsGGGccmwswcwcwccggmgsggcSpttkook',
  'mGmGGGcccmwcwcwcccgggmggggSpttkook',
  'SmcGGGccscmwcwccccggmgmgggptptkook',
  'Smcccccscccmccccccgmgggmggptptkook',
  'mcmcccscccccmcccccmgggggmgpttpkook',
  'mccmcscccccccmcccmcgggggtptttpkook',
  'Sccmscccccccccmcmccgggggpspttkoook',
  'Sccgmgggggcccccmccccgggtpspsskook.',
  '.scsgmggggggccscmcccggtpssspskook.',
  '..ssSgmgggggsscccmScctptssspkook..',
  '...sssgmgggscccccctccptttsskoook..',
  '...kssSgmgcccccccctpptttttnkook...',
  '..ooksssgmttcccSttpttppttnkoook...',
  '.oyyokssssSttSStpptttttppkoook....',
  '.oSwyokssssSSppptttttttnkoook.....',
  '..oywyokkpppptttpptttnkkoook......',
  '...oSyyyokttttttttnkkkooook.......',
  '....ooSyyokkkkkkkkkkooookk........',
  '......ooSyyoooooooooookk..........',
  '........ooyyooooooookk............',
  '..........oookkkkkkk..............',
  '.............koook................',
  '............koooook...............',
  '.........ookywoooookkk............',
  '.......oowwywyyyooooookk..........',
  '.....oowwoowywyyyoookkookk........',
  '...oowwwywyooookkkkkooooookk......',
  '.oowooywwywywyyyyyoooooookkokk....',
  'owwwwyooowywyyyyyyyoookkkoooook...',
  'owwwywywyoooooookkkkkkoooooookk...',
  'kooywywywywyyyyyyyyyoooooookkkk...',
  '.kkoooywywywyyyyyyyyyooookkkkk....',
  '...kkkooooooooooookkkkkkkkkk......',
  '......kkkkkkkkkkkkkkkkkkk.........',
]

// icons/pifmgr/pifmgr_011.ico (from pifmgr.dll): a column.
export const COLUMN = [
  '....sssssssssssssssssss....',
  '..sswwwwwwwwwwwwwwwwwwwss..',
  '.swwSSSwSwSwSwSwSwSwSSSSSk.',
  '.swSsssSSSSSSSSSSSSSssswSk.',
  'swSswwwkSsSsSsSsSsSkwwwswSk',
  'swSsSSSwkssssssssskSwSSswSk',
  'swSsSwswkkkkkkkkkkkwsSSswSk',
  '.swSssSwkwwwwwwwSSkSwsswSk.',
  '.swSwwSwkSswSswSsSkSSwwSSk.',
  '..kwSSSkwSswSswSsSskSSSSk..',
  '...kkkkswSswSswSsSskkkkk...',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.......swSswSswSsSsk.......',
  '.....ssssssssssssssssk.....',
  '....swwwSSSSSSSSSSSSSSk....',
  '...ssssssssssssssssssskk...',
  '..swwSSSSSSSSSSSSSSSSSSsk..',
  '..kkkkkkkkkkkkkkkkkkkkkkk..',
]
