document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            item.classList.add('active');
            const tabId = item.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            if (tabId === 'calendar') renderCalendar();
        });
    });

    // Local Storage (pour le moment, à migrer vers Firebase plus tard)
    let practiceEntries = JSON.parse(localStorage.getItem('practiceEntries')) || [];
    let events = JSON.parse(localStorage.getItem('events')) || [];
    let repertoire = JSON.parse(localStorage.getItem('repertoire')) || [];

    // Practice Form
    const practiceForm = document.getElementById('practice-form');
    const practiceList = document.getElementById('practice-list');
    const pieceSelect = document.getElementById('piece-select');
    const sortDateBtn = document.getElementById('sort-date');
    const sortPieceBtn = document.getElementById('sort-piece');

    function populatePieceSelect() {
        pieceSelect.innerHTML = '<option value="" disabled selected>Choisir une pièce</option>';
        repertoire.forEach(piece => {
            const option = document.createElement('option');
            option.value = piece.id;
            option.textContent = `${piece.composer} - ${piece.title}`;
            pieceSelect.appendChild(option);
        });
    }

    practiceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pieceId = parseInt(pieceSelect.value);
        const notes = practiceForm.querySelector('textarea').value;
        const date = practiceForm.querySelector('input[type="date"]').value;
        const time = practiceForm.querySelector('input[type="time"]').value;

        const entry = { pieceId, notes, date, time, id: Date.now() };
        practiceEntries.unshift(entry);
        localStorage.setItem('practiceEntries', JSON.stringify(practiceEntries));
        renderPracticeEntries();
        practiceForm.reset();
    });

    sortDateBtn.addEventListener('click', () => {
        practiceEntries.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
        renderPracticeEntries();
    });

    sortPieceBtn.addEventListener('click', () => {
        practiceEntries.sort((a, b) => {
            const pieceA = repertoire.find(p => p.id === a.pieceId) || { composer: 'zzz' };
            const pieceB = repertoire.find(p => p.id === b.pieceId) || { composer: 'zzz' };
            return pieceA.composer.localeCompare(pieceB.composer);
        });
        renderPracticeEntries();
    });

    function renderPracticeEntries() {
        practiceList.innerHTML = '';
        practiceEntries.forEach(entry => {
            const piece = repertoire.find(p => p.id === entry.pieceId);
            const div = document.createElement('div');
            div.className = 'entry';
            div.innerHTML = `
                <p><strong>${piece ? piece.composer : 'Compositeur inconnu'}</strong> - ${piece ? piece.title : 'Titre inconnu'}</p>
                <p>${entry.notes}</p>
                <small>${entry.date} à ${entry.time}</small>
            `;
            practiceList.appendChild(div);
        });
    }

    // Calendar
    const eventForm = document.getElementById('event-form');
    const eventList = document.getElementById('event-list');
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthSpan = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    let currentDate = new Date();

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = eventForm.querySelector('input[type="text"]').value;
        const date = eventForm.querySelector('#event-date').value;
        const event = { title, date, id: Date.now() };
        events.push(event);
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        localStorage.setItem('events', JSON.stringify(events));
        renderEvents();
        renderCalendar();
        eventForm.reset();
    });

    function renderEvents() {
        eventList.innerHTML = '';
        events.forEach(event => {
            const div = document.createElement('div');
            div.className = 'entry';
            div.innerHTML = `<p>${event.title}</p><small>${event.date}</small>`;
            eventList.appendChild(div);
        });
    }

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date();
        currentMonthSpan.textContent = `${currentDate.toLocaleString('fr', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        calendarDays.innerHTML = '';

        // Ajout des jours de la semaine
        const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        daysOfWeek.forEach(day => {
            const div = document.createElement('div');
            div.textContent = day;
            div.style.fontWeight = '600';
            calendarDays.appendChild(div);
        });

        // Espaces vides avant le premier jour
        const startDay = firstDay === 0 ? 6 : firstDay - 1; // Ajustement pour commencer le lundi
        for (let i = 0; i < startDay; i++) {
            calendarDays.appendChild(document.createElement('div'));
        }

        // Jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const div = document.createElement('div');
            div.className = 'day';
            div.textContent = day;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (events.some(e => e.date === dateStr)) div.classList.add('has-event');
            if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) {
                div.classList.add('today');
            }
            div.addEventListener('click', () => {
                document.getElementById('event-date').value = dateStr;
            });
            calendarDays.appendChild(div);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Repertoire Form
    const repertoireForm = document.getElementById('repertoire-form');
    const repertoireList = document.getElementById('repertoire-list');

    repertoireForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const composer = repertoireForm.querySelector('input[placeholder="Compositeur"]').value;
        const title = repertoireForm.querySelector('input[placeholder="Titre"]').value;
        const type = repertoireForm.querySelector('select').value;
        const piece = { composer, title, type, id: Date.now() };
        repertoire.unshift(piece);
        localStorage.setItem('repertoire', JSON.stringify(repertoire));
        renderRepertoire();
        populatePieceSelect();
        repertoireForm.reset();
    });

    function renderRepertoire() {
        repertoireList.innerHTML = '';
        repertoire.forEach(piece => {
            const div = document.createElement('div');
            div.className = 'entry';
            div.innerHTML = `
                <p><strong>${piece.composer}</strong> - ${piece.title}</p>
                <small>${piece.type}</small>
            `;
            repertoireList.appendChild(div);
        });
    }

    // Initial render
    populatePieceSelect();
    renderPracticeEntries();
    renderEvents();
    renderRepertoire();
    renderCalendar();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed:', err));
}
