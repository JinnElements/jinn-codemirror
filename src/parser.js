// This file was generated by lezer-generator. You probably shouldn't edit it.
import {LRParser} from "@lezer/lr"
import {charsToken, unclearToken} from "./tokens"
export const parser = LRParser.deserialize({
  version: 14,
  states: "'nOQOVOOOQOVO'#C_OQOVO'#C`OQOVO'#CaO!eOWO'#CbO!mOVO'#CiO#tOVO'#CjOOOR'#Cl'#ClO$OOSO'#CmO!mOVO'#CnOOOR'#DV'#DVOOOR'#Co'#CoO$TOSO'#CqO!mOVO'#CsOOOR'#DQ'#DQOOOR'#Cy'#CyOOOR'#Ct'#CtQQOVOOO$]OVO,58yO$dOVO,58zO$kOVO,58{OQOVO,58|OQOVO,59OOOOR'#Cu'#CuO$rOVO,59TO$yOVO,59UOOOR,59U,59UO%TOSO,59UO%YOSO,59XO%_OVO,59YO%iOSO,59]O%nOVO,59_OOOR-E6r-E6rOOOR1G.e1G.eOOOR1G.f1G.fOOOR1G.g1G.gO%uOVO1G.hO%|OVO1G.jOOOR-E6s-E6sOOOR1G.o1G.oOOOR1G.p1G.pO&TOSO1G.pOOOR1G.s1G.sOOOR1G.t1G.tO&YOSO1G.tOOOR1G.w1G.wOOOR1G.y1G.yOOOR7+$S7+$SOOOR7+$U7+$UOOOR7+$[7+$[OOOR7+$`7+$`",
  stateData: "&b~OP^OY^OZ^O[^OdZOf^OkZOl[OnPOpQOrROsSOuTOwUOzVO{WO}XO!OZO!PZO!QZO!S]O~OVeOXfO~OP^OY^OZ^O[^OdZOf^OkZOl[OuTOwUOzVO{WO}XO!OZO!PZO!QZO!S]O~O_kOxjO~P!mO[lO~O[nOdnO~OoqO~PQOqrO~PQOqsO~PQOvwO~P!mO_yOxxO~P!mOxxO~O|zO~O_|O|{O~P!mO!R}O~O!T!OO~P!mOq!PO~PQOq!QO~PQOx!RO~O|!SO~OZ[~",
  goto: "$}zPPP{{{{P{PPPP!Z!ZP!q!q!q!ZP!ZP!Z#X#sPPP$VPPPPPP$ePPPP!Zi_OPQRabcdeftuy^OPQRTUX]abcdefhimotuyYOPQRTUX]abcdefhimotuQaOQbPQcQQdR[pabcdtuQteRufQhTQiUQmXQo]Xvhimoi`OPQRabcdeftuh_OPQRabcdeftuagTUX]himo",
  nodeNames: "⚠ Unclear Document Div Recto Verso Part PartId Fragment FragmentNum LineBreakWrapped LineBreak Number Abbrev Supplied CertLow GapUnknown Gap SuppliedLost Text QuestionMark LostLines Illegible Erasure",
  maxTerm: 51,
  skippedNodes: [0],
  repeatNodeCount: 2,
  tokenData: "+O~Rapq!Wxy!]yz!p!O!P!u!Q![#v!^!_&{!_!`(O!`!a(k!a!b(p!c!}&f!}#O(u#P#Q)b#T#`&f#`#a)g#a#o&f&Fp&Fq*t&Fq&Fr*y~!]O!P~~!bPu~!a!b!e~!hPyz!k~!pO_~~!uOv~~!zQ!O~!Q![#Q!a!b#n~#VQf~!Q![#Q#`#a#]~#`P#]#^#c~#fP#b#c#i~#nOf~~#sPf~#`#a#]~#{S[P!O!P$X!Q![#v!c!}&f#T#o&f~$^SZPpq$j}!O$o#Y#Z$|#d#e%}P$oOZP~$tPY~pq$w~$|OY~~%PP#f#g%S~%VP#T#U%Y~%]P#Z#[%`~%cP#a#b%f~%iP#X#Y%l~%oP#b#c%r~%uP#h#i%x~%}OX~Q&QP#T#U&TQ&WP#f#g&ZQ&^P#h#i&aQ&fOVQQ&iS!O!P&u!Q![&f!c!}&f#T#o&fQ&xP#d#e%}~'QQw~!_!`'W!f!g']~']On~~'`P!_!`'c~'fP!O!P'i~'nQs~#f#g't#j#k'y~'yOp~~(OOr~~(TQ!Q~!`!a(Z!f!g(`~(`Oo~~(cP!`!a(f~(kOq~~(pOx~~(uOd~~(zP}~!O!P(}~)SP{~!a!b)V~)YP#P#Q)]~)bOz~~)gO|~R)jU!O!P&u!Q![&f!c!}&f#T#]&f#]#^)|#^#o&fR*PU!O!P&u!Q![&f!c!}&f#T#b&f#b#c*c#c#o&fR*hS!RP!O!P&u!Q![&f!c!}&f#T#o&f~*yO!S~~+OO!T~",
  tokenizers: [charsToken, unclearToken, 0, 1],
  topRules: {"Document":[0,2]},
  tokenPrec: 245
})
