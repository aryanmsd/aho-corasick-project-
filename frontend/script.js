const API_URL = 'http://localhost:8000';

const PRESETS = {
  spam: [
    'spam',
    'scam',
    'fraud',
    'free money',
    'winner',
    'prize',
    'act now',
    'click here',
    'limited offer',
    'make money fast'
  ]
};

let keywords = [];

function addKeyword() {
  const input = document.getElementById('kw-input');

  const word = input.value.trim().toLowerCase();

  if (!word) return;

  if (keywords.includes(word)) {
    toast('Keyword already added', 'error');
    return;
  }

  keywords.push(word);

  input.value = '';

  renderTags();

  pushKeywordsToAPI();
}

function removeKeyword(index) {
  keywords.splice(index, 1);

  renderTags();

  pushKeywordsToAPI();
}

function clearAll() {
  keywords = [];

  renderTags();

  fetch(`${API_URL}/keywords`, {
    method: 'DELETE'
  }).catch(() => {});
}

function loadPreset(name) {
  PRESETS[name].forEach(word => {
    if (!keywords.includes(word)) {
      keywords.push(word);
    }
  });

  renderTags();

  pushKeywordsToAPI();
}

function renderTags() {
  const area = document.getElementById('tags-area');

  const empty = document.getElementById('empty-msg');

  area.querySelectorAll('.tag').forEach(t => t.remove());

  empty.style.display = keywords.length ? 'none' : 'block';

  document.getElementById('kw-count').textContent = keywords.length;

  keywords.forEach((word, index) => {
    const tag = document.createElement('div');

    tag.className = 'tag';

    tag.innerHTML = `
      ${word}
      <button class="tag-remove"
        onclick="removeKeyword(${index})">
        ×
      </button>
    `;

    area.appendChild(tag);
  });
}

async function pushKeywordsToAPI() {
  if (!keywords.length) return;

  try {
    await fetch(`${API_URL}/keywords`, {
      method: 'DELETE'
    });

    await fetch(`${API_URL}/keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keywords })
    });
  } catch (e) {}
}

async function scan() {
  const text = document.getElementById('text-input').value;

  if (!text.trim()) {
    toast('Please enter text', 'error');
    return;
  }

  if (!keywords.length) {
    toast('Add keywords first', 'error');
    return;
  }

  const btn = document.getElementById('scan-btn');

  btn.innerHTML = 'Scanning...';

  try {
    await pushKeywordsToAPI();

    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();

    renderResults(data, text);

  } catch (e) {
    toast('Backend offline', 'error');
  }

  btn.innerHTML = '⚡ Scan';
}

function renderResults(data, text) {
  const body = document.getElementById('results-body');

  if (!data.total_matches) {
    body.innerHTML = `
      <div class="placeholder">
        <span>✅</span>
        No matches found
      </div>
    `;
    return;
  }

  const rows = data.matches.map(match => `
    <div class="match-row">
      <span>${match.keyword}</span>
      <span>pos ${match.position}</span>
    </div>
  `).join('');

  body.innerHTML = `
    <div class="stats-row">

      <div class="stat-box">
        <div class="stat-number">${data.total_matches}</div>
        <div>Matches</div>
      </div>

      <div class="stat-box">
        <div class="stat-number">${data.text_length}</div>
        <div>Characters</div>
      </div>

    </div>

    <div class="match-list">
      ${rows}
    </div>
  `;
}

function loadSample() {
  document.getElementById('text-input').value =
`Subject: URGENT — You've been selected!

You are our lucky winner!

Click here to claim your free money prize.`;

  updateCharCount();
}

function updateCharCount() {
  const count = document.getElementById('text-input').value.length;

  document.getElementById('char-count').textContent =
    `${count} characters`;
}

function toast(msg, type = 'success') {
  const toast = document.getElementById('toast');

  toast.textContent = msg;

  toast.className = `show ${type}`;

  setTimeout(() => {
    toast.className = '';
  }, 2500);
}

async function checkHealth() {
  const dot = document.getElementById('status-dot');

  const label = document.getElementById('status-label');

  try {
    const response = await fetch(`${API_URL}/health`);

    const data = await response.json();

    dot.className = 'status-dot online';

    label.textContent =
      `API online · ${data.keywords_loaded} keywords loaded`;

  } catch {
    dot.className = 'status-dot offline';

    label.textContent =
      'API offline';
  }
}

document.getElementById('kw-input')
.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    addKeyword();
  }
});

document.getElementById('text-input')
.addEventListener('input', updateCharCount);

checkHealth();

setInterval(checkHealth, 8000);

renderTags();