import ts from "typescript";
import {readdir,readFile} from "node:fs/promises";
import {join,relative} from "node:path";

const ROOT="src/app";
const failures=[];

async function walk(dir){
 const entries=await readdir(dir,{withFileTypes:true});
 const files=[];
 for(const entry of entries){
  const path=join(dir,entry.name);
  if(entry.isDirectory())files.push(...await walk(path));
  else if(entry.isFile()&&path.endsWith(".tsx"))files.push(path);
 }
 return files;
}

function attr(node,name){
 return node.attributes?.properties?.find(property=>
  ts.isJsxAttribute(property)&&ts.isIdentifier(property.name)&&property.name.text===name
 )||null;
}

function hasAttr(node,name){return Boolean(attr(node,name));}

function hasMeaningfulText(node){
 if(!ts.isJsxElement(node))return false;
 const stack=[...node.children];
 while(stack.length){
  const child=stack.pop();
  if(ts.isJsxText(child)&&child.getText().trim())return true;
  if(ts.isJsxElement(child))stack.push(...child.children);
  if(ts.isJsxExpression(child)&&child.expression&&child.expression.kind!==ts.SyntaxKind.NullKeyword)return true;
 }
 return false;
}

function hasLabelAncestor(node){
 let current=node.parent;
 while(current){
  if(ts.isJsxElement(current)){
   const tag=current.openingElement.tagName;
   if(ts.isIdentifier(tag)&&tag.text==="label")return true;
  }
  current=current.parent;
 }
 return false;
}

function tagName(node){
 const opening=ts.isJsxElement(node)?node.openingElement:node;
 return ts.isIdentifier(opening.tagName)?opening.tagName.text:null;
}

function line(source,node){return source.getLineAndCharacterOfPosition(node.getStart()).line+1;}

const files=await walk(ROOT);
for(const file of files){
 const sourceText=await readFile(file,"utf8");
 const source=ts.createSourceFile(file,sourceText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const rel=relative(process.cwd(),file);

 function visit(node){
  if(ts.isJsxElement(node)||ts.isJsxSelfClosingElement(node)){
   const name=tagName(node);
   const opening=ts.isJsxElement(node)?node.openingElement:node;
   if(name==="button"){
    const labeled=hasAttr(opening,"aria-label")||hasAttr(opening,"aria-labelledby")||hasAttr(opening,"title")||hasMeaningfulText(node);
    if(!labeled)failures.push(rel+":"+line(source,node)+": button without accessible name");
   }
   if(name==="input"||name==="textarea"||name==="select"){
    const typeValue=attr(opening,"type")?.initializer;
    const typeText=typeValue?typeValue.getText().replace(/^["']|["']$/g,""):"";
    const exempt=typeText==="hidden"||typeText==="checkbox"||typeText==="radio";
    const labeled=exempt||hasAttr(opening,"aria-label")||hasAttr(opening,"aria-labelledby")||hasAttr(opening,"placeholder")||hasAttr(opening,"id")||hasAttr(opening,"name")||hasLabelAncestor(node);
    if(!labeled)failures.push(rel+":"+line(source,node)+": form control without accessible label contract");
   }
  }

  if(ts.isJsxElement(node)){
   visit(node.openingElement);
   for(const child of node.children)visit(child);
   if(node.closingElement)visit(node.closingElement);
  }else if(ts.isJsxSelfClosingElement(node)){
   for(const property of node.attributes.properties)visit(property);
  }else{
   ts.forEachChild(node,visit);
  }
 }

 ts.forEachChild(source,visit);
}

console.log("ARIA/static accessibility audit:",JSON.stringify({files:files.length,failures}));
if(failures.length)throw new Error(failures.slice(0,50).join("\n"));
