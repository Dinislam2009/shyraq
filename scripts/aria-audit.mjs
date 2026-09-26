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
 const value=node.attributes?.properties?.find(property=>{
  if(!ts.isJsxAttribute(property))return false;
  return ts.isIdentifier(property.name)&&property.name.text===name;
 });
 return value||null;
}

function attrHasValue(node,name){
 const value=attr(node,name);
 return Boolean(value);
}

function hasMeaningfulText(node){
 let found=false;
 function visit(child){
  if(found)return;
  if(ts.isJsxText(child)&&child.getText().trim())found=true;
  else if(ts.isStringLiteral(child))found=Boolean(child.text.trim());
  else if(ts.isJsxElement(child)||ts.isJsxFragment(child)||ts.isJsxSelfClosingElement(child)){
   const children=ts.isJsxElement(child)?child.children:[];
   for(const nested of children)visit(nested);
  }else if(ts.isJsxExpression(child)){
   if(child.expression&&child.expression.kind!==ts.SyntaxKind.NullKeyword)found=true;
  }
  if(!found)ts.forEachChild(child,visit);
 }
 if(ts.isJsxElement(node)){
  for(const child of node.children)visit(child);
 }else if(ts.isJsxSelfClosingElement(node)){
  return false;
 }
 return found;
}

function hasLabelAncestor(node,source){
 let current=node.parent;
 while(current){
  if(ts.isJsxElement(current)&&ts.isIdentifier(current.openingElement.tagName)&&current.openingElement.tagName.text==="label")return true;
  if(ts.isJsxElement(current)&&ts.isJsxElement(current.openingElement))return false;
  current=current.parent;
 }
 return false;
}

const files=await walk(ROOT);
for(const file of files){
 const sourceText=await readFile(file,"utf8");
 const source=ts.createSourceFile(file,sourceText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const visit=node=>{
  if(ts.isJsxElement(node)&&ts.isIdentifier(node.openingElement.tagName)&&node.openingElement.tagName.text==="button"){
   const labeled=attrHasValue(node.openingElement,"aria-label")||attrHasValue(node.openingElement,"aria-labelledby")||attrHasValue(node.openingElement,"title")||hasMeaningfulText(node);
   if(!labeled)failures.push(relative(process.cwd(),file)+":"+source.getLineAndCharacterOfPosition(node.getStart()).line+1+": button without accessible name");
  }
  if((ts.isJsxElement(node)||ts.isJsxSelfClosingElement(node))&&ts.isIdentifier((ts.isJsxElement(node)?node.openingElement:node).tagName)&&(ts.isIdentifier((ts.isJsxElement(node)?node.openingElement:node).tagName)&&((ts.isJsxElement(node)?node.openingElement:node).tagName.text==="input"||(ts.isJsxElement(node)?node.openingElement:node).tagName.text==="textarea"||(ts.isJsxElement(node)?node.openingElement:node).tagName.text==="select")){
   const element=ts.isJsxElement(node)?node.openingElement:node;
   const typeValue=attr(element,"type")?.initializer;
   const typeText=typeValue?typeValue.getText().replace(/^["']|["']$/g,""):"";
   const exempt=typeText==="hidden"||typeText==="checkbox"||typeText==="radio";
   const labeled=exempt||attrHasValue(element,"aria-label")||attrHasValue(element,"aria-labelledby")||attrHasValue(element,"placeholder")||attrHasValue(element,"id")||attrHasValue(element,"name")||hasLabelAncestor(node,source);
   if(!labeled)failures.push(relative(process.cwd(),file)+":"+source.getLineAndCharacterOfPosition(node.getStart()).line+1+": form control without accessible label contract");
  }
  if(ts.isJsxElement(node)){
   node.children.forEach(visit);
   visit(node.openingElement);
   if(node.closingElement)visit(node.closingElement);
  }else ts.forEachChild(node,visit);
 };
 ts.forEachChild(source,visit);
}

console.log("ARIA/static accessibility audit:",JSON.stringify({files:files.length,failures}));
if(failures.length)throw new Error(failures.slice(0,50).join("\n"));
