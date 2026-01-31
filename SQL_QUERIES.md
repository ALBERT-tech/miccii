# SQL QUERIES — Полезные запросы для администратора

Все запросы выполняются в Supabase → SQL Editor.

## 1. Базовые выборки

### 1.1 Все ответы (полная таблица)
```sql
SELECT * FROM responses ORDER BY created_at DESC;
```

### 1.2 Только основные данные
```sql
SELECT 
  code,
  created_at,
  version,
  consent
FROM responses
ORDER BY created_at DESC;
```

### 1.3 Ответы с расчётом ИМТ
```sql
SELECT 
  code,
  created_at,
  computed->>'bmi' as bmi,
  (answers->>'weight_kg')::FLOAT as weight_kg,
  (answers->>'height_cm')::FLOAT as height_cm
FROM responses
ORDER BY created_at DESC;
```

## 2. Аналитика

### 2.1 Количество ответов по датам
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_responses
FROM responses
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2.2 Статистика по ИМТ
```sql
SELECT 
  COUNT(*) as total,
  ROUND(AVG((computed->>'bmi')::FLOAT)::NUMERIC, 1) as avg_bmi,
  MIN((computed->>'bmi')::FLOAT) as min_bmi,
  MAX((computed->>'bmi')::FLOAT) as max_bmi
FROM responses;
```

### 2.3 Распределение возрастов
```sql
SELECT 
  CASE 
    WHEN (answers->>'age')::INT < 30 THEN '18-29'
    WHEN (answers->>'age')::INT < 40 THEN '30-39'
    WHEN (answers->>'age')::INT < 50 THEN '40-49'
    WHEN (answers->>'age')::INT < 60 THEN '50-59'
    ELSE '60+'
  END as age_group,
  COUNT(*) as count
FROM responses
GROUP BY age_group
ORDER BY age_group;
```

### 2.4 Средние значения основных параметров
```sql
SELECT 
  ROUND(AVG((answers->>'age')::FLOAT)::NUMERIC, 1) as avg_age,
  ROUND(AVG((answers->>'weight_kg')::FLOAT)::NUMERIC, 1) as avg_weight,
  ROUND(AVG((answers->>'height_cm')::FLOAT)::NUMERIC, 1) as avg_height,
  ROUND(AVG((answers->>'waist_circumference')::FLOAT)::NUMERIC, 1) as avg_waist
FROM responses;
```

## 3. Фильтрация и поиск

### 3.1 Ответы конкретного пользователя (по коду)
```sql
SELECT * FROM responses WHERE code = 'TEST001';
```

### 3.2 Ответы за конкретную дату
```sql
SELECT * FROM responses 
WHERE DATE(created_at) = '2025-01-31'
ORDER BY created_at DESC;
```

### 3.3 Ответы за период
```sql
SELECT * FROM responses 
WHERE created_at >= '2025-01-01' AND created_at < '2025-02-01'
ORDER BY created_at DESC;
```

### 3.4 Ответы с ИМТ в определённом диапазоне
```sql
SELECT 
  code,
  created_at,
  computed->>'bmi' as bmi
FROM responses 
WHERE (computed->>'bmi')::FLOAT BETWEEN 25 AND 30
ORDER BY created_at DESC;
```

### 3.5 Respondents с высоким индексом недержания
```sql
SELECT 
  code,
  created_at,
  (answers->>'incontinence_episodes')::INT as incontinence_episodes
FROM responses 
WHERE (answers->>'incontinence_episodes')::INT > 5
ORDER BY incontinence_episodes DESC;
```

## 4. Экспорт и трансформация

### 4.1 Экспорт в CSV-совместимый формат
```sql
SELECT 
  code,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
  answers->>'age' as age,
  answers->>'births' as births,
  answers->>'weight_kg' as weight,
  answers->>'height_cm' as height,
  answers->>'waist_circumference' as waist,
  computed->>'bmi' as bmi,
  consent
FROM responses
ORDER BY created_at DESC;
```

### 4.2 JSON-вид для обработки в других системах
```sql
SELECT 
  jsonb_build_object(
    'code', code,
    'created_at', created_at,
    'answers', answers,
    'computed', computed,
    'consent', consent
  ) as survey_data
FROM responses
ORDER BY created_at DESC;
```

## 5. Проверка целостности данных

### 5.1 Поиск дублей по коду и дате
```sql
SELECT 
  code,
  DATE(created_at) as date,
  COUNT(*) as duplicates
FROM responses
GROUP BY code, DATE(created_at)
HAVING COUNT(*) > 1
ORDER BY duplicates DESC;
```

### 5.2 Проверка обязательных полей
```sql
SELECT 
  code,
  created_at,
  CASE WHEN answers IS NULL THEN 'Missing answers' END as issue
FROM responses 
WHERE answers IS NULL 
  OR computed IS NULL 
  OR code IS NULL;
```

### 5.3 Невалидные ИМТ значения (< 10 или > 50)
```sql
SELECT 
  code,
  created_at,
  computed->>'bmi' as bmi,
  answers->>'weight_kg' as weight,
  answers->>'height_cm' as height
FROM responses 
WHERE 
  (computed->>'bmi')::FLOAT < 10 
  OR (computed->>'bmi')::FLOAT > 50
ORDER BY created_at DESC;
```

## 6. Удаление и очистка (будьте осторожны!)

### 6.1 Удалить все тестовые ответы
```sql
DELETE FROM responses WHERE code LIKE 'TEST%';
```

### 6.2 Удалить ответы старше 90 дней
```sql
DELETE FROM responses WHERE created_at < NOW() - INTERVAL '90 days';
```

### 6.3 Просмотр перед удалением (безопасная проверка)
```sql
SELECT COUNT(*) FROM responses WHERE code LIKE 'TEST%';
-- Если количество правильное, тогда выполнить DELETE
```

## 7. Управление RLS политиками

### 7.1 Проверить текущие политики
```sql
SELECT * FROM pg_policies WHERE tablename = 'responses';
```

### 7.2 Временно отключить RLS (ТОЛЬКО для админа, будьте осторожны!)
```sql
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
```

### 7.3 Включить обратно
```sql
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
```

## 8. Оптимизация и мониторинг

### 8.1 Размер таблицы
```sql
SELECT 
  pg_size_pretty(pg_total_relation_size('responses')) as total_size,
  COUNT(*) as row_count
FROM responses;
```

### 8.2 Использование индексов
```sql
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename = 'responses';
```

### 8.3 Статистика по давности обновления
```sql
SELECT 
  MIN(created_at) as oldest_response,
  MAX(created_at) as newest_response,
  CURRENT_TIMESTAMP - MAX(created_at) as time_since_last_response
FROM responses;
```

## 9. Резервные копии и архивирование

### 9.1 Архивировать старые данные в отдельную таблицу
```sql
-- Создать архив-таблицу (только один раз)
CREATE TABLE responses_archive AS SELECT * FROM responses WHERE 1=0;

-- Переместить ответы старше года
INSERT INTO responses_archive
SELECT * FROM responses WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM responses WHERE created_at < NOW() - INTERVAL '1 year';
```

### 9.2 Эспорт архива в JSON
```sql
SELECT 
  jsonb_agg(jsonb_build_object(
    'id', id,
    'code', code,
    'created_at', created_at,
    'answers', answers,
    'computed', computed
  ))
FROM responses_archive
LIMIT 1000;
```

---

## 💡 Полезные советы

1. **Перед удалением:** Всегда сначала выполни SELECT с WHERE, чтобы проверить, какие строки удалятся
2. **Большие выборки:** Используй LIMIT для пробы перед полным экспортом
3. **Производительность:** На больших таблицах добавляй WHERE для ограничения диапазона
4. **Безопасность:** Никогда не делись полным Access Token или Service Key

## 🔍 Экспорт результатов

После выполнения запроса нажми иконку ↓ вверху результатов для скачивания:
- CSV — для Excel/Sheets
- JSON — для обработки программой
- Копировать — вставить в текстовый редактор

---

**Версия:** 1.0 | Январь 2025
