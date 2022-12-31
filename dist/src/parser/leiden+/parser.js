import { LRParser } from "@lezer/lr";
import { charsToken, unclearToken } from "../tokens.js";
const parser = LRParser.deserialize({
  version: 14,
  states: "(jOQOVOOOQOVO'#C_OQOVO'#C`OQOVO'#CaO!kOWO'#CbOQOVO'#ChO!vOVO'#CnO!vOVO'#CoO!vOVO'#CpOOOR'#Cr'#CrO$QOSO'#CsO!vOVO'#CtOOOR'#D_'#D_OOOR'#Cu'#CuO$VOSO'#CwO!vOVO'#CyOOOR'#Cj'#CjOOOR'#DP'#DPOOOR'#Cz'#CzQQOVOOO$_OVO,58yO$fOVO,58zO$mOVO,58{OQOVO,58|OQOVO,59OOQOVO,59QO$tOVO,59SOOOR'#C{'#C{O${OVO,59YO%SOVO,59ZO%ZOVO,59[O%eOSO,59_O%jOVO,59`O%tOSO,59cO%yOVO,59eOOOR-E6x-E6xOOOR1G.e1G.eOOOR1G.f1G.fOOOR1G.g1G.gO&QOVO1G.hO&XOVO1G.jO&`OVO1G.lOOOR1G.n1G.nOOOR-E6y-E6yOOOR1G.t1G.tOOOR1G.u1G.uOOOR1G.v1G.vO&gOSO1G.vOOOR1G.y1G.yOOOR1G.z1G.zO&lOSO1G.zOOOR1G.}1G.}OOOR1G/P1G/POOOR7+$S7+$SOOOR7+$U7+$UOOOR7+$W7+$WOOOR7+$b7+$bOOOR7+$f7+$f",
  stateData: "&v~OP`O_`O``Oa`Oj]Ol`Oq]Or^OtPOvQOxROySOzTO{UO}VO!PWO!SXO!TYO!VZO!W]O!X]O!Y]O![_O~OVgOXhOZiO~OP`O_`O``Oa`Oj]Ol`Oq]Or^O{UO}VO!PWO!SXO!TYO!VZO!W]O!X]O!Y]O![_O~OaoO~OaqOjqO~OutO~PQOwuO~PQOwvO~PQO]zO~PQO||O~P!vO!O}O~P!vOe!PO!Q!OO~P!vO!U!QO~Oe!SO!U!RO~P!vO!Z!TO~O!]!UO~P!vOw!VO~PQOw!WO~PQOw!XO~PQO!Q!YO~O!U!ZO~OZ`aZ~",
  goto: "%}!SPPP!T!T!T!TP!TP!TP!TP!gPPP#V#V#VP#s#s#s#VP#VP#V$a%TPPP%kPPPPPPPPPPPPP#VqaOPQRTcdefghijwxypaOPQRTcdefghijwxyekUVWZ_lmnpr!V`OPQRTUVWZ_cdefghijlmnprwxy!V[OPQRTUVWZ_cdefghijlmnprwxyQcOQdPQeQQfRQjT`scdefjwxyQwgQxhRyiQlUQmVQnWQpZQr_Z{lmnprqbOPQRTcdefghijwxy",
  nodeNames: "\u26A0 Unclear Document Div Recto Verso Part PartId Fragment FragmentNum Column ColumnNum Foreign ForeignEnd Inline LineBreakWrapped LineBreak Number AbbrevUnresolved Abbrev Supplied CertLow GapUnknown Gap SuppliedLost Text QuestionMark LostLines Illegible Erasure",
  maxTerm: 59,
  skippedNodes: [0],
  repeatNodeCount: 2,
  tokenData: "-W~Rcpq!^xy!cyz#O!O!P#T!Q![$U!^!_(U!_!`)X!`!a)t!a!b)y!c!}'l!}#O*O#P#Q*k#T#`'l#`#a*p#a#o'l#p#q+}#r#s,q&Fp&Fq,|&Fq&Fr-R~!cO!X~~!hQ}~!a!b!n#p#q!y~!qPyz!t~!yOe~~#OO{~~#TO!O~~#YQ!W~!Q![#`!a!b#|~#eQl~!Q![#`#`#a#k~#nP#]#^#q~#tP#b#c#w~#|Ol~~$RPl~#`#a#k~$ZSaP!O!P$g!Q![$U!c!}'l#T#o'l~$lT`Ppq${}!O%Q#V#W%_#Y#Z&S#d#e'TP%QO`P~%VP_~pq%Y~%_O_~Q%bP#c#d%eQ%hP#`#a%kQ%nP#i#j%qQ%tP#a#b%wQ%zP#b#c%}Q&SOZQ~&VP#f#g&Y~&]P#T#U&`~&cP#Z#[&f~&iP#a#b&l~&oP#X#Y&r~&uP#b#c&x~&{P#h#i'O~'TOX~Q'WP#T#U'ZQ'^P#f#g'aQ'dP#h#i'gQ'lOVQQ'oS!O!P'{!Q!['l!c!}'l#T#o'lQ(OQ#V#W%_#d#e'T~(ZQ!P~!_!`(a!f!g(f~(fOt~~(iP!_!`(l~(oP!O!P(r~(wQy~#f#g(}#j#k)S~)SOv~~)XOx~~)^Q!Y~!`!a)d!f!g)i~)iOu~~)lP!`!a)o~)tOw~~)yO!Q~~*OOj~~*TP!V~!O!P*W~*]P!T~!a!b*`~*cP#P#Q*f~*kO!S~~*pO!U~R*sU!O!P'{!Q!['l!c!}'l#T#]'l#]#^+V#^#o'lR+YU!O!P'{!Q!['l!c!}'l#T#b'l#b#c+l#c#o'lR+qS!ZP!O!P'{!Q!['l!c!}'l#T#o'l~,QQyz,W#r#s,]~,]O|~~,`Q!c!},f#T#o,f~,kQ]~!c!},f#T#o,f~,tP#p#q,w~,|Oz~~-RO![~~-WO!]~",
  tokenizers: [charsToken, unclearToken, 0, 1],
  topRules: { "Document": [0, 2] },
  tokenPrec: 263
});
export {
  parser
};
