const API_URL = 'http://localhost:8000';

  // Preset keyword packs
  const PRESETS = {
    spam:     ['spam', 'scam', 'fraud', 'free money', 'winner', 'prize', 'act now', 'click here', 'limited offer', 'make money fast'],
    phishing: ['verify your account', 'password expired', 'unusual activity', 'confirm identity', 'wire transfer', 'bank details', 'click the link', 'suspended'],
    profanity: ['idiot', 'stupid', 'hate', 'loser', 'dummy', 'jerk'],
    resume:   ['python', 'javascript', 'react', 'machine learning', 'sql', 'docker', 'aws', 'api', 'agile', 'leadership', 'communication']
  };

  let keywords = []; // our local list of keywords

  // ── Keyword management ──────────────────────────────────────────────────────

  function addKeyword() {
    const input = document.getElementById('kw-input');
    const word = input.value.trim().toLowerCase();
    if (!word) return;
    if (keywords.includes(word)) { toast('Keyword already added', 'error'); input.value = ''; return; }
    keywords.push(word);
    input.value = '';
    input.focus();
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
    fetch(`${API_URL}/keywords`, { method: 'DELETE' }).catch(() => {});
    renderTags();
  }

  function loadPreset(name) {
    let added = 0;
    PRESETS[name].forEach(w => {
      if (!keywords.includes(w)) { keywords.push(w); added++; }
    });
    renderTags();
    pushKeywordsToAPI();
    toast(`Added ${added} keywords from "${name}" preset`, 'success');
  }

  function renderTags() {
    const area  = document.getElementById('tags-area');
    const empty = document.getElementById('empty-msg');
    document.getElementById('kw-count').textContent = keywords.length;

    // Remove existing tags (keep empty message element)
    area.querySelectorAll('.tag').forEach(t => t.remove());

    empty.style.display = keywords.length === 0 ? 'block' : 'none';

    keywords.forEach((word, i) => {
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.innerHTML = `${word} <button class="tag-remove" onclick="removeKeyword(${i})" title="Remove">×</button>`;
      area.appendChild(tag);
    });
  }

  // Sync local keywords list to the backend
  async function pushKeywordsToAPI() {
    if (keywords.length === 0) return;
    try {
      await fetch(`${API_URL}/keywords`, { method: 'DELETE' });
      await fetch(`${API_URL}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords })
      });
    } catch (e) {
      // Backend not running — that's fine, we have a local fallback
    }
  }

  // ── Scan ────────────────────────────────────────────────────────────────────

  async function scan() {
    const text = document.getElementById('text-input').value;

    if (!text.trim())    { toast('Please enter some text to scan', 'error'); return; }
    if (!keywords.length){ toast('Please add at least one keyword', 'error'); return; }

    const btn = document.getElementById('scan-btn');
    btn.innerHTML = '<span class="spinner"></span>Scanning…';
    btn.disabled = true;

    try {
      await pushKeywordsToAPI();
      const res  = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      renderResults(data, text);
    } catch (e) {
      // Backend offline — run search locally in the browser
      const data = localSearch(text, keywords);
      renderResults(data, text);
    } finally {
      btn.innerHTML = '⚡ Scan';
      btn.disabled = false;
    }
  }

  // Local JavaScript fallback (runs in browser when backend is offline)
  function localSearch(text, kwList) {
    const matches = [];
    const lower   = text.toLowerCase();
    kwList.forEach(kw => {
      let pos = 0;
      while ((pos = lower.indexOf(kw, pos)) !== -1) {
        matches.push({ keyword: kw, position: pos, end: pos + kw.length, length: kw.length });
        pos++;
      }
    });
    matches.sort((a, b) => a.position - b.position);
    return {
      matches,
      total_matches: matches.length,
      unique_keywords_found: [...new Set(matches.map(m => m.keyword))],
      text_length: text.length,
      keywords_searched: kwList.length,
      time_ms: '< 1'
    };
  }

  // ── Render results ──────────────────────────────────────────────────────────

  function renderResults(data, originalText) {
    const body = document.getElementById('results-body');

    if (data.total_matches === 0) {
      body.innerHTML = `<div class="placeholder"><span>✅</span>No matches found — text looks clean!</div>`;
      return;
    }

    const highlightedText = buildHighlight(originalText, data.matches);

    const rows = data.matches.map((m, i) => {
      // show a small context snippet around the match
      const snippet = originalText.substring(Math.max(0, m.position - 12), m.end + 12);
      const safeSnippet = escHtml(snippet).replace(
        new RegExp(escHtml(m.keyword), 'gi'),
        s => `<mark>${s}</mark>`
      );
      return `
        <div class="match-row" style="animation-delay:${i*0.03}s">
          <span class="match-word">${m.keyword}</span>
          <span class="match-at">pos ${m.position}</span>
          <span class="match-snippet">…${safeSnippet}…</span>
        </div>`;
    }).join('');

    body.innerHTML = `
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-number red">${data.total_matches}</div>
          <div class="stat-label">Matches</div>
        </div>
        <div class="stat-box">
          <div class="stat-number orange">${data.unique_keywords_found.length}</div>
          <div class="stat-label">Keywords Hit</div>
        </div>
        <div class="stat-box">
          <div class="stat-number blue">${data.text_length}</div>
          <div class="stat-label">Chars Scanned</div>
        </div>
        <div class="stat-box">
          <div class="stat-number blue">${data.time_ms}ms</div>
          <div class="stat-label">Scan Time</div>
        </div>
      </div>
      <div class="highlighted-text">${highlightedText}</div>
      <div class="match-list">${rows}</div>`;
  }

  // Wrap matched keywords in <mark> tags without breaking overlaps
  function buildHighlight(text, matches) {
    const sorted = [...matches].sort((a, b) => a.position - b.position);
    let html = '';
    let cursor = 0;
    for (const m of sorted) {
      if (m.position < cursor) continue;
      html += escHtml(text.slice(cursor, m.position));
      html += `<mark class="match">${escHtml(text.slice(m.position, m.end))}</mark>`;
      cursor = m.end;
    }
    html += escHtml(text.slice(cursor));
    return html;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Sample text ─────────────────────────────────────────────────────────────

  function loadSample() {
    document.getElementById('text-input').value =
`Subject: URGENT — You've been selected!

Dear user,

You are our lucky winner! Click here to claim your free money prize.
This is a limited offer — act now before it expires.

To verify your account, please confirm your bank details and wire transfer $500.
This is NOT a scam. Definitely not fraud either.

Regards,
The "Totally Legit" Team`;
    updateCharCount();
  }

  function updateCharCount() {
    const n = document.getElementById('text-input').value.length;
    document.getElementById('char-count').textContent = `${n.toLocaleString()} character${n !== 1 ? 's' : ''}`;
  }

  // ── Toast ───────────────────────────────────────────────────────────────────

  function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `show ${type}`;
    setTimeout(() => el.className = '', 2500);
  }

  // ── Health check ────────────────────────────────────────────────────────────

  async function checkHealth() {
    const dot   = document.getElementById('status-dot');
    const label = document.getElementById('status-label');
    try {
      const res  = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      dot.className   = 'status-dot online';
      label.textContent = `API online · ${data.keywords_loaded} keywords loaded`;
    } catch {
      dot.className   = 'status-dot offline';
      label.textContent = 'API offline (browser fallback active)';
    }
  }

  // ── Event listeners + init ──────────────────────────────────────────────────

  document.getElementById('kw-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addKeyword();
  });

  document.getElementById('text-input').addEventListener('input', updateCharCount);

  checkHealth();
  setInterval(checkHealth, 8000);
  renderTags();