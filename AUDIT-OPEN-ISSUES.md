# Shyraq — Open Errors & Required Rechecks

Бұл файлда тек:
- түзетілмеген қателер;
- production/infrastructure blocker-лер;
- міндетті түрде қайта тексеруді қажет ететін күмәнді/расталмаған жерлер
ғана жазылады.

"Қате жоқ" нәтижелері бұл файлға жазылмайды.

---

## 1. CRITICAL — Production Vercel → Supabase байланысы расталмаған

**Status:** OPEN  
**Priority:** CRITICAL  
**Detected:** 2026-09-26

### Белгісі
Production:
`https://shyraq-93xj.vercel.app/api/health`

қайта-қайта:

- HTTP `503`
- `database: "unavailable"`

қайтарады.

Connected Supabase project:
- Name: `Loopitt`
- Ref: `arggpdyabwnbswqzabab`
- Status: `ACTIVE_HEALTHY`

Бірақ оның live schema-сында Shyraq-тың негізгі кестелері жоқ.

Shyraq source schema-да 42 application table бар, ал connected Supabase project legacy Loopitt schema-ны көрсетеді.

### Неге blocker
Vercel production нақты қай Supabase project-ке қосылғаны дәлелденбейінше:
- production DB migration қолдануға;
- RLS-ті live DB-де өзгертуге;
- Shyraq schema-ны force-пен орнатуға
болмайды.

### Қажет әрекет
Vercel production environment ішіндегі:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- server-side Supabase secret

нақты қай project-ке тиесілі екенін анықтау керек.

### Қайта тексеру
1. Production env linkage анықталған соң `/api/health` тексеру.
2. Нақты Shyraq Supabase project-те 42 application table бар-жоғын тексеру.
3. Migration history source repository-мен салыстыру.
4. Security/performance advisors-ды нақты сол project-те іске қосу.

---

## 2. CRITICAL — Vercel production deploy rate limit

**Status:** OPEN  
**Priority:** CRITICAL  
**Detected:** 2026-09-26

### Белгісі
GitHub → Vercel status:

`Deployment rate limited — retry in 24 hours.`

Сондықтан жаңа commit-тер production-ға автоматты түрде шығарылмайды.

### Неге blocker
Жаңа code fix production environment-де тексерілмейді.

### Қайта тексеру
Deploy лимиті алынғаннан кейін:
1. соңғы `main` commit deploy болуы;
2. production health;
3. auth;
4. sync;
5. import/export;
6. E2E smoke
қайта тексерілуі керек.

---

## 3. HIGH — Authentication rate limiter production-wide емес

**Status:** OPEN / HARDENING REQUIRED  
**Priority:** HIGH  
**Detected:** 2026-09-26

### Қазіргі реализация
`src/lib/auth-rate-limit.ts`:
- `Map<string, Entry>`
- memory-local bucket
- IP limit: 30 / 10 minutes
- IP + email limit: 10 / 10 minutes

### Мәселе
Vercel/serverless environment-де memory instance-local болуы мүмкін. Бірнеше function instance қолданылғанда rate-limit state ортақ global store ретінде кепілденбейді.

### Қауіп
Brute-force protection production-wide деңгейде толық сенімді емес.

### Қайта тексеру / жөндеу
- distributed rate-limit қажет пе, анықтау;
- қажет болса persistent/shared storage немесе platform-native protection қолдану;
- production auth security audit-пен қайта тексеру.

---

## 4. HIGH — Live Supabase security audit аяқталмаған

**Status:** OPEN  
**Priority:** HIGH  
**Detected:** 2026-09-26

### Мәселе
Repository-level schema/RLS audit жасалды, бірақ live database нақты Shyraq DB екені әлі расталмаған.

Сондықтан:
- live RLS policies;
- live SECURITY DEFINER grants;
- live Storage policies;
- live Realtime publication;
- live Auth settings
бойынша final production verdict шығаруға болмайды.

### Қайта тексеру
Нақты production Supabase project анықталғаннан кейін толық live audit жасау керек.

---

## 5. HIGH — Supabase Auth leaked-password protection тексерілмеген

**Status:** OPEN  
**Priority:** HIGH  
**Source:** README production checklist

### Мәселе
README-де leaked-password protection әлі орындалмаған деп көрсетілген.

### Қайта тексеру
Production Supabase Auth settings ішінен:
- leaked password protection enabled/disabled
- password policy
- email confirmation
- OAuth provider configuration

қайта тексерілуі керек.

---

## 6. MEDIUM — Backup/import/sync code үшін жаңа error-handling fixes production-та расталмаған

**Status:** OPEN  
**Priority:** MEDIUM

### Соңғы түзетулер
Мына silent-error класстары source-та түзетілді:
- sync tag write failures;
- sync conflict write failures;
- backup partial-query failures;
- backup cleanup failures;
- sync diagnostics query failures;
- notification update failures.

### Мәселе
Бұл fixes production-да жаңа deploy болмағандықтан live behavior арқылы тексерілген жоқ.

### Қайта тексеру
Deploy жасалғаннан кейін:
1. backup export;
2. backup delete;
3. restore preview/restore;
4. sync conflict;
5. offline card/tag mutation;
6. notification read;
7. diagnostics
production environment-де smoke-test жасау керек.

---

## 7. MEDIUM — Database source/type drift қайта тексерілуі керек

**Status:** OPEN / RECHECK REQUIRED  
**Priority:** MEDIUM

### Қазіргі күй
Source schema:
- 42 current application table

Generated database types:
- сол 42 current table бар;
- қосымша 13 legacy type entry сақталған.

### Мәселе
Legacy generated types әдейі қалдырылған, бірақ live Shyraq DB-мен толық сәйкес келетіні әлі production DB арқылы расталмаған.

### Қайта тексеру
Нақты Shyraq Supabase project анықталғаннан кейін:
- `db:types`
- schema comparison
- migration history
қайта тексерілуі керек.

---

## 8. MEDIUM — Production health endpoint database identity-ін әлі нақты көрсете алмайды

**Status:** OPEN / RECHECK REQUIRED  
**Priority:** MEDIUM

### Мәселе
Health endpoint қауіпсіз түрде тек:
- database available/unavailable
- latency
- generic error

көрсетеді.

Уақытша diagnostic build арқылы Supabase host metadata қосылды, бірақ ол production-ға deployment rate limit салдарынан шығарылмады және кейін clean code-тан алынды.

### Қайта тексеру
Production env configuration Vercel dashboard/API арқылы тікелей тексерілуі керек. Health endpoint-ті secret немесе project identity ашатын debug endpoint-ке айналдырмау керек.

---

## 9. LOW — Static audit пен live audit арасы жабылуы керек

**Status:** OPEN  
**Priority:** LOW

### Мәселе
Repository schema/RLS/security contract-тері жақсы деңгейде тексерілген, бірақ final production sign-off үшін source-level PASS жеткіліксіз.

### Қайта тексеру
Final sign-off тек:
- source tests PASS;
- live DB schema PASS;
- live RLS PASS;
- live Auth PASS;
- production health PASS;
- production E2E PASS
болғаннан кейін ғана жасалуы керек.

---

## Audit log

### 2026-09-26
- Production health 503 қайта расталды.
- Connected Supabase project ACTIVE_HEALTHY екені расталды.
- Connected project Shyraq schema-сына сәйкес емес екені расталды.
- Vercel deployment rate limit қайта расталды.
- Auth rate limiter instance-local екені анықталды.
- Source-та бірнеше silent DB error handling мәселесі табылып түзетілді.
- Сол fixes-ке regression tests қосылды.


## 10. MEDIUM — Review queue fixed 5000-row cap

**Status:** OPEN — FIX IN PROGRESS  
**Priority:** MEDIUM  
**Detected:** 2026-09-26

### Мәселе
`src/lib/supabase/queries.ts` ішінде `getReviewBatch()` және `getReviewCard()` `review_states` үшін тек алғашқы 5000 `card_id`-ді алады.

5000-нан көп review state болған жағдайда бұдан кейінгі бұрын-reviewed cards жаңа card ретінде қайта таңдалуы мүмкін.

### Қажет әрекет
Review state IDs pagination арқылы толық оқылып, fixed 5000 cap алынып тасталуы керек.

### Қайта тексеру
- unit/contract test;
- CI;
- large-deck review smoke test.

## 11. MEDIUM — Analytics/dashboard fixed row caps

**Status:** OPEN — FIX IN PROGRESS  
**Priority:** MEDIUM  
**Detected:** 2026-09-26

### Мәселе
`src/lib/supabase/queries.ts` ішінде analytics/dashboard деректері fixed caps қолданады:

- workspace cards: `20,000`
- review events: `50,000`
- review states: `50,000`
- dashboard streak events: `5,000`
- 7-day average timing events: `5,000`

Үлкен деректер жиынында statistics/dashboard толық емес болып қалуы мүмкін.

### Қажет әрекет
Осы read paths pagination арқылы толық оқылуы керек.

### Қайта тексеру
- large dataset contract test;
- CI;
- statistics/dashboard smoke test.
