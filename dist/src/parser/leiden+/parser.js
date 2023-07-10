import { LRParser } from "@lezer/lr";
import { charsToken, unclearToken } from "../tokens.js";
const parser = LRParser.deserialize({
  version: 14,
  states: "(vOQOVOOOQOVO'#C_OQOVO'#C`OQOVO'#CaO!nOWO'#CbOQOVO'#CiO!yOVO'#CnO!yOVO'#CoO!yOVO'#CpOOOR'#Cr'#CrO$ZOSO'#CsO!yOVO'#CtOOOR'#D_'#D_OOOR'#Cu'#CuO$`OSO'#CwO!yOVO'#CyO!yOVO'#CyOOOR'#Ch'#ChOOOR'#DP'#DPOOOR'#Cz'#CzQQOVOOO$hOVO,58yO$oOVO,58zO$vOVO,58{OQOVO,58|OQOVO,59OOQOVO,59QO$}OVO,59TOOOR'#C{'#C{O%UOVO,59YO%]OVO,59ZO%dOVO,59[O%nOSO,59_O%sOVO,59`O%}OSO,59cO&SOVO,59eO&ZOcO,59eOOOR-E6x-E6xOOOR1G.e1G.eOOOR1G.f1G.fOOOR1G.g1G.gO&bOVO1G.hO&iOVO1G.jO&pOVO1G.lOOOR1G.o1G.oOOOR-E6y-E6yOOOR1G.t1G.tOOOR1G.u1G.uOOOR1G.v1G.vO&wOSO1G.vOOOR1G.y1G.yOOOR1G.z1G.zO&|OSO1G.zOOOR1G.}1G.}OOOR1G/P1G/POOOR7+$S7+$SOOOR7+$U7+$UOOOR7+$W7+$WOOOR7+$b7+$bOOOR7+$f7+$f",
  stateData: "'[~OPaO_aO`aOaaOj]OlaOq]Or^OtPOvQOxROySOzTO{UO}VO!PWO!SXO!TYO!VZO!W]O!X]O!Y]O![_O!^`O~OVhOXiOZjO~OPaO_aO`aOaaOj]OlaOq]Or^OzTO{UO}VO!PWO!SXO!TYO!VZO!W]O!X]O!Y]O![_O!^`O~OapO~OarOjrO~OuvO~PQOwwO~PQOwxO~PQO^|O~PQO|!OO~P!yO!O!PO~P!yOe!RO!Q!QO~P!yO!U!SO~Oe!UO!U!TO~P!yO!Z!VO~O!]!WO~P!yO!_!WO~P!yOw!XO~PQOw!YO~PQOw!ZO~PQO!Q![O~O!U!]O~Ol!WXZ_`aZ~",
  goto: "&X!SPPP!T!T!T!TP!TP!TP!g#XPPPP#X#X#XP#w#w#w#XP#XP#X$g%ZPPP%uPPPPPPPPPPPPP#XqbOPQRTdefghijkyz{pbOPQRTdefghijkyz{ilUVWZ_`mnoqst!ZaOPQRTUVWZ_`defghijkmnoqstyz{!Z[OPQRTUVWZ_`defghijkmnoqstyz{QdOQePQfQQgRQkT`udefgkyz{QyhQziR{jQmUQnVQoWQqZQs_Qt`]}mnoqstqcOPQRTdefghijkyz{",
  nodeNames: "\u26A0 Unclear Document Div Recto Verso Part PartId Fragment FragmentNum Column ColumnNum Inline Foreign ForeignEnd LineBreakWrapped LineBreak Number AbbrevUnresolved Abbrev Supplied CertLow GapUnknown Gap SuppliedLost Text QuestionMark LostLines Illegible Erasure",
  maxTerm: 61,
  skippedNodes: [0],
  repeatNodeCount: 2,
  tokenData: "-h~Rcpq!^xy!cyz#O!O!P#T!Q![$U!^!_(U!_!`)X!`!a)t!a!b)y!c!}'l!}#O*O#P#Q*s#T#`'l#`#a+Q#a#o'l#p#q,_#r#s-R&Fp&Fq-^&Fq&Fr-c~!cO!X~~!hQ}~!a!b!n#p#q!y~!qPyz!t~!yOe~~#OO{~~#TO!O~~#YQ!W~!Q![#`!a!b#|~#eQl~!Q![#`#`#a#k~#nP#]#^#q~#tP#b#c#w~#|Ol~~$RPl~#`#a#k~$ZSaT!O!P$g!Q![$U!c!}'l#T#o'l~$lT`Tpq${}!O%Q#V#W%_#Y#Z&S#d#e'TT%QO`T~%VP_~pq%Y~%_O_~Q%bP#c#d%eQ%hP#`#a%kQ%nP#i#j%qQ%tP#a#b%wQ%zP#b#c%}Q&SOZQ~&VP#f#g&Y~&]P#T#U&`~&cP#Z#[&f~&iP#a#b&l~&oP#X#Y&r~&uP#b#c&x~&{P#h#i'O~'TOX~Q'WP#T#U'ZQ'^P#f#g'aQ'dP#h#i'gQ'lOVQQ'oS!O!P'{!Q!['l!c!}'l#T#o'lQ(OQ#V#W%_#d#e'T~(ZQ!P~!_!`(a!f!g(f~(fOt~~(iP!_!`(l~(oP!O!P(r~(wQy~#f#g(}#j#k)S~)SOv~~)XOx~~)^Q!Y~!`!a)d!f!g)i~)iOu~~)lP!`!a)o~)tOw~~)yO!Q~~*OOj~~*TQ!V~!O!P*Z!}#O*n~*`P!T~!a!b*c~*fP#P#Q*i~*nO!S~~*sO!^~T*xP!UP#P#Q*{S+QO!_SR+TU!O!P'{!Q!['l!c!}'l#T#]'l#]#^+g#^#o'lR+jU!O!P'{!Q!['l!c!}'l#T#b'l#b#c+|#c#o'lR,RS!ZP!O!P'{!Q!['l!c!}'l#T#o'l~,bQyz,h#r#s,m~,mO|~~,pQ!c!},v#T#o,v~,{Q^~!c!},v#T#o,v~-UP#p#q-X~-^Oz~~-cO![~~-hO!]~",
  tokenizers: [charsToken, unclearToken, 0, 1, 2],
  topRules: { "Document": [0, 2] },
  tokenPrec: 279
});
export {
  parser
};
