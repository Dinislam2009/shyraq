import {test,expect} from "@playwright/test";

test.describe("public browser launch gate",()=>{
 test("login and signup pages are usable without browser console errors",async({page})=>{
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});
  await page.goto("/login");
  await expect(page.getByRole("heading",{name:/Welcome back|Қош келдіңіз|Добро пожаловать/i})).toBeVisible();
  await expect(page.getByPlaceholder(/email|электрон|пошта/i)).toBeVisible();
  await expect(page.getByPlaceholder(/password|пароль|құпия/i)).toBeVisible();
  await page.getByRole("link",{name:/create|создать|аккаунт/i}).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("main")).toContainText(/Create account|Создать аккаунт|Аккаунт жасау/i);
  expect(errors).toEqual([]);
 });

 test("all supported locales render the core public UI",async({page})=>{
  const expectations={
   kk:{login:/Қош келдіңіз/i,privacy:"Құпиялылық",terms:"Шарттар",offline:"Офлайн қайталау"},
   ru:{login:/Добро пожаловать/i,privacy:"Конфиденциальность",terms:"Условия",offline:"Офлайн-повторение"},
   en:{login:/Welcome back/i,privacy:"Privacy",terms:"Terms",offline:"Offline review"},
  };
  for(const [locale,labels] of Object.entries(expectations)){
   await page.context().clearCookies();
   await page.context().addCookies([{name:"shyraq-locale",value:locale,url:"http://127.0.0.1:3000"}]);

   await page.goto("/login");
   await expect(page.locator("html")).toHaveAttribute("lang",locale);
   await expect(page.getByRole("heading",{name:labels.login})).toBeVisible();

   await page.goto("/legal/privacy");
   await expect(page.locator("html")).toHaveAttribute("lang",locale);
   await expect(page.getByRole("heading",{name:labels.privacy})).toBeVisible();

   await page.goto("/legal/terms");
   await expect(page.getByRole("heading",{name:labels.terms})).toBeVisible();

   await page.goto("/offline");
   await expect(page.getByRole("heading",{name:labels.offline})).toBeAttached();
  }
 });

 test("offline route renders on first load",async({page})=>{
  await page.goto("/offline");
  await expect(page.getByRole("heading",{name:/Offline review/i})).toBeAttached();
 });

 test("auth form exposes native validation before submission",async({page})=>{
  await page.goto("/login");
  const form=page.locator("form");
  const email=page.getByPlaceholder(/email|электрон|пошта/i);
  const password=page.getByPlaceholder(/password|пароль|құпия/i);
  await expect(form).toBeVisible();
  await email.fill("not-an-email");
  await password.fill("123");
  await expect(email).toHaveAttribute("type","email");
  await expect(password).toHaveAttribute("minlength","6");
 });
 test("public routes have no uncaught browser errors or horizontal overflow",async({page})=>{
  const routes=["/login","/signup","/offline","/legal/privacy","/legal/terms","/legal/community","/legal/data-retention"];
  for(const route of routes){
   const errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   page.on("console",message=>{if(message.type()==="error")errors.push(message.text());});
   await page.goto(route);
   await page.waitForLoadState("domcontentloaded");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   expect(overflow,false);
   expect(errors,route).toEqual([]);
   await page.reload();
  }
 });

});
