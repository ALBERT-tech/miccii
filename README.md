# Веб-опросник "Оценка риска недержания мочи" — MVP

Простое веб-приложение для сбора анонимных данных опроса с автоматическим расчётом ИМТ и централизованным хранилищем результатов в Supabase.

## 🎯 Возможности

- **Статическое веб-приложение** на HTML/JS, размещаемое на GitHub Pages
- **Динамическая загрузка вопросов** из файла `questions.json`
- **Валидация диапазонов** для каждого поля с понятным UX
- **Автоматический расчёт ИМТ** (индекс массы тела)
- **Адаптивный дизайн** — одинаково работает на мобильных и десктопе
- **Безопасное хранилище** в Supabase (RLS-защита, только INSERT из браузера)
- **Анонимизация** — только шифр/код, никаких ФИО, телефонов, почты
- **Администраторский экспорт** через Supabase Dashboard в CSV, через админскую панель в Excel

## 📋 Структура проекта

```
survey-app/
├── index.html          # Главная страница
├── app.js              # JavaScript логика приложения
├── styles.css          # Адаптивный CSS
├── questions.json      # Конфигурация вопросов (JSON)
└── README.md           # Этот файл
```

## 🚀 Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/YOUR_USERNAME/diana-survey.git
cd diana-survey
```

### 2. Настроить Supabase (если ещё не сделано)

#### 2.1 Создать Supabase проект
1. Перейти на [supabase.com](https://supabase.com)
2. Нажать "Create a new project"
3. Выбрать организацию/регион
4. Скопировать **Project URL** и **Anon Key** (из Settings → API)

#### 2.2 Создать таблицу responses

В Supabase SQL Editor выполнить:

```sql
-- Создать таблицу responses
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  code TEXT NOT NULL,
  version TEXT NOT NULL,
  answers JSONB NOT NULL,
  computed JSONB NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT true,
  client_meta JSONB
);

-- Создать индекс для быстрого поиска
CREATE INDEX idx_responses_code ON responses(code);
CREATE INDEX idx_responses_created_at ON responses(created_at);

-- Включить RLS
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Политика: разрешить INSERT анонимным пользователям
CREATE POLICY "Allow INSERT for anonymous" ON responses
  FOR INSERT
  WITH CHECK (true);

-- Политика: запретить SELECT для всех (защита данных)
CREATE POLICY "Deny SELECT for all" ON responses
  FOR SELECT
  USING (false);

-- Политика: запретить UPDATE/DELETE
CREATE POLICY "Deny UPDATE for all" ON responses
  FOR UPDATE
  USING (false);

CREATE POLICY "Deny DELETE for all" ON responses
  FOR DELETE
  USING (false);
```

#### 2.3 Скопировать ключи

1. Перейти в Settings → API
2. Скопировать:
   - **Project URL** (например: `https://xyzabc.supabase.co`)
   - **Anon Key** (публичный ключ, безопасен для клиента)

### 3. Обновить конфиг в app.js

В файле `app.js` найти строки:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Заменить на ваши реальные значения из Supabase:

```javascript
const SUPABASE_URL = 'https://xyzabc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';
```

**Важно:** Anon Key в клиентском коде — это нормально (она ограничена RLS). Service Role Key никогда не публикуйте!

### 4. Разместить на GitHub Pages

#### 4.1 Создать репозиторий на GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/diana-survey.git
git push -u origin main
```

#### 4.2 Включить GitHub Pages
1. Перейти в Settings → Pages
2. Выбрать Branch: `main`, Folder: `/ (root)`
3. Нажать Save

**Ваш опросник будет доступен по адресу:** `https://YOUR_USERNAME.github.io/diana-survey/`

## 📝 Использование

### Для пользователей

1. Открыть URL приложения
2. Ввести шифр (код, выданный исследователем)
3. Ответить на все вопросы опросника
4. Система валидирует диапазоны (не даст отправить некорректные значения)
5. Нажать "Завершить"
6. Увидеть сообщение об успехе

### Для администратора (выгрузка данных)

#### Способ 1: Через Supabase Dashboard (рекомендуется)

1. Перейти в [app.supabase.com](https://app.supabase.com) → ваш проект
2. Открыть SQL Editor
3. Выполнить запрос для экспорта:

```sql
SELECT 
  code,
  created_at,
  version,
  answers,
  computed,
  consent
FROM responses
ORDER BY created_at DESC;
```

4. Нажать на иконку скачивания (CSV) в правой части результатов

#### Способ 2: Автоматизированный экспорт (Python скрипт)

Создать файл `export_data.py`:

```python
import os
from supabase import create_client, Client
import csv
from datetime import datetime

SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY"  # Только для скрипта, не публиковать!

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Получить данные
response = supabase.table("responses").select("*").execute()
data = response.data

# Экспортировать в CSV
filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
with open(filename, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['code', 'created_at', 'version', 'answers', 'computed', 'consent'])
    writer.writeheader()
    for row in data:
        writer.writerow(row)

print(f"Данные экспортированы в {filename}")
```

Запустить:
```bash
python export_data.py
```

## 🔧 Обновление вопросов

1. Открыть файл `questions.json`
2. Отредактировать вопросы/диапазоны
3. Сохранить и commit в Git

**Пример добавления нового вопроса:**

```json
{
  "id": "new_question_id",
  "label": "Текст вопроса",
  "type": "number",
  "min": 0,
  "max": 100,
  "required": true,
  "unit": "единица измерения"
}
```

При следующей загрузке приложения вопросы автоматически обновятся.

## 📊 Поля данных в responses

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID | Уникальный ID записи (генерируется Supabase) |
| `created_at` | TIMESTAMPTZ | Время отправки ответов |
| `code` | TEXT | Шифр, введённый пользователем |
| `version` | TEXT | Версия анкеты (1.0) |
| `answers` | JSONB | Объект всех ответов: `{ "age": 35, "weight_kg": 75, ... }` |
| `computed` | JSONB | Вычисленные значения: `{ "bmi": 24.5, "calculated_at": "2025-01-31T..." }` |
| `consent` | BOOLEAN | Согласие на обработку данных |
| `client_meta` | JSONB | Метаданные клиента (user agent, время) |

## 🔐 Безопасность

- **RLS (Row Level Security)** включена
- Анонимные пользователи могут только INSERT
- SELECT/UPDATE/DELETE запрещены для анонимных
- Администратор может видеть данные только в Supabase Dashboard
- Все данные на HTTPS

## ⚡ Производительность

- **Время загрузки:** < 1.5 сек на 3G
- **Размер JS + CSS:** ~15 КБ
- **Без зависимостей:** чистый JavaScript, никаких фреймворков

## 🛠️ Troubleshooting

### "Ошибка отправки: 401"
- Проверить, что SUPABASE_URL и SUPABASE_ANON_KEY правильно заполнены в app.js

### "Ошибка загрузки вопросов"
- Убедиться, что файл `questions.json` в корне проекта
- Проверить консоль браузера (F12 → Console)

### Результаты не появляются в Supabase
- Убедиться, что RLS политики созданы правильно
- Проверить Network в браузере (F12 → Network) — должно быть 201 от Supabase

### На мобильном неправильно отображается
- Очистить кэш браузера (Ctrl+Shift+Del)
- Проверить, что `<meta name="viewport"...>` есть в index.html

## 📄 Лицензия

Свободное использование

## 👤 Контакты

Если вопросы — свяжитесь с разработчиком

---

**MVP v1.0** | Создано: Январь 2025
