"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type Locale, type TranslationKey } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const ui: Record<string, Record<Locale, string>> = {
  "Library": {kk:"Кітапхана",ru:"Библиотека",en:"Library"},
  "My decks": {kk:"Менің колодаларым",ru:"Мои колоды",en:"My decks"},
  "New deck": {kk:"Жаңа колода",ru:"Новая колода",en:"New deck"},
  "Create deck": {kk:"Колода жасау",ru:"Создать колоду",en:"Create deck"},
  "Choose where this deck belongs.": {kk:"Бұл колода қай жұмыс кеңістігіне тиесілі екенін таңдаңыз.",ru:"Выберите рабочее пространство для этой колоды.",en:"Choose where this deck belongs."},
  "Workspace": {kk:"Жұмыс кеңістігі",ru:"Рабочее пространство",en:"Workspace"},
  "Name": {kk:"Атауы",ru:"Название",en:"Name"},
  "Description": {kk:"Сипаттама",ru:"Описание",en:"Description"},
  "What are you learning?": {kk:"Нені үйреніп жатырсыз?",ru:"Что вы изучаете?",en:"What are you learning?"},
  "Cancel": {kk:"Бас тарту",ru:"Отмена",en:"Cancel"},
  "Create": {kk:"Жасау",ru:"Создать",en:"Create"},
  "Back": {kk:"Артқа",ru:"Назад",en:"Back"},
  "Back to decks": {kk:"Колодаларға оралу",ru:"Назад к колодам",en:"Back to decks"},
  "Add card": {kk:"Карта қосу",ru:"Добавить карточку",en:"Add card"},
  "Templates": {kk:"Шаблондар",ru:"Шаблоны",en:"Templates"},
  "Study": {kk:"Оқу",ru:"Учить",en:"Study"},
  "Cards": {kk:"Карталар",ru:"Карточки",en:"Cards"},
  "Visibility": {kk:"Көрінуі",ru:"Видимость",en:"Visibility"},
  "Status": {kk:"Күйі",ru:"Статус",en:"Status"},
  "Active": {kk:"Белсенді",ru:"Активные",en:"Active"},
  "No cards yet": {kk:"Әзірге карталар жоқ",ru:"Карточек пока нет",en:"No cards yet"},
  "Add your first card": {kk:"Алғашқы картаңызды қосыңыз",ru:"Добавьте первую карточку",en:"Add your first card"},
  "Search cards...": {kk:"Карталарды іздеу...",ru:"Поиск карточек...",en:"Search cards..."},
  "Search decks...": {kk:"Колодаларды іздеу...",ru:"Поиск колод...",en:"Search decks..."},
  "All types": {kk:"Барлық түрі",ru:"Все типы",en:"All types"},
  "All status": {kk:"Барлық күй",ru:"Все статусы",en:"All status"},
  "Marked": {kk:"Белгіленген",ru:"Отмеченные",en:"Marked"},
  "Suspended": {kk:"Тоқтатылған",ru:"Приостановленные",en:"Suspended"},
  "Select visible": {kk:"Көрінетіндерін таңдау",ru:"Выбрать видимые",en:"Select visible"},
  "selected": {kk:"таңдалды",ru:"выбрано",en:"selected"},
  "Mark": {kk:"Белгілеу",ru:"Отметить",en:"Mark"},
  "Unmark": {kk:"Белгіні алып тастау",ru:"Снять отметку",en:"Unmark"},
  "Suspend": {kk:"Тоқтату",ru:"Приостановить",en:"Suspend"},
  "Unsuspend": {kk:"Қайта қосу",ru:"Возобновить",en:"Unsuspend"},
  "Delete": {kk:"Жою",ru:"Удалить",en:"Delete"},
  "Edit": {kk:"Өңдеу",ru:"Изменить",en:"Edit"},
  "Favorite": {kk:"Таңдаулы",ru:"Избранное",en:"Favorite"},
  "Tags": {kk:"Тегтер",ru:"Теги",en:"Tags"},
  "Save changes": {kk:"Өзгерістерді сақтау",ru:"Сохранить изменения",en:"Save changes"},
  "No matching cards": {kk:"Сәйкес карталар табылмады",ru:"Подходящих карточек нет",en:"No matching cards"},
  "Change the search or filters.": {kk:"Іздеу немесе сүзгілерді өзгертіңіз.",ru:"Измените поиск или фильтры.",en:"Change the search or filters."},
  "Untitled card": {kk:"Атаусыз карта",ru:"Карточка без названия",en:"Untitled card"},
  "No answer": {kk:"Жауап жоқ",ru:"Нет ответа",en:"No answer"},
  "Save card": {kk:"Картаны сақтау",ru:"Сохранить карточку",en:"Save card"},
  "Card type": {kk:"Карта түрі",ru:"Тип карточки",en:"Card type"},
  "Multiple choice": {kk:"Бірнеше нұсқадан таңдау",ru:"Множественный выбор",en:"Multiple choice"},
  "Format": {kk:"Пішім",ru:"Формат",en:"Format"},
  "Bold": {kk:"Қалың",ru:"Жирный",en:"Bold"},
  "Italic": {kk:"Көлбеу",ru:"Курсив",en:"Italic"},
  "Inline code": {kk:"Кірістірілген код",ru:"Встроенный код",en:"Inline code"},
  "Code block": {kk:"Код блогы",ru:"Блок кода",en:"Code block"},
  "LaTeX": {kk:"LaTeX",ru:"LaTeX",en:"LaTeX"},
  "List": {kk:"Тізім",ru:"Список",en:"List"},
  "Front": {kk:"Алдыңғы бет",ru:"Лицевая сторона",en:"Front"},
  "Back": {kk:"Артқы бет",ru:"Обратная сторона",en:"Back"},
  "Question, term, prompt...": {kk:"Сұрақ, термин, тапсырма...",ru:"Вопрос, термин, задание...",en:"Question, term, prompt..."},
  "Show answer": {kk:"Жауапты көрсету",ru:"Показать ответ",en:"Show answer"},
  "Correct": {kk:"Дұрыс",ru:"Правильно",en:"Correct"},
  "Your choice": {kk:"Сіздің таңдауыңыз",ru:"Ваш выбор",en:"Your choice"},
  "Choose this answer": {kk:"Осы жауапты таңдау",ru:"Выбрать этот ответ",en:"Choose this answer"},
  "Correct option:": {kk:"Дұрыс нұсқа:",ru:"Правильный вариант:",en:"Correct option:"},
  "Again": {kk:"Қайта",ru:"Снова",en:"Again"},
  "Hard": {kk:"Қиын",ru:"Сложно",en:"Hard"},
  "Good": {kk:"Жақсы",ru:"Хорошо",en:"Good"},
  "Easy": {kk:"Оңай",ru:"Легко",en:"Easy"},
  "Session complete": {kk:"Сессия аяқталды",ru:"Сессия завершена",en:"Session complete"},
  "Load more": {kk:"Тағы жүктеу",ru:"Загрузить ещё",en:"Load more"},
  "View statistics": {kk:"Статистиканы көру",ru:"Открыть статистику",en:"View statistics"},
  "Scheduled review": {kk:"Жоспарланған қайталау",ru:"Запланированное повторение",en:"Scheduled review"},
  "New card": {kk:"Жаңа карта",ru:"Новая карточка",en:"New card"},
  "Insights": {kk:"Талдау",ru:"Аналитика",en:"Insights"},
  "Statistics": {kk:"Статистика",ru:"Статистика",en:"Statistics"},
  "Review history, answer distribution, timing and deck-level performance.": {kk:"Қайталау тарихы, жауаптардың бөлінуі, уақыт және колода нәтижелері.",ru:"История повторений, распределение ответов, время и результаты по колодам.",en:"Review history, answer distribution, timing and deck-level performance."},
  "Last 30 days": {kk:"Соңғы 30 күн",ru:"Последние 30 дней",en:"Last 30 days"},
  "Reviews per day": {kk:"Күніне қайталау",ru:"Повторений в день",en:"Reviews per day"},
  "Answer distribution": {kk:"Жауаптардың бөлінуі",ru:"Распределение ответов",en:"Answer distribution"},
  "recorded responses": {kk:"жазылған жауап",ru:"зафиксированных ответов",en:"recorded responses"},
  "Deck performance": {kk:"Колода нәтижелері",ru:"Результаты колод",en:"Deck performance"},
  "Daily detail": {kk:"Күндік мәлімет",ru:"Детали по дням",en:"Daily detail"},
  "Community": {kk:"Қауымдастық",ru:"Сообщество",en:"Community"},
  "Public decks": {kk:"Қоғамдық колодалар",ru:"Публичные колоды",en:"Public decks"},
  "Browse decks shared by Shyraq creators.": {kk:"Shyraq авторлары бөліскен колодаларды қараңыз.",ru:"Просматривайте колоды, которыми делятся авторы Shyraq.",en:"Browse decks shared by Shyraq creators."},
  "No public decks match your search.": {kk:"Іздеуіңізге сәйкес қоғамдық колода жоқ.",ru:"Нет публичных колод по вашему запросу.",en:"No public decks match your search."},
  "Follow": {kk:"Жазылу",ru:"Подписаться",en:"Follow"},
  "Copy to my decks": {kk:"Менің колодаларыма көшіру",ru:"Скопировать в мои колоды",en:"Copy to my decks"},
  "Report this deck": {kk:"Бұл колодаға шағымдану",ru:"Пожаловаться на эту колоду",en:"Report this deck"},
  "Reason": {kk:"Себеп",ru:"Причина",en:"Reason"},
  "Copyright": {kk:"Авторлық құқық",ru:"Авторские права",en:"Copyright"},
  "Spam": {kk:"Спам",ru:"Спам",en:"Spam"},
  "Unsafe content": {kk:"Қауіпті контент",ru:"Небезопасный контент",en:"Unsafe content"},
  "Misleading": {kk:"Жаңылыстыратын",ru:"Вводящий в заблуждение",en:"Misleading"},
  "Other": {kk:"Басқа",ru:"Другое",en:"Other"},
  "Optional details": {kk:"Қосымша мәлімет (міндетті емес)",ru:"Дополнительные сведения (необязательно)",en:"Optional details"},
  "Submit report": {kk:"Шағымды жіберу",ru:"Отправить жалобу",en:"Submit report"},
  "Collections": {kk:"Жинақтар",ru:"Коллекции",en:"Collections"},
  "Group important cards without changing their deck.": {kk:"Маңызды карталарды колодасын өзгертпей топтаңыз.",ru:"Группируйте важные карточки, не меняя их колоду.",en:"Group important cards without changing their deck."},
  "New collection name": {kk:"Жаңа жинақ атауы",ru:"Название новой коллекции",en:"New collection name"},
  "Import & export": {kk:"Импорт және экспорт",ru:"Импорт и экспорт",en:"Import & export"},
  "Keep your learning data portable and independent from Shyraq.": {kk:"Оқу деректеріңізді Shyraq-тан тәуелсіз және тасымалданатын күйде сақтаңыз.",ru:"Сохраняйте данные обучения переносимыми и независимыми от Shyraq.",en:"Keep your learning data portable and independent from Shyraq."},
  "Complete backup ZIP": {kk:"Толық ZIP сақтық көшірмесі",ru:"Полная резервная копия ZIP",en:"Complete backup ZIP"},
  "Backup JSON": {kk:"JSON сақтық көшірмесі",ru:"Резервная копия JSON",en:"Backup JSON"},
  "Cards CSV": {kk:"Карталар CSV",ru:"Карточки CSV",en:"Cards CSV"},
  "Import JSON / CSV": {kk:"JSON / CSV импорттау",ru:"Импорт JSON / CSV",en:"Import JSON / CSV"},
  "Import Anki .apkg": {kk:"Anki .apkg импорттау",ru:"Импорт Anki .apkg",en:"Import Anki .apkg"},
  "Import": {kk:"Импорт",ru:"Импорт",en:"Import"},
  "Data portability": {kk:"Деректерді тасымалдау",ru:"Переносимость данных",en:"Data portability"},
  "Bring cards, full Shyraq backups or Anki collections into your workspace.": {kk:"Карталарды, толық Shyraq сақтық көшірмелерін немесе Anki жинақтарын жұмыс кеңістігіңізге әкеліңіз.",ru:"Импортируйте карточки, полные резервные копии Shyraq или коллекции Anki.",en:"Bring cards, full Shyraq backups or Anki collections into your workspace."},
  "Import file": {kk:"Файлды импорттау",ru:"Импортировать файл",en:"Import file"},
  "No description": {kk:"Сипаттама жоқ",ru:"Нет описания",en:"No description"},
  "Settings": {kk:"Баптаулар",ru:"Настройки",en:"Settings"},
  "Account": {kk:"Аккаунт",ru:"Аккаунт",en:"Account"},
  "Profile": {kk:"Профиль",ru:"Профиль",en:"Profile"},
  "Review settings": {kk:"Қайталау баптаулары",ru:"Настройки повторения",en:"Review settings"},
  "Sync": {kk:"Синхрондау",ru:"Синхронизация",en:"Sync"},
  "Sync conflicts": {kk:"Синхрондау қайшылықтары",ru:"Конфликты синхронизации",en:"Sync conflicts"},
  "No unresolved conflicts.": {kk:"Шешілмеген қайшылықтар жоқ.",ru:"Нет нерешённых конфликтов.",en:"No unresolved conflicts."},
  "Keep current": {kk:"Қазіргісін сақтау",ru:"Оставить текущую",en:"Keep current"},
  "Apply incoming": {kk:"Келген нұсқаны қолдану",ru:"Применить входящую",en:"Apply incoming"},
  "Moderation": {kk:"Модерация",ru:"Модерация",en:"Moderation"},
  "No reports on your public decks.": {kk:"Қоғамдық колодаларыңыз бойынша шағым жоқ.",ru:"Жалоб на ваши публичные колоды нет.",en:"No reports on your public decks."},
  "Reviewing": {kk:"Қаралуда",ru:"На проверке",en:"Reviewing"},
  "Resolve": {kk:"Шешу",ru:"Решить",en:"Resolve"},
  "Dismiss": {kk:"Қабылдамау",ru:"Отклонить",en:"Dismiss"},
  "Workspaces & collaboration": {kk:"Жұмыс кеңістіктері және бірлескен жұмыс",ru:"Рабочие пространства и совместная работа",en:"Workspaces & collaboration"},
  "Personal and team workspaces share the same Shyraq feature set.": {kk:"Жеке және командалық жұмыс кеңістіктерінде Shyraq функциялары бірдей.",ru:"Личные и командные пространства используют одинаковый набор функций Shyraq.",en:"Personal and team workspaces share the same Shyraq feature set."},
  "Create team workspace": {kk:"Командалық жұмыс кеңістігін жасау",ru:"Создать командное пространство",en:"Create team workspace"},
  "Team name": {kk:"Команда атауы",ru:"Название команды",en:"Team name"},
  "Create team": {kk:"Команда жасау",ru:"Создать команду",en:"Create team"},
  "members": {kk:"мүшелері",ru:"участники",en:"members"},
  "Owner": {kk:"Иесі",ru:"Владелец",en:"Owner"},
  "Editor": {kk:"Редактор",ru:"Редактор",en:"Editor"},
  "Reviewer": {kk:"Тексеруші",ru:"Рецензент",en:"Reviewer"},
  "Viewer": {kk:"Көруші",ru:"Наблюдатель",en:"Viewer"},
  "Remove": {kk:"Жою",ru:"Удалить",en:"Remove"},
  "Save profile": {kk:"Профильді сақтау",ru:"Сохранить профиль",en:"Save profile"},
  "Display name": {kk:"Көрсетілетін аты",ru:"Отображаемое имя",en:"Display name"},
  "Username": {kk:"Пайдаланушы аты",ru:"Имя пользователя",en:"Username"},
  "Bio": {kk:"Өзі туралы",ru:"О себе",en:"Bio"},
  "Scheduler settings": {kk:"Жоспарлаушы баптаулары",ru:"Настройки планировщика",en:"Scheduler settings"},
  "Desired retention": {kk:"Қалаулы есте сақтау деңгейі",ru:"Желаемое удержание",en:"Desired retention"},
  "Maximum interval (days)": {kk:"Максималды интервал (күн)",ru:"Максимальный интервал (дни)",en:"Maximum interval (days)"},
  "New cards / day": {kk:"Жаңа карталар / күн",ru:"Новые карточки / день",en:"New cards / day"},
  "Reviews / day": {kk:"Қайталау / күн",ru:"Повторения / день",en:"Reviews / day"},
  "Learning steps": {kk:"Үйрену қадамдары",ru:"Шаги обучения",en:"Learning steps"},
  "Relearning steps": {kk:"Қайта үйрену қадамдары",ru:"Шаги переобучения",en:"Relearning steps"},
  "Save scheduler": {kk:"Жоспарлаушыны сақтау",ru:"Сохранить настройки",en:"Save scheduler"},
  "Dashboard": {kk:"Басты бет",ru:"Главная",en:"Dashboard"},
  "Welcome back": {kk:"Қайта қош келдіңіз",ru:"С возвращением",en:"Welcome back"},
  "Start review": {kk:"Қайталауды бастау",ru:"Начать повторение",en:"Start review"},
  "Due": {kk:"Мерзімі келген",ru:"К выполнению",en:"Due"},
  "New today": {kk:"Бүгінгі жаңа",ru:"Новые сегодня",en:"New today"},
  "Reviews today": {kk:"Бүгінгі қайталау",ru:"Повторений сегодня",en:"Reviews today"},
  "Study time": {kk:"Оқу уақыты",ru:"Время обучения",en:"Study time"},
  "Study streak": {kk:"Оқу сериясы",ru:"Серия занятий",en:"Study streak"},
  "Your decks": {kk:"Сіздің колодаларыңыз",ru:"Ваши колоды",en:"Your decks"},
  "View all": {kk:"Барлығын көру",ru:"Смотреть все",en:"View all"},
  "Continue": {kk:"Жалғастыру",ru:"Продолжить",en:"Continue"},
  "Personal workspace": {kk:"Жеке жұмыс кеңістігі",ru:"Личное пространство",en:"Personal workspace"},
  "Your learning workspace is ready.": {kk:"Оқу жұмыс кеңістігіңіз дайын.",ru:"Ваше учебное пространство готово.",en:"Your learning workspace is ready."},
};

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem("shyraq-locale");
  if (saved === "kk" || saved === "ru" || saved === "en") return saved;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("kk")) return "kk";
  if (browser.startsWith("ru")) return "ru";
  return "en";
}

function translateValue(value: string, locale: Locale) {
  const trimmed = value.trim();
  const direct = ui[trimmed]?.[locale];
  if (direct) return value.replace(trimmed, direct);

  const deckCount = trimmed.match(/^(\d+) deck(s?) in your workspace\.?$/i);
  if (deckCount) {
    const n = deckCount[1];
    if (locale === "kk") return `${n} колода жұмыс кеңістігіңізде.`;
    if (locale === "ru") return `${n} колод в вашем пространстве.`;
  }
  const visible = trimmed.match(/^(\d+) visible of (\d+)\. Search, filter and edit without leaving the deck\.$/i);
  if (visible) {
    if (locale === "kk") return `${visible[1]} / ${visible[2]} көрінеді. Колодадан шықпай іздеңіз, сүзгілеңіз және өңдеңіз.`;
    if (locale === "ru") return `${visible[1]} из ${visible[2]} видимы. Ищите, фильтруйте и редактируйте прямо в колоде.`;
  }
  return value;
}

function translateDom(locale: Locale) {
  const root = document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (parent && !["SCRIPT","STYLE","TEXTAREA","INPUT","CODE","PRE"].includes(parent.tagName)) nodes.push(node as Text);
  }
  for (const text of nodes) {
    const original = text.nodeValue ?? "";
    if (!original.trim()) continue;
    text.nodeValue = translateValue(original, locale);
  }
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("input,textarea"))) {
    const placeholder = element.getAttribute("placeholder");
    if (placeholder) element.setAttribute("placeholder", translateValue(placeholder, locale));
  }
  document.title = locale === "kk" ? "Shyraq — Интервалды қайталау арқылы оқу" : locale === "ru" ? "Shyraq — Учёба с интервальными повторениями" : "Shyraq — Learn with spaced repetition";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => { setLocaleState(getInitialLocale()); }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("shyraq-locale", next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    translateDom(locale);
    const observer = new MutationObserver(() => translateDom(locale));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key: TranslationKey) => dictionaries[locale][key] ?? dictionaries.en[key],
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
