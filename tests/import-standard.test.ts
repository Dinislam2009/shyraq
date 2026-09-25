import {describe,expect,it} from "vitest";
import {duplicateKey,parseStandardText,validateImportRows} from "@/lib/import/standard";

describe("standard import parser",()=>{
 it("parses CSV with quoted delimiters",()=>{
  const rows=parseStandardText('front,back,tags\n"Question, one","Answer, one","math,exam"',"cards.csv");
  expect(rows).toHaveLength(1);
  expect(rows[0].front).toBe("Question, one");
  expect(rows[0].back).toBe("Answer, one");
  expect(rows[0].tags).toEqual(["math","exam"]);
 });
 it("parses JSON cards and clamps multiple-choice answers",()=>{
  const rows=parseStandardText(JSON.stringify({cards:[{front:"2+2",back:"4",kind:"multiple_choice",options:["3","4"],answer:8}]}),"cards.json");
  expect(rows[0].answer).toBe(1);
  expect(validateImportRows(rows)).toEqual([]);
 });
 it("reports invalid multiple-choice rows",()=>{
  const rows=parseStandardText("front,back,kind,options,answer\nQ,A,multiple_choice,OnlyOne,0","cards.csv");
  const issues=validateImportRows(rows);
  expect(issues.some(issue=>issue.message.includes("at least two options"))).toBe(true);
 });
 it("creates stable duplicate keys",()=>{
  expect(duplicateKey({front:" Hello ",back:"World"})).toBe("hello\u0000world");
 });
});
