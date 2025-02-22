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
        });
    });

    // Local Storage
    let practiceEntries = JSON.parse(localStorage.getItem('practiceEntries')) || [];
    let events = JSON.parse(localStorage.getItem('events')) || [];

    // Practice Form
    const practiceForm = document.getElementById('practice-form');
    const practiceList = document.getElementById('practice-list');

    practiceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const notes = practiceForm.querySelector('textarea').value;
        const date = practiceForm.querySelector('input[type="date"]').value;
        const time = practiceForm.querySelector('input[type="time"]').value;

        const entry = { notes, date, time, id: Date.now() };
        practiceEntries.unshift(entry);
        localStorage.setItem('practiceEntries', JSON.stringify(practiceEntries));
        
        renderPracticeEntries();
        practiceForm.reset();
    });

    function renderPracticeEntries() {
        practiceList.innerHTML = '';
        practiceEntries.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'entry';
            div.innerHTML = `
                <p>${entry.notes}</p>
                <small>${entry.date} à ${entry.time}</small>
            `;
            practiceList.appendChild(div);
        });
    }

    // Event Form
    const eventForm = document.getElementById('event-form');
    const eventList = document.getElementById('event-list');

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = eventForm.querySelector('input[type="text"]').value;
        const date = eventForm.querySelector('input[type="date"]').value;

        const event = { title, date, id: Date.now() };
        events.unshift(event);
        localStorage.setItem('events', JSON.stringify(events));
        
        renderEvents();
        eventForm.reset();
    });

    function renderEvents() {
        eventList.innerHTML = '';
        events.forEach(event => {
            const div = document.createElement('div');
            div.className = 'entry';
            div.innerHTML = `
                <p>${event.title}</p>
                <small>${event.date}</small>
            `;
            eventList.appendChild(div);
        });
    }

    // Initial render
    renderPracticeEntries();
    renderEvents();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed:', err));
}
