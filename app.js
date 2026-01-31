// Конфигурация Supabase
const SUPABASE_URL = 'https://btfqcxwbctbazgyomhjy.supabase.co'; // Заполнить при развёртывании
const SUPABASE_ANON_KEY = 'sb_publishable_LV6GidJ-BJT1v1ReNKaQVA_j_HGkxDh'; // Заполнить при развёртывании

// Состояние приложения
const appState = {
    questions: [],
    currentPage: 0,
    answers: {},
    code: null,
    isSubmitting: false,
    questionsPerPage: 1,
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    // Загрузить вопросы
    await loadQuestions();
    
    // Определить количество вопросов на странице в зависимости от размера экрана
    updateQuestionsPerPage();
    window.addEventListener('resize', updateQuestionsPerPage);
    
    // Привязать обработчики событий
    document.getElementById('start-form').addEventListener('submit', handleStartForm);
    document.getElementById('btn-next').addEventListener('click', handleNextPage);
    document.getElementById('btn-prev').addEventListener('click', handlePrevPage);
    document.getElementById('btn-new-survey').addEventListener('click', handleNewSurvey);
});

// Загрузить вопросы из JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error('Ошибка загрузки вопросов');
        
        const data = await response.json();
        appState.questions = data.questions;
        document.getElementById('total-questions').textContent = appState.questions.length;
    } catch (error) {
        console.error('Ошибка при загрузке вопросов:', error);
        showError('Не удалось загрузить опросник. Перезагрузите страницу.');
    }
}

// Обновить количество вопросов на странице
function updateQuestionsPerPage() {
    const isMobile = window.innerWidth < 768;
    appState.questionsPerPage = isMobile ? 1 : 3;
}

// Обработчик стартовой формы
function handleStartForm(e) {
    e.preventDefault();
    
    const codeInput = document.getElementById('code-input');
    const code = codeInput.value.trim();
    const codeError = document.getElementById('code-error');
    
    // Валидация шифра
    if (!code) {
        codeError.textContent = 'Поле обязательно для заполнения';
        return;
    }
    
    if (code.length < 1) {
        codeError.textContent = 'Введите корректный шифр';
        return;
    }
    
    codeError.textContent = '';
    appState.code = code;
    
    // Переход на экран опросника
    showScreen('survey');
    renderQuestions();
}

// Отобразить вопросы на текущей странице
function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    
    const startIdx = appState.currentPage * appState.questionsPerPage;
    const endIdx = Math.min(startIdx + appState.questionsPerPage, appState.questions.length);
    
    for (let i = startIdx; i < endIdx; i++) {
        const question = appState.questions[i];
        const questionElement = createQuestionElement(question);
        container.appendChild(questionElement);
    }
    
    // Обновить прогресс
    updateProgress();
    
    // Обновить видимость кнопок
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    
    btnPrev.style.display = appState.currentPage > 0 ? 'block' : 'none';
    
    if (endIdx >= appState.questions.length) {
        btnNext.textContent = 'Завершить';
        btnNext.id = 'btn-submit';
    } else {
        btnNext.textContent = 'Далее →';
        btnNext.id = 'btn-next';
    }
}

// Создать элемент вопроса
function createQuestionElement(question) {
    const div = document.createElement('div');
    div.className = 'question-item';
    div.dataset.questionId = question.id;
    
    const labelText = question.unit 
        ? `${question.label} (${question.unit})`
        : question.label;
    
    const currentValue = appState.answers[question.id] || '';
    
    div.innerHTML = `
        <div class="question-wrapper">
            <label for="q-${question.id}" class="question-label">
                ${labelText}
                <span class="required">*</span>
            </label>
            <input 
                type="number" 
                id="q-${question.id}" 
                name="${question.id}"
                min="${question.min}"
                max="${question.max}"
                value="${currentValue}"
                placeholder="Введите значение"
                class="question-input"
                required
            >
            <div class="error-message" data-error-for="${question.id}"></div>
            <div class="hint">Диапазон: ${question.min}–${question.max}</div>
        </div>
    `;
    
    return div;
}

// Обновить прогресс
function updateProgress() {
    const startIdx = appState.currentPage * appState.questionsPerPage;
    const endIdx = Math.min(startIdx + appState.questionsPerPage, appState.questions.length);
    
    document.getElementById('current-question').textContent = Math.min(
        startIdx + appState.questionsPerPage,
        appState.questions.length
    );
    
    const progress = ((endIdx) / appState.questions.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

// Валидация ответов на текущей странице
function validateCurrentPage() {
    const startIdx = appState.currentPage * appState.questionsPerPage;
    const endIdx = Math.min(startIdx + appState.questionsPerPage, appState.questions.length);
    
    let isValid = true;
    
    for (let i = startIdx; i < endIdx; i++) {
        const question = appState.questions[i];
        const input = document.getElementById(`q-${question.id}`);
        const errorDiv = document.querySelector(`[data-error-for="${question.id}"]`);
        
        const value = input.value.trim();
        
        // Проверка обязательного поля
        if (!value) {
            errorDiv.textContent = 'Поле обязательно';
            isValid = false;
            continue;
        }
        
        const numValue = parseFloat(value);
        
        // Проверка числового значения
        if (isNaN(numValue)) {
            errorDiv.textContent = 'Введите число';
            isValid = false;
            continue;
        }
        
        // Проверка диапазона
        if (numValue < question.min || numValue > question.max) {
            errorDiv.textContent = `Значение должно быть от ${question.min} до ${question.max}`;
            isValid = false;
            continue;
        }
        
        // Сохранить ответ
        appState.answers[question.id] = numValue;
        errorDiv.textContent = '';
    }
    
    return isValid;
}

// Обработчик кнопки "Далее"
async function handleNextPage(e) {
    e.preventDefault();
    
    // Валидировать текущую страницу
    if (!validateCurrentPage()) {
        return;
    }
    
    const totalPages = Math.ceil(appState.questions.length / appState.questionsPerPage);
    
    // Если это последняя страница, отправить форму
    if (appState.currentPage === totalPages - 1) {
        await submitSurvey();
        return;
    }
    
    // Иначе перейти на следующую страницу
    appState.currentPage++;
    renderQuestions();
}

// Обработчик кнопки "Назад"
function handlePrevPage(e) {
    e.preventDefault();
    
    if (appState.currentPage > 0) {
        appState.currentPage--;
        renderQuestions();
    }
}

// Вычислить ИМТ
function calculateBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return parseFloat(bmi.toFixed(1));
}

// Отправить опрос на Supabase
async function submitSurvey() {
    const btnNext = document.getElementById('btn-next') || document.getElementById('btn-submit');
    
    // Блокировать кнопку
    if (btnNext) {
        btnNext.disabled = true;
        btnNext.textContent = 'Отправка...';
    }
    
    appState.isSubmitting = true;
    
    try {
        // Вычислить ИМТ
        const computed = {
            bmi: calculateBMI(appState.answers.weight_kg, appState.answers.height_cm),
            calculated_at: new Date().toISOString()
        };
        
        // Подготовить payload
        const payload = {
            code: appState.code,
            version: '1.0',
            answers: appState.answers,
            computed: computed,
            consent: true,
            client_meta: {
                user_agent: navigator.userAgent,
                submitted_at: new Date().toISOString()
            }
        };
        
        // Отправить в Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/responses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка отправки данных');
        }
        
        // Показать экран успеха
        document.getElementById('success-code').textContent = appState.code;
        showScreen('success');
        
    } catch (error) {
        console.error('Ошибка при отправке:', error);
        showError(`Ошибка отправки: ${error.message}`);
    } finally {
        // Разблокировать кнопку
        if (btnNext) {
            btnNext.disabled = false;
            btnNext.textContent = 'Завершить';
        }
        appState.isSubmitting = false;
    }
}

// Обработчик "Начать новый опрос"
function handleNewSurvey() {
    // Очистить состояние
    appState.code = null;
    appState.currentPage = 0;
    appState.answers = {};
    appState.isSubmitting = false;
    
    // Очистить форму
    document.getElementById('code-input').value = '';
    document.getElementById('code-error').textContent = '';
    
    // Вернуться на стартовый экран
    showScreen('start');
}

// Показать конкретный экран
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`screen-${screenName}`).classList.add('active');
}

// Показать ошибку
function showError(message) {
    document.getElementById('error-message').textContent = message;
    showScreen('error');
}
