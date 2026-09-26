import test from "node:test";
import assert from "node:assert/strict";
import {renderAnkiTemplate} from "../src/lib/anki/template-engine.ts";

test("renders fields, FrontSide and conditional sections",()=>{
 const fields={front:"Question",back:"Answer",Hint:"Remember",empty:""};
 const front=renderAnkiTemplate("{{front}} {{#Hint}}({{hint:Hint}}){{/Hint}}",fields,{side:"front"});
 const back=renderAnkiTemplate("{{FrontSide}}<hr>{{back}}",fields,{side:"back",frontSide:front});
 assert.equal(front,"Question (<span class=\"anki-hint\">Remember</span>)");
 assert.equal(back,'Question (<span class="anki-hint">Remember</span>)<hr>Answer');
});

test("supports text, hint and type filters",()=>{
 const value="<b>Biology</b>";
 const rendered=renderAnkiTemplate("{{text:subject}}|{{hint:subject}}|{{type:subject}}",{subject:value});
 assert.equal(rendered,"Biology|<span class=\"anki-hint\"><b>Biology</b></span>|<span class=\"anki-type-answer\"><b>Biology</b></span>");
});

test("reveals selected cloze ordinal only on the front and all clozes on back",()=>{
 const field="A {{c1::mitochondria::organelle}} and {{c2::chloroplast}}";
 assert.match(renderAnkiTemplate("{{cloze:Text}}",{Text:field},{clozeIndex:1}),/\[organelle\]/);
 assert.match(renderAnkiTemplate("{{cloze:Text}}",{Text:field},{clozeIndex:1}),/chloroplast/);
 assert.match(renderAnkiTemplate("{{cloze:Text}}",{Text:field},{clozeIndex:1,revealCloze:true}),/mitochondria/);
 assert.match(renderAnkiTemplate("{{cloze:Text}}",{Text:field},{clozeIndex:1,revealCloze:true}),/chloroplast/);
});

test("supports inverse conditional blocks",()=>{
 assert.equal(renderAnkiTemplate("{{^missing}}fallback{{/missing}}",{missing:""}),"fallback");
 assert.equal(renderAnkiTemplate("{{^missing}}fallback{{/missing}}",{missing:"value"}),"");
});


test("supports Anki special fields",()=>{
 const rendered=renderAnkiTemplate("{{Deck}}|{{Subdeck}}|{{Tags}}|{{Type}}|{{Card}}|{{CardFlag}}|{{CardSuspended}}",{front:"Q"},{specialFields:{Deck:"Biology::Cells",Subdeck:"Cells",Tags:"mitosis exam",Type:"Basic",Card:"Back",CardFlag:"2",CardSuspended:"1"}});
 assert.equal(rendered,"Biology::Cells|Cells|mitosis exam|Basic|Back|2|1");
});
