import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("app shell exposes keyboard skip navigation and main landmark",()=>{
 const shell=readFileSync(new URL("../src/components/app-shell.tsx",import.meta.url),"utf8");
 assert.match(shell,/href="#main-content"/);
 assert.match(shell,/id="main-content"/);
 assert.match(shell,/className="sr-only/);
});

test("offline sync exposes live status and progress semantics",()=>{
 const sync=readFileSync(new URL("../src/components/offline-sync-panel.tsx",import.meta.url),"utf8");
 assert.match(sync,/aria-live="polite"/);
 assert.match(sync,/role="status"/);
 assert.match(sync,/role="progressbar"/);
 assert.match(sync,/aria-valuenow/);
});

test("visual block editor is keyboard and screen-reader addressable",()=>{
 const editor=readFileSync(new URL("../src/components/block-editor.tsx",import.meta.url),"utf8");
 assert.match(editor,/contentEditable/);
 assert.match(editor,/role="textbox"/);
 assert.match(editor,/aria-multiline="true"/);
 assert.match(editor,/aria-label=/);
});
