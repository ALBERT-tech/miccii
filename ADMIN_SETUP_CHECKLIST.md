# CHECKLIST: Добавление админ-панели к проекту

## ✅ Что скачать/добавить

- [ ] `admin.html` — страница входа + интерфейс
- [ ] `admin-app.js` — логика и экспорт
- [ ] `admin-styles.css` — стили админ-панели
- [ ] `ADMIN_PANEL_GUIDE.md` — документация
- [ ] `ADMIN_PANEL_SUMMARY.md` — обзор решения

## 🔧 Конфигурация (обязательно!)

Открыть `admin-app.js` и заполнить:

```javascript
// Строка ~1-3
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
                      // ↑ Замени на свой URL из Supabase Settings

const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY';
                               // ↑ Замени на Service Role Key (NOT Anon Key!)
                               // Получить: Supabase → Settings → API

const CORRECT_PASSWORD = 'admin123';
                         // ↑ Замени на свой пароль для входа
```

⚠️ **ВАЖНО:** 
- Service Role Key — только в `admin-app.js`
- Никогда не публиковать в основном коде
- Хорошая идея — хранить в .env или переменных окружения

## 📤 Git push

```bash
git add admin.html admin-app.js admin-styles.css ADMIN_PANEL_*.md
git commit -m "Add admin panel with Excel export"
git push
```

## 🌐 URL админ-панели

```
https://YOUR_USERNAME.github.io/REPO_NAME/admin.html

Пример:
https://myuser.github.io/diana-survey/admin.html
```

## ✨ Первый запуск

1. Открыть админ-панель по URL
2. Ввести пароль (тот что установил в CORRECT_PASSWORD)
3. Нажать "Войти"
4. Должна загрузиться статистика + таблица
5. Нажать "Скачать Excel" → получить файл

## 🎉 Готово!

Администраторская панель работает. Можешь выгружать данные в Excel, CSV, JSON без лишних кликов в Supabase.

---

**Общее время настройки: ~5 минут**
