// Конфигурация
const SUPABASE_URL = 'https://btfqcxwbctbazgyomhjy.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_Igt8gWZy10Q0n55G_exACA_L6y1JPMd'; // Приватный ключ! Хранить в .env или переменной окружения
const ADMIN_PASSWORD_HASH = 'sha256_hash_вашего_пароля'; // Будет заменён на хеш пароля ниже

// Простой хеш пароля (в продакшене использовать bcrypt!)
// Для примера: пароль = "admin123"
// Замени на свой пароль
const CORRECT_PASSWORD = 'Diana1990='; // ⚠️ ВРЕМЕННОЕ РЕШЕНИЕ: в проде использовать хеш

// Состояние админ-панели
const adminState = {
    isLoggedIn: false,
    allData: [],
    filteredData: [],
    fromDate: null,
    toDate: null,
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    document.getElementById('btn-apply-filters').addEventListener('click', handleApplyFilters);
    document.getElementById('btn-export-excel').addEventListener('click', handleExportExcel);
    document.getElementById('btn-export-csv').addEventListener('click', handleExportCSV);
    document.getElementById('btn-export-json').addEventListener('click', handleExportJSON);

    // Проверить, есть ли сохранённая сессия (простой способ)
    const sessionToken = localStorage.getItem('admin_session');
    if (sessionToken && validateSession(sessionToken)) {
        adminState.isLoggedIn = true;
        loadData();
        showScreen('admin');
    }
});

// Валидация пароля
function handleLogin(e) {
    e.preventDefault();
    
    const passwordInput = document.getElementById('password');
    const password = passwordInput.value;
    const errorDiv = document.getElementById('login-error');
    
    // Простая проверка (в продакшене используй bcrypt на сервере!)
    if (password === CORRECT_PASSWORD) {
        errorDiv.textContent = '';
        
        // Создать простой токен сессии (в продакшене использовать JWT!)
        const sessionToken = generateSessionToken();
        localStorage.setItem('admin_session', sessionToken);
        localStorage.setItem('admin_login_time', Date.now());
        
        adminState.isLoggedIn = true;
        passwordInput.value = '';
        
        loadData();
        showScreen('admin');
    } else {
        errorDiv.textContent = 'Неверный пароль';
        passwordInput.select();
    }
}

// Генерировать простой токен сессии
function generateSessionToken() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Валидировать сессию (проверить, не истекла ли)
function validateSession(token) {
    const loginTime = parseInt(localStorage.getItem('admin_login_time')) || 0;
    const sessionExpiry = 1000 * 60 * 60; // 1 час
    return (Date.now() - loginTime) < sessionExpiry;
}

// Выход
function handleLogout() {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_login_time');
    adminState.isLoggedIn = false;
    adminState.allData = [];
    adminState.filteredData = [];
    
    document.getElementById('password').value = '';
    document.getElementById('login-error').textContent = '';
    
    showScreen('login');
}

// Показать экран
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`screen-${screenName}`).classList.add('active');
}

// Загрузить данные из Supabase (используя Service Role Key)
async function loadData() {
    try {
        showStatus('Загрузка данных...');
        
        // ВНИМАНИЕ: Service Role Key используется ТОЛЬКО на админ-странице (приватная)
        const response = await fetch(`${SUPABASE_URL}/rest/v1/responses?order=created_at.desc`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        adminState.allData = await response.json();
        adminState.filteredData = [...adminState.allData];
        
        updateStats();
        renderTable();
        showStatus('✓ Данные загружены');
        
    } catch (error) {
        console.error('Ошибка:', error);
        showStatus(`❌ Ошибка: ${error.message}`);
    }
}

// Обновить статистику
function updateStats() {
    const data = adminState.filteredData;
    
    // Всего ответов
    document.getElementById('stat-total').textContent = data.length;
    
    // Последний ответ
    if (data.length > 0) {
        const latestDate = new Date(data[0].created_at);
        document.getElementById('stat-latest').textContent = latestDate.toLocaleString('ru-RU');
    }
    
    // Средний ИМТ
    if (data.length > 0) {
        const bmiValues = data
            .map(row => parseFloat(row.computed?.bmi || 0))
            .filter(bmi => bmi > 0);
        
        if (bmiValues.length > 0) {
            const avgBmi = (bmiValues.reduce((a, b) => a + b, 0) / bmiValues.length).toFixed(1);
            document.getElementById('stat-avg-bmi').textContent = avgBmi;
        }
    }
}

// Применить фильтры
function handleApplyFilters() {
    const fromDate = document.getElementById('filter-from-date').value;
    const toDate = document.getElementById('filter-to-date').value;
    
    adminState.filteredData = adminState.allData.filter(row => {
        const rowDate = new Date(row.created_at);
        
        if (fromDate && new Date(fromDate) > rowDate) return false;
        if (toDate && new Date(toDate) < rowDate) return false;
        
        return true;
    });
    
    updateStats();
    renderTable();
    showStatus(`✓ Фильтры применены (${adminState.filteredData.length} записей)`);
}

// Отобразить таблицу
function renderTable() {
    const data = adminState.filteredData;
    const container = document.getElementById('table-container');
    
    if (data.length === 0) {
        container.innerHTML = '<p class="loading">Нет данных для отображения</p>';
        return;
    }
    
    // Показать первые 10 строк для предпросмотра
    const previewData = data.slice(0, 10);
    
    let html = '<table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Шифр</th>';
    html += '<th>Дата</th>';
    html += '<th>Возраст</th>';
    html += '<th>Вес (кг)</th>';
    html += '<th>Рост (см)</th>';
    html += '<th>ИМТ</th>';
    html += '<th>Недержание</th>';
    html += '</tr></thead>';
    html += '<tbody>';
    
    previewData.forEach(row => {
        const answers = row.answers || {};
        const computed = row.computed || {};
        const date = new Date(row.created_at).toLocaleString('ru-RU');
        
        html += '<tr>';
        html += `<td>${row.code}</td>`;
        html += `<td>${date}</td>`;
        html += `<td>${answers.age || '-'}</td>`;
        html += `<td>${answers.weight_kg || '-'}</td>`;
        html += `<td>${answers.height_cm || '-'}</td>`;
        html += `<td>${computed.bmi || '-'}</td>`;
        html += `<td>${answers.incontinence_episodes || '-'}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    if (data.length > 10) {
        html += `<p class="table-note">Показано 10 из ${data.length} записей. Нажми "Скачать Excel" для выгрузки всех.</p>`;
    }
    
    container.innerHTML = html;
}

// Экспортировать в Excel
function handleExportExcel() {
    try {
        showStatus('Создание Excel файла...');
        
        const data = adminState.filteredData;
        if (data.length === 0) {
            showStatus('❌ Нет данных для выгрузки');
            return;
        }
        
        // Подготовить данные для Excel
        const excelData = data.map(row => {
            const answers = row.answers || {};
            const computed = row.computed || {};
            
            return {
                'Шифр': row.code,
                'Дата': new Date(row.created_at).toLocaleString('ru-RU'),
                'Возраст (лет)': answers.age || '',
                'Роды (раз)': answers.births || '',
                'Вес (кг)': answers.weight_kg || '',
                'Рост (см)': answers.height_cm || '',
                'Окружность талии (см)': answers.waist_circumference || '',
                'Дневные микции': answers.daytime_micturitions || '',
                'Ночные микции': answers.nighttime_micturitions || '',
                'Жидкость (мл)': answers.fluid_intake_ml || '',
                'Моча (мл)': answers.urine_output_ml || '',
                'Позывы': answers.urgent_urges || '',
                'Недержание (раз/сут)': answers.incontinence_episodes || '',
                'Прокладки': answers.pads_per_day || '',
                'Энурез (лет)': answers.childhood_enuresis || '',
                'ИМТ': computed.bmi || '',
                'Согласие': row.consent ? 'Да' : 'Нет'
            };
        });
        
        // Создать workbook
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ответы');
        
        // Установить ширину столбцов
        const wscols = [
            { wch: 12 },  // Шифр
            { wch: 18 },  // Дата
            { wch: 10 },  // Возраст
            { wch: 10 },  // Роды
            { wch: 10 },  // Вес
            { wch: 10 },  // Рост
            { wch: 15 },  // Окружность
            { wch: 12 },  // Дневные
            { wch: 12 },  // Ночные
            { wch: 12 },  // Жидкость
            { wch: 10 },  // Моча
            { wch: 10 },  // Позывы
            { wch: 14 },  // Недержание
            { wch: 10 },  // Прокладки
            { wch: 10 },  // Энурез
            { wch: 8 },   // ИМТ
            { wch: 10 }   // Согласие
        ];
        ws['!cols'] = wscols;
        
        // Скачать
        const filename = `responses_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        showStatus(`✓ Excel выгружен: ${data.length} записей`);
        
    } catch (error) {
        console.error('Ошибка при экспорте в Excel:', error);
        showStatus(`❌ Ошибка: ${error.message}`);
    }
}

// Экспортировать в CSV
function handleExportCSV() {
    try {
        showStatus('Создание CSV файла...');
        
        const data = adminState.filteredData;
        if (data.length === 0) {
            showStatus('❌ Нет данных для выгрузки');
            return;
        }
        
        // CSV заголовки
        const headers = [
            'Шифр', 'Дата', 'Возраст', 'Роды', 'Вес', 'Рост', 'Окружность',
            'Дневные микции', 'Ночные микции', 'Жидкость', 'Моча', 'Позывы',
            'Недержание', 'Прокладки', 'Энурез', 'ИМТ', 'Согласие'
        ];
        
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const answers = row.answers || {};
            const computed = row.computed || {};
            
            const values = [
                `"${row.code}"`,
                `"${new Date(row.created_at).toLocaleString('ru-RU')}"`,
                answers.age || '',
                answers.births || '',
                answers.weight_kg || '',
                answers.height_cm || '',
                answers.waist_circumference || '',
                answers.daytime_micturitions || '',
                answers.nighttime_micturitions || '',
                answers.fluid_intake_ml || '',
                answers.urine_output_ml || '',
                answers.urgent_urges || '',
                answers.incontinence_episodes || '',
                answers.pads_per_day || '',
                answers.childhood_enuresis || '',
                computed.bmi || '',
                row.consent ? 'Да' : 'Нет'
            ];
            
            csv += values.join(',') + '\n';
        });
        
        // Скачать
        downloadFile(csv, `responses_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        showStatus(`✓ CSV выгружен: ${data.length} записей`);
        
    } catch (error) {
        console.error('Ошибка при экспорте в CSV:', error);
        showStatus(`❌ Ошибка: ${error.message}`);
    }
}

// Экспортировать в JSON
function handleExportJSON() {
    try {
        showStatus('Создание JSON файла...');
        
        const data = adminState.filteredData;
        if (data.length === 0) {
            showStatus('❌ Нет данных для выгрузки');
            return;
        }
        
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, `responses_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        
        showStatus(`✓ JSON выгружен: ${data.length} записей`);
        
    } catch (error) {
        console.error('Ошибка при экспорте в JSON:', error);
        showStatus(`❌ Ошибка: ${error.message}`);
    }
}

// Утилита для скачивания файла
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Показать статус
function showStatus(message) {
    const statusDiv = document.getElementById('export-status');
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    // Скрыть через 3 секунды
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}
