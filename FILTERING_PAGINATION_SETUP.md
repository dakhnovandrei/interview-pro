# Interview Pro - Фильтрация, Пагинация и GitHub Actions Setup

## 📋 Краткое резюме изменений

Я добавил полнофункциональную фильтрацию, пагинацию для списка интервью и настроил автоматизированное тестирование через GitHub Actions.

---

## 🎯 1. Улучшения Бэкенда (FastAPI)

### Файл: `Fullstack/src/routers/interview.py`

#### ✅ Улучшенный эндпоинт `/interviews`

Добавлены параметры для расширенной фильтрации:

```python
@interview_router.get('/interviews', response_model=PaginatedInterviewsResponse)
def get_interviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    position: Optional[str] = None,           # Фильтр по должности
    company: Optional[str] = None,             # Фильтр по компании
    interview_type: Optional[str] = None,      # Фильтр по типу интервью
    is_template: Optional[bool] = None,        # Фильтр шаблонов
    owner_id: Optional[int] = None,            # Фильтр по владельцу
    sort_by: str = Query("created_at"),        # Сортировка
    sort_order: str = Query("desc"),           # Порядок сортировки
    search: Optional[str] = None,              # Полнотекстовый поиск
    db: Session = Depends(get_db),
):
    """Получить список интервью с фильтрацией и пагинацией"""
```

**Поддерживаемые параметры:**
- `page`: Номер страницы (по умолчанию: 1)
- `page_size`: Элементов на странице (по умолчанию: 10, макс: 100)
- `position`: Поиск по должности (substring, регистронезависимый)
- `company`: Поиск по компании (substring, регистронезависимый)
- `interview_type`: Фильтр по типу интервью
- `is_template`: Только шаблоны (true) или обычные (false)
- `owner_id`: Фильтр по ID владельца
- `sort_by`: Сортировка по (created_at, updated_at, job_position, company)
- `sort_order`: Порядок (asc или desc)
- `search`: Поиск в должности, компании и названии

#### ✅ Новый эндпоинт `/my-interviews`

```python
@interview_router.get('/my-interviews', response_model=PaginatedInterviewsResponse)
def get_my_interviews(
    user=Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    ...
):
    """Получить интервью текущего пользователя с фильтрацией"""
```

**Примеры использования API:**

```bash
# Все интервью, первая страница
GET /api/v3/interviews

# 20 элементов на странице, вторая страница
GET /api/v3/interviews?page=2&page_size=20

# Фильтр по должности и компании
GET /api/v3/interviews?position=React&company=Google

# Фильтр по типу интервью
GET /api/v3/interviews?interview_type=technical

# Поиск + сортировка
GET /api/v3/interviews?search=Senior&sort_by=created_at&sort_order=desc

# Только шаблоны
GET /api/v3/interviews?is_template=true

# Мои интервью
GET /api/v3/my-interviews?page=1&page_size=10
```

---

## 🎨 2. Улучшения Фронтенда (React)

### Файл: `Frontend_for_Fullstack/my_app/src/pages/ProfilePage.tsx`

#### ✅ Добавлены элементы управления фильтрацией:

1. **Кнопка фильтра** - компактное управление видимостью фильтров
2. **Поле поиска** - полнотекстовый поиск по должности и компании
3. **Фильтр по должности** - текстовое поле для фильтрации
4. **Фильтр по компании** - текстовое поле для фильтрации
5. **Фильтр по типу** - выпадающий список всех типов интервью
6. **Сортировка** - выбор поля и порядка сортировки
7. **Контроль размера страницы** - 5, 10, 20, 50 элементов
8. **Кнопка очистки фильтров** - быстрый сброс к значениям по умолчанию

#### ✅ Пагинация:

```tsx
// Переключение между страницами
<button onClick={() => loadInterviews(currentPage - 1)}>← Prev</button>
<button onClick={() => loadInterviews(currentPage + 1)}>Next →</button>

// Отображение информации о странице
Page {currentPage} of {totalPages} ({totalInterviews} total)
```

#### ✅ Динамическая загрузка:

```tsx
const loadInterviews = useCallback(async (page: number = 1) => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    sort_by: sortBy,
    sort_order: sortOrder,
  });
  
  if (filterPosition) params.append('position', filterPosition);
  if (filterCompany) params.append('company', filterCompany);
  if (filterType) params.append('interview_type', filterType);
  if (searchTerm) params.append('search', searchTerm);
  
  const { data } = await api.get(`/api/v3/interviews?${params}`);
  // ...
}, [filterPosition, filterCompany, filterType, searchTerm, pageSize, sortBy, sortOrder]);
```

---

### Файл: `Frontend_for_Fullstack/my_app/src/pages/TemplatesPage.tsx`

#### ✅ Похожие улучшения для страницы шаблонов:

1. **Сверху-липкая полоса фильтров** - быстрый доступ при прокрутке
2. **Сетка с пагинацией** - 9, 12, 18 или 24 шаблона на странице
3. **Все те же фильтры** - поиск, должность, компания, тип, сортировка
4. **Модальное окно** - просмотр деталей шаблона перед запуском

---

## ⚙️ 3. GitHub Actions CI/CD Pipeline

### Файл: `.github/workflows/ci-cd.yml`

Полностью переработанный workflow с четырьмя основными этапами:

#### 📦 Job 1: Backend Tests & Coverage

```yaml
- Установка Python 3.12
- Установка зависимостей (pip install -r requirements.txt)
- Синтаксическая проверка Python кода
- Запуск pytest с измерением покрытия кода
- Загрузка отчета о покрытии в Codecov
- Минимальное покрытие: 45%
```

**Команда для локального тестирования:**
```bash
cd Fullstack
python -m pytest
```

#### 📦 Job 2: Frontend Tests, Build & E2E

```yaml
- Установка Node.js 20
- Установка npm зависимостей (npm ci)
- Запуск unit тестов (vitest)
- Сборка production bundle (npm run build)
- Запуск E2E тестов (Playwright) - non-blocking
```

**Команды для локального тестирования:**
```bash
cd Frontend_for_Fullstack/my_app
npm run test           # Unit tests
npm run build          # Production build
npm run test:e2e       # E2E tests
```

#### 📦 Job 3: Docker Validation

```yaml
- Проверка конфигурации docker-compose
- Сборка образа backend (interview-pro-backend:ci)
- Сборка образа frontend (interview-pro-frontend:ci)
```

#### 📦 Job 4: Deploy (Production)

```yaml
- Запускается ТОЛЬКО при push в main/master
- Запускается ТОЛЬКО если все тесты прошли
- Логирует готовность к развертыванию
- Placeholder для интеграции с production
```

#### 📦 Job 5: Status Check Summary

- Завершающий Job который всегда выполняется
- Выводит статусы всех предыдущих Job'ов
- Отказывает pipeline если критические тесты не прошли

### Когда запускается Pipeline?

✅ **При каждом push в:**
- `main`
- `develop`  
- `master`

✅ **При каждом Pull Request в:**
- `main`
- `develop`
- `master`

### Как посмотреть результаты?

1. Откройте репозиторий на GitHub
2. Перейдите в вкладку **Actions**
3. Нажмите на нужный workflow run
4. Раскройте нужный Job для просмотра логов

### Примеры статусов:

```
✅ Success   - Все Job'ы прошли успешно
❌ Failed    - Один или несколько Job'ов не прошли
⏸️ Skipped   - Job пропущен (условие не выполнено)
⌛ In Progress - Job выполняется
```

---

## 📚 4. Документация GitHub Actions

### Файл: `GITHUB_ACTIONS_SETUP.md`

Создан полный гайд, содержащий:

✅ **Quick Start** - как начать за 2 минуты
✅ **Описание каждого Job'а** - что делает, когда запускается
✅ **Просмотр результатов** - как смотреть логи и результаты
✅ **Конфигурация** - детали каждого сервиса
✅ **Troubleshooting** - решения типичных проблем
✅ **Локальное тестирование** - команды для запуска тестов локально
✅ **Продвинутые настройки** - уведомления, секреты, и т.д.
✅ **Мониторинг** - интеграция с Codecov
✅ **Защита веток** - обязательные проверки перед мержем

---

## 🚀 Как использовать?

### Шаг 1: Загрузить код на GitHub

```bash
# Инициализировать git (если еще не инициализирован)
git init

# Добавить удаленный репозиторий
git remote add origin https://github.com/YOUR_USERNAME/interview-pro.git

# Переключиться или создать главную ветку
git checkout -b main

# Добавить все файлы
git add .

# Сделать commit
git commit -m "Add filtering, pagination, and GitHub Actions CI/CD"

# Загрузить в GitHub
git push -u origin main
```

### Шаг 2: GitHub Actions автоматически запустится!

1. Перейдите в репозиторий на GitHub
2. Откройте вкладку **Actions**
3. Вы должны увидеть workflow `CI/CD Pipeline`
4. Нажмите на него чтобы увидеть детали

### Шаг 3: Смотрите статус тестов

После каждого push статус будет обновляться автоматически!

---

## 🧪 Локальное тестирование перед push'ем

```bash
# Бэкенд тесты
cd Fullstack
python -m pytest -v

# Фронтенд тесты
cd ../Frontend_for_Fullstack/my_app
npm run test
npm run build

# E2E тесты
npm run test:e2e
```

---

## 📊 Интеграция с Codecov (опционально)

1. Посетите https://codecov.io
2. Авторизуйтесь с GitHub
3. Выберите свой репозиторий
4. GitHub Actions автоматически загружает отчеты о покрытии
5. Можно добавить badge в README

```markdown
[![codecov](https://codecov.io/gh/YOUR_USERNAME/interview-pro/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/interview-pro)
```

---

## 🔒 Защита веток (Branch Protection)

Рекомендуется:

1. **Settings** → **Branches** → **Add rule**
2. Branch pattern: `main`
3. Включить: "Require status checks to pass before merging"
4. Выбрать checks:
   - ✅ Backend Tests & Coverage
   - ✅ Frontend Tests, Build & E2E
   - ✅ Docker Validation

---

## 📝 Структура проекта после изменений

```
full fullstack/
├── .github/
│   └── workflows/
│       └── ci-cd.yml                 (← ✨ НОВЫЙ)
├── Fullstack/
│   ├── src/
│   │   └── routers/
│   │       └── interview.py          (← ✏️ ОБНОВЛЕН)
│   ├── pytest.ini
│   └── requirements.txt
├── Frontend_for_Fullstack/
│   └── my_app/
│       └── src/
│           └── pages/
│               ├── ProfilePage.tsx       (← ✏️ ПЕРЕПИСАН)
│               └── TemplatesPage.tsx     (← ✏️ ПЕРЕПИСАН)
├── GITHUB_ACTIONS_SETUP.md          (← ✨ НОВЫЙ)
└── ... (другие файлы)
```

---

## 🎓 Примеры API запросов

### Получить все интервью с фильтрацией

```bash
curl "http://localhost:8000/api/v3/interviews?page=1&page_size=10&position=React&sort_by=created_at&sort_order=desc"
```

**Ответ:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "React Developer Interview",
      "job_position": "Senior React Developer",
      "company": "TechCorp",
      "interview_type": "technical",
      "is_template": true,
      "created_at": "2024-05-17T10:00:00"
    },
    ...
  ],
  "total": 45,
  "page": 1,
  "page_size": 10,
  "total_pages": 5
}
```

### Получить мои интервью

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v3/my-interviews?interview_type=behavioral"
```

---

## ⚡ Performance Tips

1. **Кэширование** - npm и pip dependencies кэшируются автоматически
2. **Параллельное выполнение** - backend и frontend тесты запускаются одновременно
3. **Docker Buildx** - для оптимизации сборки Docker образов
4. **Условные шаги** - Deploy запускается только при необходимости

**Типичная длительность workflow: 5-8 минут**

---

## 📞 Помощь и ресурсы

- **GitHub Actions**: https://docs.github.com/en/actions
- **FastAPI**: https://fastapi.tiangolo.com
- **React**: https://react.dev
- **Docker**: https://docs.docker.com
- **Pytest**: https://docs.pytest.org
- **Vitest**: https://vitest.dev

---

## ✅ Чеклист для готовности

- [ ] Код загружен на GitHub
- [ ] GitHub Actions workflow видно в Actions tab
- [ ] Backend тесты проходят ✅
- [ ] Frontend тесты проходят ✅
- [ ] Docker образы собираются ✅
- [ ] Прочитана документация в GITHUB_ACTIONS_SETUP.md
- [ ] Настроена защита веток (опционально)
- [ ] Настроена интеграция с Codecov (опционально)
- [ ] Настроены уведомления (опционально)

---

**🎉 Готово! Теперь ваш проект имеет полнофункциональную фильтрацию, пагинацию и автоматизированное тестирование через GitHub Actions!**
