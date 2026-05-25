console.log('D.J.a.d.B.js geladen');
let lastScore = null;

const firebaseConfig = {
    apiKey: "AIzaSyCsHcJejTmME4wMqLXA654QadqGFGWtJHg",
    authDomain: "d-j-a-d-b.firebaseapp.com",
    databaseURL: "https://d-j-a-d-b-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "d-j-a-d-b",
    storageBucket: "d-j-a-d-b.firebasestorage.app",
    messagingSenderId: "207713569230",
    appId: "1:207713569230:web:b3f38f52fce15235ca439f",
    measurementId: "G-VFQ7168DMK"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const correctAnswers = {
    question1: 'pierrot',
    question2: 'obersalzberg',
    question3: 'französisch',
    question4: 'wilhelm',
    question5: 'anshel',
    question6: 'waisenhaus',
    question7: 'goy',
    question8: 'orleans',
    question9: 'josette',
    question10: 'hugo',
    question11: 'beatrix',
    question12: 'ernst',
    question13: 'hitler',
    question14: 'obersalzberg',
    question15: 'katharina',
    question16: 'nein',
    question17: 'ja',
    question18: 'nein',
    question19: 'd\'arthagnan'
};

function normalizeAnswer(value) {
    return String(value || '').trim().toLowerCase();
}

function appendResult(container, message, color) {
    const result = document.createElement('p');
    result.className = 'result';
    result.textContent = message;
    result.style.color = color;
    container.appendChild(result);
}

function checkAnswers() {
    document.querySelectorAll('.result').forEach(el => el.remove());
    let score = 0;
    const form = document.getElementById('book-quiz-form');

    Object.keys(correctAnswers).forEach(key => {
        const expected = correctAnswers[key];
        if (['question16', 'question17', 'question18'].includes(key)) {
            const selected = form.querySelector(`input[name="${key}"]:checked`);
            const group = selected ? selected.parentElement : form;
            if (selected && selected.value === expected) {
                score++;
                appendResult(group, `Frage ${key} ist richtig.`, 'green');
            } else {
                appendResult(group, `Frage ${key} ist falsch oder fehlt.`, 'red');
            }
            return;
        }

        const input = document.getElementById(key);
        if (!input) return;
        const answer = normalizeAnswer(input.value);
        const container = input.parentElement;
        if (answer && expected && answer.includes(expected)) {
            score++;
            appendResult(container, `${input.previousElementSibling.textContent}: Richtig!`, 'green');
        } else {
            appendResult(container, `${input.previousElementSibling.textContent}: Falsch oder nicht komplett.`, 'red');
        }
    });

    const totalResult = document.createElement('p');
    totalResult.className = 'result';
    totalResult.textContent = `Gesamtpunkte: ${score} von ${Object.keys(correctAnswers).length}`;
    totalResult.style.fontSize = '1.1em';
    totalResult.style.marginTop = '1rem';
    document.getElementById('book-quiz-form').appendChild(totalResult);

    lastScore = score;
    updateSaveButton();
}

async function getScoreboard() {
    try {
        const snapshot = await db.ref('/scoreboard').once('value');
        const data = snapshot.val();
        if (!data) return [];
        const entries = Object.values(data);
        return entries.sort((a, b) => b.score - a.score || new Date(a.date) - new Date(b.date)).slice(0, 10);
    } catch (error) {
        console.error('Fehler beim Laden des Scoreboards:', error);
        return null;
    }
}

async function saveScoreToStorage(name, score) {
    try {
        await db.ref('/scoreboard').push({ name, score, date: new Date().toISOString() });
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern des Scoreboards:', error);
        alert('Serverfehler: ' + error.message);
        return false;
    }
}

async function renderScoreboard() {
    const list = document.getElementById('scoreboard-list');
    const scoreboard = await getScoreboard();
    if (scoreboard === null) {
        list.innerHTML = 'Scoreboard konnte nicht geladen werden. Stelle sicher, dass Firebase richtig konfiguriert ist.';
        return;
    }
    if (scoreboard.length === 0) {
        list.innerHTML = 'Noch keine Einträge. Mache zuerst das Quiz.';
        return;
    }
    const table = document.createElement('table');
    table.className = 'scoreboard-table';
    table.innerHTML = '<tr><th>Platz</th><th>Name</th><th>Punkte</th><th>Datum</th></tr>';
    scoreboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        const date = new Date(entry.date).toLocaleDateString('de-DE');
        row.innerHTML = `<td>${index + 1}</td><td>${entry.name}</td><td>${entry.score}</td><td>${date}</td>`;
        table.appendChild(row);
    });
    list.innerHTML = '';
    list.appendChild(table);
}

function updateSaveButton() {
    const button = document.getElementById('save-score-button');
    const name = document.getElementById('score-name').value.trim();
    button.disabled = lastScore === null || name === '';
}

async function saveScore() {
    const nameInput = document.getElementById('score-name');
    const name = nameInput.value.trim();
    if (lastScore === null) {
        alert('Bitte zunächst das Quiz auswerten.');
        return;
    }
    if (!name) {
        alert('Bitte gib deinen Namen ein.');
        return;
    }
    const saved = await saveScoreToStorage(name, lastScore);
    if (saved) {
        nameInput.value = '';
        lastScore = null;
        updateSaveButton();
        alert('Dein Score wurde gespeichert.');
        renderScoreboard();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('score-name');
    if (nameInput) nameInput.addEventListener('input', updateSaveButton);

    const checkBtn = document.getElementById('check-answers-button');
    if (checkBtn) checkBtn.addEventListener('click', checkAnswers);

    const saveBtn = document.getElementById('save-score-button');
    if (saveBtn) saveBtn.addEventListener('click', saveScore);

    renderScoreboard();
    updateSaveButton();
});
