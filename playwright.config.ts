import {defineConfig,devices} from "@playwright/test";

export default defineConfig({
 testDir:"./tests/e2e",
 timeout:30000,
 expect:{timeout:10000},
 fullyParallel:true,
 forbidOnly:!!process.env.CI,
 retries:process.env.CI?2:0,
 workers:process.env.CI?2:undefined,
 reporter:process.env.CI?[["line"],["html",{outputFolder:"playwright-report",open:"never"}]]:[["list"]],
 use:{
  baseURL:"http://127.0.0.1:3000",
  trace:"retain-on-failure",
  screenshot:"only-on-failure",
  video:"retain-on-failure",
 },
 webServer:{
  command:"node scripts/e2e-server.mjs",
  url:"http://127.0.0.1:3000/login",
  reuseExistingServer:false,
  timeout:120000,
 },
 projects:[
  {name:"desktop-chromium",use:{...devices["Desktop Chrome"],viewport:{width:1440,height:900}}},
  {name:"mobile-chromium",use:{...devices["iPhone 15"]}},
 ],
});
