import { LRParser } from "@lezer/lr";
import { charsToken, unclearToken } from "../tokens.js";
const parser = LRParser.deserialize({
  version: 14,
  states: "(vOQOVOOOQOVO'#C_OQOVO'#C`OQOVO'#CaO!kOWO'#CbOQOVO'#ChO!vOVO'#CnO!vOVO'#CoO$QOVO'#CpOOOR'#Cr'#CrO$[OSO'#CsO!vOVO'#CtOOOR'#D_'#D_OOOR'#Cu'#CuO$aOSO'#CwO!vOVO'#CyOOOR'#Cj'#CjOOOR'#DP'#DPOOOR'#Cz'#CzQQOVOOO$iOVO,58yO$pOVO,58zO$wOVO,58{OQOVO,58|OQOVO,59OOQOVO,59QO%OOVO,59SOOOR'#C{'#C{O%VOVO,59YO%^OVO,59ZO%eOVO,59[OOOR,59[,59[O%oOSO,59[O%tOSO,59_O%yOVO,59`O&TOSO,59cO&YOVO,59eOOOR-E6x-E6xOOOR1G.e1G.eOOOR1G.f1G.fOOOR1G.g1G.gO&aOVO1G.hO&hOVO1G.jO&oOVO1G.lOOOR1G.n1G.nOOOR-E6y-E6yOOOR1G.t1G.tOOOR1G.u1G.uOOOR1G.v1G.vO&vOSO1G.vOOOR1G.y1G.yOOOR1G.z1G.zO&{OSO1G.zOOOR1G.}1G.}OOOR1G/P1G/POOOR7+$S7+$SOOOR7+$U7+$UOOOR7+$W7+$WOOOR7+$b7+$bOOOR7+$f7+$f",
  stateData: "'V~OP`O_`O``Oa`Oj]Ol`Oq]Or^OtPOvQOxROySOzTO{UO}VO!PWO!SXO!TYO!VZO!W]O!X]O!Y]O![_O~OVgOXhOZiO~OP`O_`O``Oa`Oj]Ol`Oq]Or^O{UO}VO!PWO!SXO!TYO!VZO!W]O!X]O!Y]O![_O~OepO!QoO~P!vOaqO~OasOjsO~OuvO~PQOwwO~PQOwxO~PQO]|O~PQO|!OO~P!vO!O!PO~P!vOe!RO!Q!QO~P!vO!Q!QO~O!U!SO~Oe!UO!U!TO~P!vO!Z!VO~O!]!WO~P!vOw!XO~PQOw!YO~PQOw!ZO~PQO!Q![O~O!U!]O~OZ`aZ~",
  goto: "%}!SPPP!T!T!T!TP!TP!TP!TP!gPPP#V#V#VP#s#s#s#VP#VP#V$a%TPPP%kPPPPPPPPPPPPP#VqaOPQRTcdefghijyz{paOPQRTcdefghijyz{ekUVWZ_lmnrt!V`OPQRTUVWZ_cdefghijlmnrtyz{!V[OPQRTUVWZ_cdefghijlmnrtyz{QcOQdPQeQQfRQjT`ucdefjyz{QygQzhR{iQlUQmVQnWQrZQt_Z}lmnrtqbOPQRTcdefghijyz{",
  nodeNames: "\u26A0 Unclear Document Div Recto Verso Part PartId Fragment FragmentNum Column ColumnNum Foreign ForeignEnd Inline LineBreakWrapped LineBreak Number AbbrevUnresolved Abbrev Supplied CertLow GapUnknown Gap SuppliedLost Text QuestionMark LostLines Illegible Erasure",
  maxTerm: 59,
  skippedNodes: [0],
  repeatNodeCount: 2,
  tokenData: "-W~Rcpq!^xy!cyz#O!O!P#T!Q![$U!^!_(U!_!`)X!`!a)t!a!b)y!c!}'l!}#O*O#P#Q*k#T#`'l#`#a*p#a#o'l#p#q+}#r#s,q&Fp&Fq,|&Fq&Fr-R~!cO!X~~!hQ}~!a!b!n#p#q!y~!qPyz!t~!yOe~~#OO{~~#TO!O~~#YQ!W~!Q![#`!a!b#|~#eQl~!Q![#`#`#a#k~#nP#]#^#q~#tP#b#c#w~#|Ol~~$RPl~#`#a#k~$ZSaP!O!P$g!Q![$U!c!}'l#T#o'l~$lT`Ppq${}!O%Q#V#W%_#Y#Z&S#d#e'TP%QO`P~%VP_~pq%Y~%_O_~Q%bP#c#d%eQ%hP#`#a%kQ%nP#i#j%qQ%tP#a#b%wQ%zP#b#c%}Q&SOZQ~&VP#f#g&Y~&]P#T#U&`~&cP#Z#[&f~&iP#a#b&l~&oP#X#Y&r~&uP#b#c&x~&{P#h#i'O~'TOX~Q'WP#T#U'ZQ'^P#f#g'aQ'dP#h#i'gQ'lOVQQ'oS!O!P'{!Q!['l!c!}'l#T#o'lQ(OQ#V#W%_#d#e'T~(ZQ!P~!_!`(a!f!g(f~(fOt~~(iP!_!`(l~(oP!O!P(r~(wQy~#f#g(}#j#k)S~)SOv~~)XOx~~)^Q!Y~!`!a)d!f!g)i~)iOu~~)lP!`!a)o~)tOw~~)yO!Q~~*OOj~~*TP!V~!O!P*W~*]P!T~!a!b*`~*cP#P#Q*f~*kO!S~~*pO!U~R*sU!O!P'{!Q!['l!c!}'l#T#]'l#]#^+V#^#o'lR+YU!O!P'{!Q!['l!c!}'l#T#b'l#b#c+l#c#o'lR+qS!ZP!O!P'{!Q!['l!c!}'l#T#o'l~,QQyz,W#r#s,]~,]O|~~,`Q!c!},f#T#o,f~,kQ]~!c!},f#T#o,f~,tP#p#q,w~,|Oz~~-RO![~~-WO!]~",
  tokenizers: [charsToken, unclearToken, 0, 1],
  topRules: { "Document": [0, 2] },
  tokenPrec: 278
});
export {
  parser
};
