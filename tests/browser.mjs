import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const base = "http://127.0.0.1:8765/";
const output = "screenshots";
mkdirSync(output, { recursive: true });

const fakeSupabase = [
  "window.supabase = {createClient: () => {",
  "const user = {id:'00000000-0000-0000-0000-000000000001', email:'test@example.com'};",
  "const session = {user};",
  "return {",
  "auth: {",
  "getSession: async () => ({ data:{session: localStorage.getItem('mock-session') ? session : null}, error:null }),",
  "signInWithPassword: async ({email,password}) => {",
  " if(!email || !password) return {data:{session:null},error:{message:'Missing login'}};",
  " localStorage.setItem('mock-session','1'); return {data:{session},error:null};",
  "},",
  "signOut: async () => {localStorage.removeItem('mock-session'); return {error:null};}",
  "},",
  "from: () => ({",
  "select: () => ({eq: () => ({maybeSingle: async () => ({",
  " data: localStorage.getItem('mock-payload') ? {payload:JSON.parse(localStorage.getItem('mock-payload'))} : null, error:null",
  "})})}),",
  "upsert: async ({payload}) => {localStorage.setItem('mock-payload',JSON.stringify(payload)); return {error:null};}",
  "})",
  "};",
  "}};"
].join("\n");

const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const exceptions = [];
page.on("pageerror", error => exceptions.push(error.message));
await page.route("**/cdn.jsdelivr.net/**", route => route.fulfill({status:200,contentType:"application/javascript",body:fakeSupabase}));
await page.goto(base,{waitUntil:"load"});
await page.locator("#loginView").waitFor({state:"visible"});
assert.equal(await page.locator("#workspace").isVisible(),false);
await page.screenshot({path:output+"/01-sign-in-mobile.png",fullPage:true});
await page.locator("#email").fill("test@example.com");
await page.locator("#password").fill("test-password");
await page.locator("#loginSubmit").click();
await page.locator("#workspace").waitFor({state:"visible"});
await page.locator("#outcome").fill("Run an evaluation and inspect its output");
await page.locator("#nextStep").fill("Open the repository and execute the sample suite");
await page.locator("#priorityDone").check();
await page.locator("#addTask").click();
await page.locator('#extraTasks input[type="text"]').first().fill("Review failing checks");
await page.locator("#wrapDisclosure summary").click();
await page.locator("#evidence").fill("Validated local output");
await page.locator("#closeDay").click();
await page.waitForTimeout(1200);
assert.equal(await page.locator("#syncStatus").textContent(),"Saved");
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
assert.ok(overflow<=2,"Mobile horizontal overflow: "+overflow);
await page.screenshot({path:output+"/02-today-mobile.png",fullPage:true});
await page.reload({waitUntil:"load"});
await page.locator("#workspace").waitFor({state:"visible"});
assert.equal(await page.locator("#loginView").isVisible(),false,"Should restore authenticated session");
assert.equal(await page.locator("#outcome").inputValue(),"Run an evaluation and inspect its output");
assert.equal(await page.locator("#priorityDone").isChecked(),true);
assert.equal(await page.locator('#extraTasks input[type="text"]').first().inputValue(),"Review failing checks");
await page.locator('[data-view="week"]').click();
assert.equal(await page.locator("#completedCount").textContent(),"1");
await page.screenshot({path:output+"/03-week-mobile.png",fullPage:true});
await page.setViewportSize({width:1280,height:820});
await page.locator('[data-view="today"]').click();
await page.screenshot({path:output+"/04-today-desktop.png",fullPage:true});
assert.deepEqual(exceptions,[],"No uncaught browser errors");
await browser.close();
console.log("Browser smoke test passed: login, task edit, sync, reload, weekly view, mobile width.");
