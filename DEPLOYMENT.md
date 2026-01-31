# DEPLOYMENT_GUIDE.md — Полное руководство по развёртыванию

## Шаг 1: Подготовка Supabase

### 1.1 Регистрация и создание проекта

1. Перейти на https://supabase.com
2. Нажать "Sign up" → завести аккаунт через GitHub/Email
3. В консоли нажать "New project"
4. Заполнить:
   - **Name:** diana-survey (или другое имя)
   - **Database password:** сложный пароль (сохранить!)
   - **Region:** выбрать ближайший к вам
5. Дождаться создания проекта (~1-2 мин)

### 1.2 Получить ключи API

После создания проекта:
1. Открыть Settings → API (в левом меню)
2. Скопировать:
   - **Project URL:** `https://xyzabc.supabase.co` — это SUPABASE_URL
   - **Anon Key:** длинная строка вроде `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...` — это SUPABASE_ANON_KEY
3. **НЕ копировать** Service Role Key (это приватный ключ)

### 1.3 Создать таблицу responses в SQL

1. Открыть SQL Editor (левое меню → SQL Editor)
2. Нажать "+ New Query"
3. Скопировать и выполнить следующий SQL:

```sql
-- 1. Создать таблицу responses
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

-- 2. Создать индексы для оптимизации
CREATE INDEX idx_responses_code ON responses(code);
CREATE INDEX idx_responses_created_at ON responses(created_at);

-- 3. Включить RLS (Row Level Security)
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- 4. Политика: разрешить INSERT для анонимных пользователей
CREATE POLICY "Allow INSERT for anonymous users" ON responses
  FOR INSERT
  WITH CHECK (true);

-- 5. Политика: запретить SELECT для всех (данные видны только админу в Supabase UI)
CREATE POLICY "Deny SELECT for all" ON responses
  FOR SELECT
  USING (false);

-- 6. Политика: запретить UPDATE
CREATE POLICY "Deny UPDATE for all" ON responses
  FOR UPDATE
  USING (false);

-- 7. Политика: запретить DELETE
CREATE POLICY "Deny DELETE for all" ON responses
  FOR DELETE
  USING (false);
```

4. Нажать кнопку "Run" (или Ctrl+Enter)
5. Если нет ошибок — всё настроено правильно

### 1.4 Проверить таблицу

1. Открыть "Database" → "Tables"
2. Убедиться, что таблица "responses" видна с полями:
   - id, created_at, code, version, answers, computed, consent, client_meta

## Шаг 2: Подготовить код приложения

### 2.1 Скачать файлы

Скачать все файлы проекта:
- index.html
- app.js
- styles.css
- questions.json
- README.md

### 2.2 Обновить app.js с реальными ключами

Открыть `app.js` и найти строки в начале файла:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

**Заменить на ваши ключи:**

```javascript
const SUPABASE_URL = 'https://xyzabc.supabase.co';  // Ваше Project URL
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';  // Ваш Anon Key
```

⚠️ **Важно:** Anon Key в клиентском коде — это нормально и безопасно (она ограничена RLS).

## Шаг 3: Разместить на GitHub Pages

### 3.1 Создать репозиторий на GitHub

1. Перейти на https://github.com/new
2. Заполнить:
   - **Repository name:** diana-survey
   - **Description:** Survey app for urinary incontinence risk assessment
   - **Public** (важно!)
   - **Add a README file:** НЕ выбирать (у нас уже есть)
3. Нажать "Create repository"

### 3.2 Загрузить файлы проекта

Способ 1 — через Git (рекомендуется):

```bash
# 1. Создать локальную папку и перейти в неё
mkdir diana-survey
cd diana-survey

# 2. Инициализировать Git
git init
git branch -M main

# 3. Добавить удалённый репозиторий
git remote add origin https://github.com/YOUR_USERNAME/diana-survey.git

# 4. Скопировать все файлы проекта в эту папку:
# - index.html
# - app.js
# - styles.css
# - questions.json
# - README.md
# - DEPLOYMENT_GUIDE.md (этот файл)

# 5. Добавить файлы в Git
git add .

# 6. Создать коммит
git commit -m "Initial commit: MVP survey app"

# 7. Загрузить в GitHub
git push -u origin main
```

Способ 2 — через веб-интерфейс GitHub:
1. Нажать "uploading an existing file"
2. Drag & drop все файлы
3. Нажать "Commit changes"

### 3.3 Включить GitHub Pages

1. Перейти на страницу репозитория → Settings
2. В левом меню нажать "Pages"
3. Под "Build and deployment":
   - **Source:** GitHub Actions (новый способ) или Deploy from branch
   - **Branch:** main / root
   - Нажать Save

4. Подождать ~1 минуту
5. Страница обновится и покажет:
   > Your site is live at https://YOUR_USERNAME.github.io/diana-survey/

**Это и есть ваш опросник!**

## Шаг 4: Тестирование

### 4.1 Локальное тестирование

Перед тем как выкладывать в GitHub, протестировать локально:

```bash
# Если у вас есть Python
python -m http.server 8000

# Или Node.js
npx http-server

# Или просто открыть файл в браузере
# Но ВНИМАНИЕ: локальное открытие может не работать с fetch() из-за CORS
```

### 4.2 Тестирование на GitHub Pages

1. Открыть https://YOUR_USERNAME.github.io/diana-survey/
2. Ввести тестовый шифр, например: `TEST001`
3. Заполнить все поля (валидные значения в диапазонах)
4. Нажать "Завершить"
5. Должно появиться сообщение об успехе

### 4.3 Проверка данных в Supabase

1. Перейти в Supabase → Database → responses
2. Нажать "Edit records"
3. Должна появиться строка с кодом `TEST001`
4. Проверить, что поля заполнены правильно:
   - answers: JSON с ответами
   - computed: JSON с ИМТ

## Шаг 5: Администрирование — выгрузка данных

### 5.1 Быстрый экспорт через Supabase Dashboard

1. Открыть Supabase → Database → Tables → responses
2. Нажать на иконку трёх точек (⋮) → "Edit records"
3. Нажать на иконку скачивания (↓) — экспортируется CSV

### 5.2 SQL запрос для кастомной выгрузки

Если нужны только определённые столбцы:

```sql
-- Выгрузить все ответы с расчётами
SELECT 
  code,
  created_at,
  answers,
  computed->>'bmi' as bmi,
  consent
FROM responses
ORDER BY created_at DESC;
```

1. Открыть SQL Editor → New Query
2. Скопировать запрос выше
3. Нажать "Run"
4. Нажать на иконку скачивания (CSV, JSON, etc.)

### 5.3 Программный экспорт (Python)

Создать файл `export_responses.py`:

```python
#!/usr/bin/env python3

import os
import csv
import json
from datetime import datetime
from supabase import create_client, Client

# ВАЖНО: Service Role Key нужно получить из Supabase Settings → API
# Это НЕ публичный ключ! Храните его в переменных окружения
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Ошибка: установите переменные окружения")
    print("export SUPABASE_URL='https://xyzabc.supabase.co'")
    print("export SUPABASE_SERVICE_KEY='YOUR_SERVICE_ROLE_KEY'")
    exit(1)

# Подключиться к Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Получить все записи
print("Загружаю данные...")
response = supabase.table("responses").select("*").order("created_at", desc=True).execute()
data = response.data

if not data:
    print("Нет данных для экспорта")
    exit(0)

# Создать CSV файл
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
filename = f"responses_export_{timestamp}.csv"

with open(filename, 'w', newline='', encoding='utf-8') as f:
    # Заголовки
    fieldnames = ['code', 'created_at', 'version', 'bmi', 'answers_json', 'consent']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    
    # Строки
    for row in data:
        bmi = row['computed'].get('bmi', 'N/A') if row['computed'] else 'N/A'
        writer.writerow({
            'code': row['code'],
            'created_at': row['created_at'],
            'version': row['version'],
            'bmi': bmi,
            'answers_json': json.dumps(row['answers'], ensure_ascii=False),
            'consent': row['consent']
        })

print(f"✓ Экспортировано {len(data)} записей")
print(f"✓ Сохранено в: {filename}")
```

Использование:
```bash
# Установить Supabase CLI
pip install supabase

# Установить переменные окружения
export SUPABASE_URL='https://xyzabc.supabase.co'
export SUPABASE_SERVICE_KEY='ey...' # Service Role Key

# Запустить экспорт
python export_responses.py
```

## Шаг 6: Безопасность и обслуживание

### 6.1 Защита Service Role Key

**НИКОГДА НЕ публикуйте Service Role Key!** Используйте её только в локальных скриптах.

Если случайно опубликовали:
1. Открыть Supabase → Settings → API
2. Нажать на Service Role Key → "Rotate"
3. Key будет заменён (старый больше не работает)

### 6.2 Мониторинг

В Supabase можно настроить:
1. Уведомления о новых записях
2. Автоматическое резервное копирование
3. Логирование всех операций

### 6.3 Обновление вопросов

Если нужно обновить опросник:

1. Отредактировать `questions.json` в GitHub
2. Commit и push
3. GitHub Pages автоматически обновит файл (~1 мин)
4. При следующей загрузке приложения пользователи увидят новые вопросы

### 6.4 Резервная копия данных

Регулярно скачивать CSV:

```bash
# Скрипт для еженедельного бэкапа
#!/bin/bash
DATE=$(date +%Y%m%d)
curl -X GET \
  "https://YOUR_PROJECT.supabase.co/rest/v1/responses?select=*" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "apikey: YOUR_SERVICE_KEY" \
  > backup_$DATE.json
```

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| 401 ошибка при отправке | Проверить SUPABASE_URL и SUPABASE_ANON_KEY в app.js |
| Таблица не видна в Supabase | Обновить страницу (F5) или перезагрузиться |
| GitHub Pages не обновляется | Очистить кэш браузера (Ctrl+Shift+Del) |
| На мобильном не работает | Проверить мета-тег viewport в index.html |
| RLS политики не работают | Убедиться, что RLS включена (ALTER TABLE ... ENABLE ROW LEVEL SECURITY) |

## Дополнительные ресурсы

- Документация Supabase: https://supabase.com/docs
- GitHub Pages: https://pages.github.com/
- MDN Web Docs: https://developer.mozilla.org/

---

**Версия:** 1.0  
**Последнее обновление:** Январь 2025
