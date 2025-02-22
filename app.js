import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsWbRINgyBXJdbgoeL2W3SiOqs8210PlQ",
    authDomain: "dakapote.firebaseapp.com",
    projectId: "dakapote",
    storageBucket: "dakapote.firebasestorage.app",
    messagingSenderId: "189915267772",
    appId: "1:189915267772:web:5530794a30db5d0af346b9",
    measurementId: "G-B1NEQD4WF6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', () => {
    let userId;
    let practiceEntries = [];
    let events = [];
    let repertoire = [];

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            userId = user.uid;
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('user-firstname').textContent = user.displayName || 'Non défini';

            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                document.getElementById('instrument-select').value = userData.instrument || '';
                if (userData.photoURL) {
                    document.getElementById('profile-pic').src = userData.photoURL;
                    document.getElementById('profile-pic').style.display = 'block';
                }
            }

            // Chargement des données Firestore
            onSnapshot(collection(db, `users/${userId}/practice`), (snapshot) => {
                practiceEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderPracticeEntries();
            });
            onSnapshot(collection(db, `users/${userId}/events`), (snapshot) => {
                events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderEvents();
                renderCalendar();
            });
            onSnapshot(collection(db, `users/${userId}/repertoire`), (snapshot) => {
                repertoire = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderRepertoire();
                populatePieceSelect();
            });
        }
    });

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

    practiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pieceId = pieceSelect.value;
        const notes = practiceForm.querySelector('textarea').value;
        const date = practiceForm.querySelector('input[type="date"]').value;
        const time = practiceForm.querySelector('input[type="time"]').value;

        await addDoc(collection(db, `users/${userId}/practice`), { pieceId, notes, date, time });
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

    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = eventForm.querySelector('input[type="text"]').value;
        const date = eventForm.querySelector('#event-date').value;
        await addDoc(collection(db, `users/${userId}/events`), { title, date });
        eventForm.reset();
    });

    function renderEvents() {
        eventList.innerHTML = '';
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
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

        const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        daysOfWeek.forEach(day => {
            const div = document.createElement('div');
            div.textContent = day;
            div.style.fontWeight = '600';
            calendarDays.appendChild(div);
        });

        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < startDay; i++) {
            calendarDays.appendChild(document.createElement('div'));
        }

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

    repertoireForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const composer = repertoireForm.querySelector('input[placeholder="Compositeur"]').value;
        const title = repertoireForm.querySelector('input[placeholder="Titre"]').value;
        const type = repertoireForm.querySelector('select').value;
        await addDoc(collection(db, `users/${userId}/repertoire`), { composer, title, type });
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

    // Profile
    document.getElementById('logout').addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        });
    });

    document.getElementById('instrument-select').addEventListener('change', async (e) => {
        await updateDoc(doc(db, 'users', userId), { instrument: e.target.value });
    });

    document.getElementById('profile-pic-upload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const storageRef = ref(storage, `profile-pics/${userId}`);
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);
            await updateDoc(doc(db, 'users', userId), { photoURL });
            document.getElementById('profile-pic').src = photoURL;
            document.getElementById('profile-pic').style.display = 'block';
        }
    });

    document.getElementById('contact').addEventListener('click', () => {
        window.location.href = 'mailto:info@dacapoapp.com';
    });
});
