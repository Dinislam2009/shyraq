"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";

const translations: Record<string, Record<"kk" | "ru" | "en", string>> = {
  "Add card": { kk: "Карта қосу", ru: "Добавить карточку", en: "Add card" },
  "Edit card": { kk: "Картаны өңдеу", ru: "Редактировать карточку", en: "Edit card" },
  "Full editor with formatting, media, templates and live preview.": { kk: "Пішімдеу, медиа, шаблондар және тікелей алдын ала қарауы бар толық редактор.", ru: "Полный редактор с форматированием, медиа, шаблонами и предпросмотром.", en: "Full editor with formatting, media, templates and live preview." },
  "Save card": { kk: "Картаны сақтау", ru: "Сохранить карточку", en: "Save card" },
  "Save changes": { kk: "Өзгерістерді сақтау", ru: "Сохранить изменения", en: "Save changes" },
  "Template": { kk: "Шаблон", ru: "Шаблон", en: "Template" },
  "Default": { kk: "Әдепкі", ru: "По умолчанию", en: "Default" },
  "Card type": { kk: "Карта түрі", ru: "Тип карточки", en: "Card type" },
  "Basic": { kk: "Қарапайым", ru: "Базовая", en: "Basic" },
  "Reverse": { kk: "Кері", ru: "Обратная", en: "Reverse" },
  "Cloze": { kk: "Бос орынды толтыру", ru: "Cloze", en: "Cloze" },
  "Multiple choice": { kk: "Бірнеше жауап", ru: "Несколько вариантов", en: "Multiple choice" },
  "Image": { kk: "Сурет", ru: "Изображение", en: "Image" },
  "Custom": { kk: "Арнайы", ru: "Пользовательская", en: "Custom" },
  "Format": { kk: "Пішім", ru: "Формат", en: "Format" },
  "Bold": { kk: "Қалың", ru: "Жирный", en: "Bold" },
  "Italic": { kk: "Көлбеу", ru: "Курсив", en: "Italic" },
  "Inline code": { kk: "Жол ішіндегі код", ru: "Код в строке", en: "Inline code" },
  "Code block": { kk: "Код блогы", ru: "Блок кода", en: "Code block" },
  "LaTeX": { kk: "LaTeX", ru: "LaTeX", en: "LaTeX" },
  "List": { kk: "Тізім", ru: "Список", en: "List" },
  "Explanation": { kk: "Түсіндірме", ru: "Пояснение", en: "Explanation" },
  "Options": { kk: "Нұсқалар", ru: "Варианты", en: "Options" },
  "Correct option index": { kk: "Дұрыс нұсқа индексі", ru: "Индекс правильного варианта", en: "Correct option index" },
  "Media file": { kk: "Медиа файлы", ru: "Медиафайл", en: "Media file" },
  "Maximum 25 MB.": { kk: "Ең көбі 25 МБ.", ru: "Максимум 25 МБ.", en: "Maximum 25 MB." },
  "Image URL": { kk: "Сурет URL-і", ru: "URL изображения", en: "Image URL" },
  "Image occlusion": { kk: "Суретті жабу", ru: "Скрытие области изображения", en: "Image occlusion" },
  "Live preview": { kk: "Тікелей алдын ала қарау", ru: "Предпросмотр", en: "Live preview" },
  "Start typing...": { kk: "Жаза бастаңыз...", ru: "Начните вводить...", en: "Start typing..." },
  "Your answer will appear here.": { kk: "Жауабыңыз осы жерде көрінеді.", ru: "Ваш ответ появится здесь.", en: "Your answer will appear here." },
  "Save and add next card": { kk: "Сақтап, келесі картаны қосу", ru: "Сохранить и добавить следующую", en: "Save and add next card" },
  "Card templates": { kk: "Карта шаблондары", ru: "Шаблоны карточек", en: "Card templates" },
  "Use {{front}} and {{back}} as the default fields, then add your own markup/CSS.": { kk: "{{front}} және {{back}} өрістерін әдепкі ретінде қолданыңыз, кейін өз markup/CSS кодын қосыңыз.", ru: "Используйте {{front}} и {{back}} как поля по умолчанию, затем добавьте свой markup/CSS.", en: "Use {{front}} and {{back}} as the default fields, then add your own markup/CSS." },
  "Template name": { kk: "Шаблон атауы", ru: "Название шаблона", en: "Template name" },
  "Optional card CSS": { kk: "Қосымша карта CSS-і", ru: "Необязательный CSS карточки", en: "Optional card CSS" },
  "Create template": { kk: "Шаблон жасау", ru: "Создать шаблон", en: "Create template" },
  "Delete": { kk: "Жою", ru: "Удалить", en: "Delete" },
  "Save": { kk: "Сақтау", ru: "Сохранить", en: "Save" },
  "Join a Shyraq workspace": { kk: "Shyraq жұмыс кеңістігіне қосылу", ru: "Присоединиться к рабочему пространству Shyraq", en: "Join a Shyraq workspace" },
  "Accept the invitation to collaborate with the workspace owner.": { kk: "Жұмыс кеңістігінің иесімен бірге жұмыс істеу үшін шақыруды қабылдаңыз.", ru: "Примите приглашение для совместной работы с владельцем рабочего пространства.", en: "Accept the invitation to collaborate with the workspace owner." },
  "Accept invitation": { kk: "Шақыруды қабылдау", ru: "Принять приглашение", en: "Accept invitation" },
  "Shyraq creator": { kk: "Shyraq авторы", ru: "Автор Shyraq", en: "Shyraq creator" },
  "cards": { kk: "карта", ru: "карточек", en: "cards" },
  "Reviews": { kk: "Қайталаулар", ru: "Повторения", en: "Reviews" },
  "Accuracy": { kk: "Дәлдік", ru: "Точность", en: "Accuracy" },
  "Study time": { kk: "Оқу уақыты", ru: "Время обучения", en: "Study time" },
  "Avg/card": { kk: "Орташа/карта", ru: "Среднее/карточка", en: "Avg/card" },
  "Tracked days": { kk: "Бақыланған күндер", ru: "Отслеженные дни", en: "Tracked days" },
  "recorded responses": { kk: "тіркелген жауап", ru: "зафиксированных ответов", en: "recorded responses" },
  "reviews": { kk: "қайталау", ru: "повторений", en: "reviews" },
  "min": { kk: "мин", ru: "мин", en: "min" },
  "accuracy": { kk: "дәлдік", ru: "точность", en: "accuracy" },
  "again": { kk: "қайта", ru: "снова", en: "again" },
  "hard": { kk: "қиын", ru: "сложно", en: "hard" },
  "good": { kk: "жақсы", ru: "хорошо", en: "good" },
  "easy": { kk: "оңай", ru: "легко", en: "easy" },
  "Personal workspace": { kk: "Жеке жұмыс кеңістігі", ru: "Личное рабочее пространство", en: "Personal workspace" },
  "Your learning workspace is ready.": { kk: "Оқу жұмыс кеңістігіңіз дайын.", ru: "Ваше учебное пространство готово.", en: "Your learning workspace is ready." },
  "Start review": { kk: "Қайталауды бастау", ru: "Начать повторение", en: "Start review" },
  "Due": { kk: "Мерзімі келген", ru: "К повторению", en: "Due" },
  "cards due or overdue": { kk: "қайталауға келген карта", ru: "карточек к повторению", en: "cards due or overdue" },
  "New today": { kk: "Бүгінгі жаңа", ru: "Новые сегодня", en: "New today" },
  "new cards reviewed": { kk: "жаңа карта қайталанды", ru: "новых карточек повторено", en: "new cards reviewed" },
  "Reviews today": { kk: "Бүгінгі қайталаулар", ru: "Повторения сегодня", en: "Reviews today" },
  "responses recorded": { kk: "жауап тіркелді", ru: "ответов записано", en: "responses recorded" },
  "Study streak": { kk: "Оқу сериясы", ru: "Серия обучения", en: "Study streak" },
  "days in a row": { kk: "күн қатарынан", ru: "дней подряд", en: "days in a row" },
  "30-day reviews": { kk: "30 күндік қайталау", ru: "Повторения за 30 дней", en: "30-day reviews" },
  "See statistics": { kk: "Статистиканы көру", ru: "Смотреть статистику", en: "See statistics" },
  "open detailed analytics": { kk: "Толық талдауды ашу", ru: "Открыть подробную аналитику", en: "open detailed analytics" },
  "Continue": { kk: "Жалғастыру", ru: "Продолжить", en: "Continue" },
  "resume your queue": { kk: "кезегіңізді жалғастырыңыз", ru: "продолжить очередь", en: "resume your queue" },
  "Your decks": { kk: "Сіздің колодаларыңыз", ru: "Ваши колоды", en: "Your decks" },
  "View all": { kk: "Барлығын көру", ru: "Посмотреть все", en: "View all" },
  "No decks yet": { kk: "Әзірге колода жоқ", ru: "Колод пока нет", en: "No decks yet" },
  "Create your first deck and start adding cards.": { kk: "Алғашқы колодаңызды жасап, карталар қосуды бастаңыз.", ru: "Создайте первую колоду и начните добавлять карточки.", en: "Create your first deck and start adding cards." },
  "Welcome back,": { kk: "Қайта қош келдіңіз,", ru: "С возвращением,", en: "Welcome back," },
  "Library": { kk: "Кітапхана", ru: "Библиотека", en: "Library" },
  "Collections": { kk: "Жинақтар", ru: "Коллекции", en: "Collections" },
  "Group important cards without changing their deck.": { kk: "Маңызды карталарды колодасын өзгертпей топтаңыз.", ru: "Группируйте важные карточки без изменения их колоды.", en: "Group important cards without changing their deck." },
  "New collection name": { kk: "Жаңа жинақ атауы", ru: "Название новой коллекции", en: "New collection name" },
  "Create": { kk: "Жасау", ru: "Создать", en: "Create" },
  "Templates": { kk: "Шаблондар", ru: "Шаблоны", en: "Templates" },
  "Study": { kk: "Оқу", ru: "Учить", en: "Study" },
  "Author update available": { kk: "Автор жаңартуы қолжетімді", ru: "Доступно обновление от автора", en: "Author update available" },
  "Review & accept update": { kk: "Жаңартуды қарап, қабылдау", ru: "Просмотреть и принять", en: "Review & accept update" },
  "No cards yet": { kk: "Әзірге карта жоқ", ru: "Карточек пока нет", en: "No cards yet" },
  "Add your first card": { kk: "Алғашқы картаңызды қосыңыз", ru: "Добавьте первую карточку", en: "Add your first card" },
  "No description": { kk: "Сипаттама жоқ", ru: "Нет описания", en: "No description" },
  "Cards": { kk: "Карталар", ru: "Карточки", en: "Cards" },
  "Visibility": { kk: "Көрінуі", ru: "Видимость", en: "Visibility" },
  "Status": { kk: "Күйі", ru: "Статус", en: "Status" },
  "Active": { kk: "Белсенді", ru: "Активна", en: "Active" },
  "Create deck": { kk: "Колода жасау", ru: "Создать колоду", en: "Create deck" },
  "Choose where this deck belongs.": { kk: "Бұл колоданың қайда тиесілі екенін таңдаңыз.", ru: "Выберите, где будет находиться эта колода.", en: "Choose where this deck belongs." },
  "Workspace": { kk: "Жұмыс кеңістігі", ru: "Рабочее пространство", en: "Workspace" },
  "Name": { kk: "Аты", ru: "Имя", en: "Name" },
  "Description": { kk: "Сипаттама", ru: "Описание", en: "Description" },
  "What are you learning?": { kk: "Нені үйреніп жатырсыз?", ru: "Что вы изучаете?", en: "What are you learning?" },
  "Cancel": { kk: "Бас тарту", ru: "Отмена", en: "Cancel" },
  "Back": { kk: "Артқа", ru: "Назад", en: "Back" },
  "Back to decks": { kk: "Колодаларға оралу", ru: "Назад к колодам", en: "Back to decks" },
  "My decks": { kk: "Менің колодаларым", ru: "Мои колоды", en: "My decks" },
  "New deck": { kk: "Жаңа колода", ru: "Новая колода", en: "New deck" },
  "deck": { kk: "колода", ru: "колода", en: "deck" },
  "decks": { kk: "колода", ru: "колод", en: "decks" },
  "in your workspace.": { kk: "жұмыс кеңістігіңізде.", ru: "в вашем рабочем пространстве.", en: "in your workspace." },
  "Public deck": { kk: "Қоғамдық колода", ru: "Публичная колода", en: "Public deck" },
  "Follow": { kk: "Жазылу", ru: "Подписаться", en: "Follow" },
  "Copy to my decks": { kk: "Менің колодаларыма көшіру", ru: "Копировать в мои колоды", en: "Copy to my decks" },
  "Report this deck": { kk: "Бұл колодаға шағымдану", ru: "Пожаловаться на эту колоду", en: "Report this deck" },
  "Reason": { kk: "Себеп", ru: "Причина", en: "Reason" },
  "Copyright": { kk: "Авторлық құқық", ru: "Авторские права", en: "Copyright" },
  "Spam": { kk: "Спам", ru: "Спам", en: "Spam" },
  "Unsafe content": { kk: "Қауіпті контент", ru: "Небезопасный контент", en: "Unsafe content" },
  "Misleading": { kk: "Жаңылыстыратын", ru: "Вводящий в заблуждение", en: "Misleading" },
  "Other": { kk: "Басқа", ru: "Другое", en: "Other" },
  "Submit report": { kk: "Шағым жіберу", ru: "Отправить жалобу", en: "Submit report" },
  "Front": { kk: "Алдыңғы бет", ru: "Лицевая сторона", en: "Front" },
  "Community": { kk: "Қауымдастық", ru: "Сообщество", en: "Community" },
  "Public decks": { kk: "Қоғамдық колодалар", ru: "Публичные колоды", en: "Public decks" },
  "Browse decks shared by Shyraq creators.": { kk: "Shyraq авторлары бөліскен колодаларды қараңыз.", ru: "Просматривайте колоды, которыми поделились авторы Shyraq.", en: "Browse decks shared by Shyraq creators." },
  "No public decks match your search.": { kk: "Іздеуіңізге сәйкес қоғамдық колода жоқ.", ru: "Публичных колод по вашему запросу нет.", en: "No public decks match your search." },
  "Search decks...": { kk: "Колодаларды іздеу...", ru: "Поиск колод...", en: "Search decks..." },
  "Data": { kk: "Деректер", ru: "Данные", en: "Data" },
  "Import & export": { kk: "Импорт және экспорт", ru: "Импорт и экспорт", en: "Import & export" },
  "Keep your learning data portable and independent from Shyraq.": { kk: "Оқу деректеріңізді тасымалдауға және Shyraq-тан тәуелсіз сақтауға болады.", ru: "Храните учебные данные переносимыми и независимыми от Shyraq.", en: "Keep your learning data portable and independent from Shyraq." },
  "Complete backup ZIP": { kk: "Толық ZIP сақтық көшірме", ru: "Полная ZIP-резервная копия", en: "Complete backup ZIP" },
  "Backup JSON": { kk: "JSON сақтық көшірме", ru: "Резервная копия JSON", en: "Backup JSON" },
  "Cards CSV": { kk: "CSV карталары", ru: "Карточки CSV", en: "Cards CSV" },
  "Import JSON / CSV": { kk: "JSON / CSV импорттау", ru: "Импорт JSON / CSV", en: "Import JSON / CSV" },
  "Import Anki .apkg": { kk: "Anki .apkg импорттау", ru: "Импорт Anki .apkg", en: "Import Anki .apkg" },
  "Import": { kk: "Импорт", ru: "Импорт", en: "Import" },
  "Import file": { kk: "Файл импорттау", ru: "Импортировать файл", en: "Import file" },
  "Import Anki deck": { kk: "Anki колодасын импорттау", ru: "Импортировать колоду Anki", en: "Import Anki deck" },
  "Import .apkg": { kk: ".apkg импорттау", ru: "Импорт .apkg", en: "Import .apkg" },
  "Insights": { kk: "Талдау", ru: "Аналитика", en: "Insights" },
  "Statistics": { kk: "Статистика", ru: "Статистика", en: "Statistics" },
  "Review history, answer distribution, timing and deck-level performance.": { kk: "Қайталау тарихы, жауаптар бөлінісі, уақыт және колода нәтижелілігі.", ru: "История повторений, распределение ответов, время и результаты колод.", en: "Review history, answer distribution, timing and deck-level performance." },
  "Last 30 days": { kk: "Соңғы 30 күн", ru: "Последние 30 дней", en: "Last 30 days" },
  "Reviews per day": { kk: "Күніне қайталау", ru: "Повторений в день", en: "Reviews per day" },
  "Answer distribution": { kk: "Жауаптар бөлінісі", ru: "Распределение ответов", en: "Answer distribution" },
  "Deck performance": { kk: "Колода нәтижелілігі", ru: "Результативность колод", en: "Deck performance" },
  "Top 20 decks by review activity.": { kk: "Қайталау белсенділігі бойынша үздік 20 колода.", ru: "Топ-20 колод по активности повторений.", en: "Top 20 decks by review activity." },
  "No deck-level review data yet.": { kk: "Колода бойынша қайталау деректері әзірге жоқ.", ru: "Данных по повторениям колод пока нет.", en: "No deck-level review data yet." },
  "Daily detail": { kk: "Күнделікті мәлімет", ru: "Детали по дням", en: "Daily detail" },
  "Account": { kk: "Аккаунт", ru: "Аккаунт", en: "Account" },
  "Settings": { kk: "Баптаулар", ru: "Настройки", en: "Settings" },
  "Account, review, sync and data controls.": { kk: "Аккаунт, қайталау, синхрондау және деректерді басқару.", ru: "Аккаунт, повторение, синхронизация и управление данными.", en: "Account, review, sync and data controls." },
  "Email and profile": { kk: "Email және профиль", ru: "Email и профиль", en: "Email and profile" },
  "FSRS scheduler defaults and review behavior": { kk: "FSRS жоспарлаушысы және қайталау тәртібі", ru: "Настройки планировщика FSRS и поведение повторений", en: "FSRS scheduler defaults and review behavior" },
  "Offline changes and device synchronization": { kk: "Офлайн өзгерістер және құрылғыларды синхрондау", ru: "Офлайн-изменения и синхронизация устройств", en: "Offline changes and device synchronization" },
  "Sync": { kk: "Синхрондау", ru: "Синхронизация", en: "Sync" },
  "Data portability": { kk: "Деректерді тасымалдау", ru: "Перенос данных", en: "Data portability" },
  "Profile": { kk: "Профиль", ru: "Профиль", en: "Profile" },
  "Control the identity shown on public decks.": { kk: "Қоғамдық колодаларда көрсетілетін профиліңізді басқарыңыз.", ru: "Управляйте данными профиля, отображаемыми в публичных колодах.", en: "Control the identity shown on public decks." },
  "Display name": { kk: "Көрсетілетін аты", ru: "Отображаемое имя", en: "Display name" },
  "Username": { kk: "Пайдаланушы аты", ru: "Имя пользователя", en: "Username" },
  "Bio": { kk: "Өзіңіз туралы", ru: "О себе", en: "Bio" },
  "Save profile": { kk: "Профильді сақтау", ru: "Сохранить профиль", en: "Save profile" },
  "Review": { kk: "Қайталау", ru: "Повторение", en: "Review" },
  "Scheduler settings": { kk: "Жоспарлаушы баптаулары", ru: "Настройки планировщика", en: "Scheduler settings" },
  "Desired retention": { kk: "Қалаған есте сақтау деңгейі", ru: "Желаемое удержание", en: "Desired retention" },
  "New cards / day": { kk: "Күніне жаңа карталар", ru: "Новых карточек / день", en: "New cards / day" },
  "Reviews / day": { kk: "Күніне қайталау", ru: "Повторений / день", en: "Reviews / day" },
  "Learning steps": { kk: "Үйрену қадамдары", ru: "Шаги обучения", en: "Learning steps" },
  "Relearning steps": { kk: "Қайта үйрену қадамдары", ru: "Шаги переобучения", en: "Relearning steps" },
  "Review buttons": { kk: "Қайталау батырмалары", ru: "Кнопки повторения", en: "Review buttons" },
  "Button order": { kk: "Батырмалар реті", ru: "Порядок кнопок", en: "Button order" },
  "Save scheduler": { kk: "Жоспарлаушыны сақтау", ru: "Сохранить планировщик", en: "Save scheduler" },
  "Sync conflicts": { kk: "Синхрондау қайшылықтары", ru: "Конфликты синхронизации", en: "Sync conflicts" },
  "No unresolved conflicts.": { kk: "Шешілмеген қайшылықтар жоқ.", ru: "Неразрешённых конфликтов нет.", en: "No unresolved conflicts." },
  "Keep current": { kk: "Қазіргісін сақтау", ru: "Оставить текущий", en: "Keep current" },
  "Apply incoming": { kk: "Келгенін қолдану", ru: "Применить входящие", en: "Apply incoming" },
  "No workspace found.": { kk: "Жұмыс кеңістігі табылмады.", ru: "Рабочее пространство не найдено.", en: "No workspace found." },
  "Workspaces & collaboration": { kk: "Жұмыс кеңістіктері және бірлесу", ru: "Рабочие пространства и совместная работа", en: "Workspaces & collaboration" },
  "Create team workspace": { kk: "Командалық жұмыс кеңістігін жасау", ru: "Создать командное пространство", en: "Create team workspace" },
  "Create team": { kk: "Команда жасау", ru: "Создать команду", en: "Create team" },
  "Owner": { kk: "Иесі", ru: "Владелец", en: "Owner" },
  "Editor": { kk: "Редактор", ru: "Редактор", en: "Editor" },
  "Reviewer": { kk: "Тексеруші", ru: "Рецензент", en: "Reviewer" },
  "Viewer": { kk: "Көруші", ru: "Наблюдатель", en: "Viewer" },
  "Remove": { kk: "Жою", ru: "Удалить", en: "Remove" },
  "No reports on your public decks.": { kk: "Қоғамдық колодаларыңызға шағым жоқ.", ru: "Жалоб на ваши публичные колоды нет.", en: "No reports on your public decks." },
  "Reviewing": { kk: "Қаралуда", ru: "На проверке", en: "Reviewing" },
  "Resolve": { kk: "Шешу", ru: "Решить", en: "Resolve" },
  "Dismiss": { kk: "Қабылдамау", ru: "Отклонить", en: "Dismiss" },
  "Sign out": { kk: "Шығу", ru: "Выйти", en: "Sign out" },
};

function normalize(s: string) { return s.replace(/\s+/g, " ").trim(); }

function dynamicTranslation(raw: string, locale: "kk" | "ru" | "en") {
  let m = raw.match(/^(\\d+) cards$/); if (m) return `${m[1]} ${locale === "kk" ? "карта" : locale === "ru" ? "карточек" : "cards"}`;
  m = raw.match(/^(\\d+) reviews$/); if (m) return `${m[1]} ${locale === "kk" ? "қайталау" : locale === "ru" ? "повторений" : "reviews"}`;
  m = raw.match(/^(\\d+) responses recorded$/); if (m) return `${m[1]} ${locale === "kk" ? "жауап тіркелді" : locale === "ru" ? "ответов записано" : "responses recorded"}`;
  m = raw.match(/^(\\d+) min$/); if (m) return `${m[1]} ${locale === "kk" ? "мин" : "min"}`;
  return null;
}

export function GlobalTranslator() {
  const { locale } = useI18n();
  useEffect(() => {
    const translate = () => {
      document.querySelectorAll("[data-shyraq-i18n]").forEach((node) => {
        const el = node as HTMLElement;
        const key = el.getAttribute("data-shyraq-i18n");
        if (key && translations[key]) el.textContent = translations[key][locale];
      });
      document.querySelectorAll("body *").forEach((el) => {
        if (el.children.length > 0) return;
        const node = el.firstChild;
        if (!node || node.nodeType !== Node.TEXT_NODE) return;
        const raw = normalize(node.textContent || "");
        if (!raw) return;
        const key = Object.prototype.hasOwnProperty.call(translations, raw) ? raw : Object.keys(translations).find(k => translations[k].kk === raw || translations[k].ru === raw || translations[k].en === raw);
        if (key) node.textContent = translations[key][locale];
      });
      document.querySelectorAll<HTMLElement>("input[placeholder],textarea[placeholder]").forEach((el) => {
        const raw = el.getAttribute("data-shyraq-placeholder") || el.getAttribute("placeholder") || "";
        const key = Object.keys(translations).find(k => k === raw || translations[k].kk === raw || translations[k].ru === raw || translations[k].en === raw);
        if (key) { el.setAttribute("data-shyraq-placeholder", key); el.setAttribute("placeholder", translations[key][locale]); }
      });
    };
    translate();
    const observer = new MutationObserver(() => translate());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);
  return null;
}
