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

 test("all supported locales switch the auth UI",async({page})=>{
  await page.goto("/login");
  const select=page.getByRole("combobox",{name:/language|язык|тіл/i});
  await expect(select).toBeVisible();
  for(const locale of ["kk","ru","en"]){
   await select.selectOption(locale);
   await expect(page.locator("html")).toHaveAttribute("lang",locale);
   await expect(select).toHaveValue(locale);
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
});
