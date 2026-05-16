/**
 * StudyAgent — Frontend Application
 * Handles navigation, syllabus parsing, simulated AI explanations, and notes export.
 */

// ═══ STATE ═══
const state = {
  currentView: 'landing',
  topics: [],
  currentTopicIndex: -1,
  completedTopics: new Set(),
  explanations: {},
  notesMarkdown: '',
  subject: 'General Studies',
  model: 'gemma4:31b-cloud',
  autoProceeding: false,
  countdownTimer: null,
  studyStartTime: null,
};

// ═══ DOM REFS ═══
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ═══ NAVIGATION ═══
function switchView(viewName) {
  $$('.view').forEach(v => v.classList.remove('active'));
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  const view = $(`#view-${viewName}`);
  const link = $(`[data-view="${viewName}"]`);
  if (view) view.classList.add('active');
  if (link) link.classList.add('active');
  state.currentView = viewName;
  window.scrollTo(0, 0);
}

// Nav link clicks
$$('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

$('#logo-link').addEventListener('click', (e) => {
  e.preventDefault();
  switchView('landing');
});

// Hero buttons → Study view
$('#hero-start-btn').addEventListener('click', () => switchView('study'));
$('#cta-start-btn').addEventListener('click', () => switchView('study'));
$('#hero-demo-btn').addEventListener('click', () => {
  switchView('study');
  // Auto-fill demo syllabus and subject
  $('#subject-input').value = DEMO_SUBJECT;
  $('#syllabus-textarea').value = DEMO_SYLLABUS;
});

// ═══ SYLLABUS PARSING (mirrors main.py logic) ═══
function parseSyllabus(text) {
  const topics = [];
  let currentUnit = 'General';

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^(unit|module|chapter|section)\s*[\d\:\-\.]/i.test(line)) {
      currentUnit = line.replace(/:$/, '').trim();
    } else if (/^[-•*◦]/.test(line) || /^\d+[\.)\]]\s/.test(line)) {
      const topic = line.replace(/^[-•*◦\d\.\)\]]\s*/, '').trim();
      if (topic && topic.length > 2) {
        topics.push({ unit: currentUnit, topic });
      }
    }
  }
  return topics;
}

// Parse button
$('#parse-btn').addEventListener('click', () => {
  const text = $('#syllabus-textarea').value.trim();
  if (!text) {
    showToast('Please paste your syllabus first!');
    return;
  }

  state.topics = parseSyllabus(text);
  state.subject = $('#subject-input').value.trim() || 'General Studies';
  state.model = $('#model-select').value;
  state.completedTopics.clear();
  state.explanations = {};
  state.currentTopicIndex = -1;

  if (state.topics.length === 0) {
    showToast('No topics found. Use bullet points or numbered lists.');
    return;
  }

  renderTopicsList();
  showToast(`Found ${state.topics.length} topics for ${state.subject}!`);
});

// ═══ RENDER TOPICS LIST ═══
function renderTopicsList() {
  const section = $('#topics-section');
  const list = $('#topics-list');
  section.style.display = 'block';
  $('#topic-count').textContent = `${state.topics.length} topics`;
  updateProgress();

  list.innerHTML = '';
  let lastUnit = '';

  state.topics.forEach((t, i) => {
    if (t.unit !== lastUnit) {
      lastUnit = t.unit;
      const label = document.createElement('div');
      label.className = 'unit-label';
      label.innerHTML = `<span>📦</span> ${t.unit}`;
      list.appendChild(label);
    }

    const item = document.createElement('div');
    item.className = 'topic-item';
    item.dataset.index = i;
    item.innerHTML = `
      <span class="topic-check">○</span>
      <span class="topic-name">${i + 1}. ${t.topic}</span>
    `;
    item.addEventListener('click', () => showTopic(i));
    list.appendChild(item);
  });

  $('#start-study-btn').style.display = 'block';
  $('#start-study-btn').addEventListener('click', startStudySession);
}

function updateProgress() {
  const total = state.topics.length;
  const done = state.completedTopics.size;
  const pct = total > 0 ? (done / total) * 100 : 0;
  $('#progress-fill').style.width = `${pct}%`;
  $('#progress-text').textContent = `${done} / ${total} completed`;
}

function updateTopicStates() {
  $$('.topic-item').forEach(item => {
    const idx = parseInt(item.dataset.index);
    item.classList.toggle('active', idx === state.currentTopicIndex);
    if (state.completedTopics.has(idx)) {
      item.classList.add('completed');
      item.querySelector('.topic-check').textContent = '✓';
    }
  });
}

// ═══ STUDY SESSION ═══
function startStudySession() {
  state.studyStartTime = new Date();
  state.notesMarkdown = `# ${state.subject} — Study Notes\n\n*${formatDate(state.studyStartTime)}*  |  Model: \`${state.model}\`  |  Topics: ${state.topics.length}\n\n---\n\n`;
  showTopic(0);
  $('#fab-wrapper').style.display = 'flex';
}

function showTopic(index) {
  if (index < 0 || index >= state.topics.length) return;
  clearCountdown();
  state.currentTopicIndex = index;

  const { unit, topic } = state.topics[index];

  // Show explanation view, hide others
  $('#empty-state').style.display = 'none';
  $('#completion-view').style.display = 'none';
  $('#explanation-view').style.display = 'block';
  $('#explanation-footer').style.display = 'none';

  // Update header
  $('#current-unit').textContent = unit;
  $('#current-topic-num').textContent = `${index + 1} / ${state.topics.length}`;
  $('#current-topic-title').textContent = topic;

  updateTopicStates();

  // Check if already explained
  if (state.explanations[index]) {
    renderExplanation(state.explanations[index]);
    return;
  }

  // Show loading, then simulate AI explanation
  $('#loading-state').style.display = 'flex';
  $('#explanation-content').innerHTML = '';
  $('#explanation-content').style.display = 'none';

  simulateAIExplanation(unit, topic, index);
}

// ═══ AI EXPLANATION (Real API Call) ═══
async function fetchAIExplanation(unit, topic, index) {
  try {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit, topic, subject: state.subject, model: state.model }),
    });

    const data = await res.json();

    if (data.ok) {
      return data.explanation;
    } else {
      console.error('API error:', data.error);
      showToast(`API error — using offline fallback`);
      return generateExplanation(unit, topic);
    }
  } catch (err) {
    console.error('Network error:', err);
    showToast(`Cannot reach server — using offline fallback`);
    return generateExplanation(unit, topic);
  }
}

async function simulateAIExplanation(unit, topic, index) {
  const explanation = await fetchAIExplanation(unit, topic, index);

  state.explanations[index] = explanation;
  state.completedTopics.add(index);
  updateProgress();
  updateTopicStates();

  // Append to notes
  state.notesMarkdown += `## ${unit}\n### 📌 ${topic}\n\n${explanation}\n\n---\n\n`;

  renderExplanation(explanation);
}

function renderExplanation(markdown) {
  $('#loading-state').style.display = 'none';
  const content = $('#explanation-content');
  content.style.display = 'block';
  content.innerHTML = renderMarkdown(markdown);
  content.scrollTop = 0;

  // Show footer
  $('#explanation-footer').style.display = 'flex';

  // Prev/Next buttons
  $('#prev-topic-btn').disabled = state.currentTopicIndex <= 0;
  const isLast = state.currentTopicIndex >= state.topics.length - 1;
  $('#next-topic-btn').textContent = isLast ? '🎉 Finish' : 'Next Topic →';

  // Start auto-proceed countdown if not last
  if (!isLast) {
    startCountdown(5);
  } else {
    $('#auto-proceed').style.display = 'none';
  }
}

// ═══ COUNTDOWN / AUTO-PROCEED ═══
function startCountdown(seconds) {
  const proceed = $('#auto-proceed');
  proceed.style.display = 'flex';
  let remaining = seconds;
  const circle = $('#countdown-circle');
  const circumference = 2 * Math.PI * 16; // r=16
  const text = $('#countdown-text');

  function tick() {
    text.textContent = remaining;
    const offset = circumference * (1 - remaining / seconds);
    circle.setAttribute('stroke-dashoffset', offset);

    if (remaining <= 0) {
      clearCountdown();
      goNextTopic();
      return;
    }
    remaining--;
    state.countdownTimer = setTimeout(tick, 1000);
  }
  tick();
}

function clearCountdown() {
  if (state.countdownTimer) {
    clearTimeout(state.countdownTimer);
    state.countdownTimer = null;
  }
}

$('#next-topic-btn').addEventListener('click', () => {
  clearCountdown();
  goNextTopic();
});

$('#prev-topic-btn').addEventListener('click', () => {
  clearCountdown();
  if (state.currentTopicIndex > 0) showTopic(state.currentTopicIndex - 1);
});

function goNextTopic() {
  const next = state.currentTopicIndex + 1;
  if (next < state.topics.length) {
    showTopic(next);
  } else {
    showCompletion();
  }
}

// ═══ COMPLETION ═══
function showCompletion() {
  $('#explanation-view').style.display = 'none';
  $('#completion-view').style.display = 'flex';

  const units = new Set(state.topics.map(t => t.unit));
  $('#comp-topics').textContent = state.topics.length;
  $('#comp-units').textContent = units.size;

  // Update notes view
  updateNotesView();
}

$('#view-notes-btn').addEventListener('click', () => switchView('notes'));
$('#notes-copy-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(state.notesMarkdown).then(() => {
    showToast('Notes copied to clipboard!');
  });
});

function updateNotesView() {
  if (state.notesMarkdown) {
    $('#notes-meta').textContent = `${state.subject} • Generated on ${formatDate(state.studyStartTime)} • ${state.topics.length} topics • Model: ${state.model}`;
    $('#notes-actions').style.display = 'flex';
    $('#notes-content').innerHTML = renderMarkdown(state.notesMarkdown);
  }
}

// ═══ EXPORT SYSTEM ═══

// -- Dropdown toggle logic --
$$('.export-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = trigger.closest('.export-dropdown');
    const wasOpen = dropdown.classList.contains('open');
    // Close all dropdowns first
    $$('.export-dropdown').forEach(d => d.classList.remove('open'));
    if (!wasOpen) dropdown.classList.add('open');
  });
});

// -- FAB menu toggle --
$('#fab-download').addEventListener('click', (e) => {
  e.stopPropagation();
  const wrapper = $('#fab-wrapper');
  wrapper.classList.toggle('open');
});

// -- Close dropdowns/FAB on outside click --
document.addEventListener('click', () => {
  $$('.export-dropdown').forEach(d => d.classList.remove('open'));
  const fabWrapper = $('#fab-wrapper');
  if (fabWrapper) fabWrapper.classList.remove('open');
});

// -- Wire up export options (dropdowns + FAB) --
$$('.export-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const format = btn.dataset.format;
    $$('.export-dropdown').forEach(d => d.classList.remove('open'));
    exportNotes(format);
  });
});

$$('.fab-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const format = btn.dataset.format;
    $('#fab-wrapper').classList.remove('open');
    exportNotes(format);
  });
});

// -- Export dispatcher --
function exportNotes(format) {
  if (!state.notesMarkdown) {
    showToast('No notes to export yet.');
    return;
  }
  switch (format) {
    case 'md':   downloadMarkdown(); break;
    case 'pdf':  downloadPDF(); break;
    case 'docx': downloadDOCX(); break;
    default:     downloadMarkdown();
  }
}

// -- Markdown export (original) --
function downloadMarkdown() {
  const fname = `study_notes_${formatTimestamp(new Date())}.md`;
  const blob = new Blob([state.notesMarkdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Markdown exported: ${fname}`);
}

// -- PDF export (html2pdf.js) --
async function downloadPDF() {
  if (typeof html2pdf === 'undefined') {
    showToast('PDF library not loaded. Please try again.');
    return;
  }

  const overlay = showExportLoading('Generating PDF…');

  try {
    // Build a styled container for PDF rendering
    const container = document.createElement('div');
    container.innerHTML = renderMarkdown(state.notesMarkdown);
    container.style.cssText = `
      font-family: 'Inter', 'Segoe UI', sans-serif;
      color: #1a1a2e; background: #ffffff;
      padding: 40px; font-size: 13px; line-height: 1.7;
      max-width: 700px;
    `;
    // Style headings for print
    container.querySelectorAll('h1').forEach(el => {
      el.style.cssText = 'font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 24px 0 10px; border-bottom: 2px solid #6c5ce7; padding-bottom: 6px;';
    });
    container.querySelectorAll('h2').forEach(el => {
      el.style.cssText = 'font-size: 17px; font-weight: 600; color: #6c5ce7; margin: 20px 0 8px;';
    });
    container.querySelectorAll('h3').forEach(el => {
      el.style.cssText = 'font-size: 15px; font-weight: 600; color: #333; margin: 16px 0 6px;';
    });
    container.querySelectorAll('hr').forEach(el => {
      el.style.cssText = 'border: none; height: 1px; background: #e0d8f5; margin: 20px 0;';
    });
    container.querySelectorAll('blockquote').forEach(el => {
      el.style.cssText = 'border-left: 3px solid #6c5ce7; padding: 8px 16px; margin: 12px 0; background: #f3f0ff; border-radius: 0 8px 8px 0; font-style: italic; color: #444;';
    });
    container.querySelectorAll('code').forEach(el => {
      el.style.cssText = 'background: #ede8ff; padding: 2px 5px; border-radius: 4px; font-size: 0.9em; color: #6c5ce7;';
    });
    container.querySelectorAll('strong').forEach(el => {
      el.style.cssText = 'color: #1a1a2e; font-weight: 600;';
    });
    container.querySelectorAll('li').forEach(el => {
      el.style.cssText = 'margin-bottom: 4px; color: #333;';
    });
    container.querySelectorAll('p').forEach(el => {
      el.style.cssText = 'margin-bottom: 10px; color: #333;';
    });

    document.body.appendChild(container);

    const fname = `study_notes_${formatTimestamp(new Date())}.pdf`;
    await html2pdf().set({
      margin:       [16, 16, 16, 16],
      filename:     fname,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(container).save();

    document.body.removeChild(container);
    hideExportLoading(overlay);
    showToast(`PDF exported: ${fname}`);
  } catch (err) {
    hideExportLoading(overlay);
    console.error('PDF export error:', err);
    showToast('PDF export failed. Check console for details.');
  }
}

// -- DOCX export (docx library) --
async function downloadDOCX() {
  if (typeof docx === 'undefined') {
    showToast('DOCX library not loaded. Please try again.');
    return;
  }

  const overlay = showExportLoading('Generating Word document…');

  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = docx;

    const children = [];
    const lines = state.notesMarkdown.split('\n');

    for (const rawLine of lines) {
      const line = rawLine;

      // Headings
      if (line.startsWith('### ')) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: parseInlineFormatting(line.slice(4), { bold: true, size: 24, color: '333333' }),
          spacing: { before: 200, after: 80 },
        }));
      } else if (line.startsWith('## ')) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: parseInlineFormatting(line.slice(3), { bold: true, size: 28, color: '6C5CE7' }),
          spacing: { before: 280, after: 100 },
        }));
      } else if (line.startsWith('# ')) {
        children.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: parseInlineFormatting(line.slice(2), { bold: true, size: 36, color: '1A1A2E' }),
          spacing: { before: 320, after: 120 },
          border: { bottom: { color: '6C5CE7', size: 2, style: BorderStyle.SINGLE, space: 4 } },
        }));
      }
      // Horizontal rule
      else if (line.trim() === '---') {
        children.push(new Paragraph({
          children: [],
          border: { bottom: { color: 'CCCCCC', size: 1, style: BorderStyle.SINGLE, space: 8 } },
          spacing: { before: 200, after: 200 },
        }));
      }
      // Blockquote
      else if (line.startsWith('> ')) {
        children.push(new Paragraph({
          children: parseInlineFormatting(line.slice(2), { italics: true, size: 22, color: '555555' }),
          indent: { left: 400 },
          border: { left: { color: '6C5CE7', size: 6, style: BorderStyle.SINGLE, space: 8 } },
          spacing: { before: 80, after: 80 },
        }));
      }
      // Bullet point
      else if (/^[-•*]\s/.test(line)) {
        const text = line.replace(/^[-•*]\s+/, '');
        children.push(new Paragraph({
          children: parseInlineFormatting(text, { size: 22, color: '333333' }),
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
        }));
      }
      // Numbered list
      else if (/^\d+[.)]\s/.test(line)) {
        const text = line.replace(/^\d+[.)]\s+/, '');
        children.push(new Paragraph({
          children: parseInlineFormatting(text, { size: 22, color: '333333' }),
          bullet: { level: 0 },
          spacing: { before: 40, after: 40 },
        }));
      }
      // Empty line → spacer
      else if (!line.trim()) {
        children.push(new Paragraph({ children: [], spacing: { before: 60, after: 60 } }));
      }
      // Normal paragraph
      else {
        children.push(new Paragraph({
          children: parseInlineFormatting(line, { size: 22, color: '333333' }),
          spacing: { before: 60, after: 60 },
        }));
      }
    }

    const doc = new Document({
      creator: 'StudyAgent',
      title: 'Study Notes',
      description: `Generated by StudyAgent on ${formatDate(new Date())}`,
      sections: [{
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
          },
        },
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const fname = `study_notes_${formatTimestamp(new Date())}.docx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    hideExportLoading(overlay);
    showToast(`Word document exported: ${fname}`);
  } catch (err) {
    hideExportLoading(overlay);
    console.error('DOCX export error:', err);
    showToast('DOCX export failed. Check console for details.');
  }
}

// -- DOCX inline formatting parser --
function parseInlineFormatting(text, defaults = {}) {
  const runs = [];
  // Split text by bold (**...**), italic (*...*), and code (`...`) patterns
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      runs.push(new docx.TextRun({
        text: text.slice(lastIndex, match.index),
        size: defaults.size || 22,
        color: defaults.color || '333333',
        font: 'Calibri',
        ...(defaults.italics ? { italics: true } : {}),
      }));
    }

    if (match[2]) {
      // Bold
      runs.push(new docx.TextRun({
        text: match[2],
        bold: true,
        size: defaults.size || 22,
        color: '1A1A2E',
        font: 'Calibri',
      }));
    } else if (match[4]) {
      // Italic
      runs.push(new docx.TextRun({
        text: match[4],
        italics: true,
        size: defaults.size || 22,
        color: defaults.color || '333333',
        font: 'Calibri',
      }));
    } else if (match[6]) {
      // Code
      runs.push(new docx.TextRun({
        text: match[6],
        font: 'Consolas',
        size: defaults.size ? defaults.size - 2 : 20,
        color: '6C5CE7',
        shading: { fill: 'EDE8FF' },
      }));
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    runs.push(new docx.TextRun({
      text: text.slice(lastIndex),
      size: defaults.size || 22,
      color: defaults.color || '333333',
      font: 'Calibri',
      ...(defaults.bold ? { bold: true } : {}),
      ...(defaults.italics ? { italics: true } : {}),
    }));
  }

  if (runs.length === 0) {
    runs.push(new docx.TextRun({
      text: text,
      size: defaults.size || 22,
      color: defaults.color || '333333',
      font: 'Calibri',
      ...(defaults.bold ? { bold: true } : {}),
      ...(defaults.italics ? { italics: true } : {}),
    }));
  }

  return runs;
}

// -- Loading overlay helpers --
function showExportLoading(msg) {
  const overlay = document.createElement('div');
  overlay.className = 'export-loading';
  overlay.innerHTML = `
    <div class="export-loading-card">
      <div class="export-loading-spinner"></div>
      <div class="export-loading-text">${msg}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function hideExportLoading(overlay) {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

// ═══ MARKDOWN RENDERER (simple) ═══
function renderMarkdown(md) {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Wrap remaining text in paragraphs
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('<')) return line;
    return `<p>${trimmed}</p>`;
  }).join('\n');

  return html;
}

// ═══ EXPLANATION GENERATOR (simulated) ═══
function generateExplanation(unit, topic) {
  const field = unit.replace(/^(unit|module|chapter|section)\s*[\d:.\-]\s*/i, '') || state.subject;
  return `# ${topic}

## 📖 Simple Definition
**${topic}** is a fundamental concept in ${field}. In simple terms, it refers to an important principle or technique that helps us understand and solve problems in this area.

## ⚙️ How It Works
Understanding ${topic} involves several key steps:

- **Step 1: Foundation** — Start with the basic principles and definitions
- **Step 2: Analysis** — Break down the concept into its core components
- **Step 3: Application** — See how the concept is applied in practice
- **Step 4: Evaluation** — Understand the strengths and limitations
- **Step 5: Connection** — Link it to related concepts in ${state.subject}

## 🌍 Real-Life Examples

**Example 1:**
Consider how ${topic} applies in everyday life. Whether it's the technology in your phone, the way traffic flows in a city, or how your favorite apps work — principles from this topic are at play.

**Example 2:**
In professional settings, ${topic} is used to solve real-world problems. Engineers, scientists, and practitioners rely on this concept to build better systems, make informed decisions, and drive innovation in ${state.subject}.

## 💡 Why It Matters
${topic} is important because:

- It forms a core part of ${state.subject}
- Understanding it helps you connect theory to practice
- It bridges the gap between classroom knowledge and real-world applications
- It is frequently asked in semester exams and competitive assessments

## 🔑 Key Takeaway
> **${topic}** is a critical building block in ${state.subject}. Mastering this concept will give you a strong foundation for advanced topics and real-world problem-solving in this field.`;
}

// ═══ UTILITIES ═══
function formatDate(d) {
  if (!d) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatTimestamp(d) {
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
}

function showToast(msg) {
  let toast = $('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ═══ DEMO SYLLABUS ═══
const DEMO_SYLLABUS = `Unit 1: Introduction to Artificial Intelligence
- Definition and scope of AI
- History and evolution of AI
- Types of AI: Narrow, General, Super AI
- Applications of AI in Engineering

Unit 2: Machine Learning Fundamentals
- Supervised Learning
- Unsupervised Learning
- Reinforcement Learning
- Overfitting and Underfitting

Unit 3: Neural Networks and Deep Learning
- Perceptron and Multi-Layer Perceptron
- Activation Functions
- Backpropagation Algorithm
- Convolutional Neural Networks (CNN)
- Recurrent Neural Networks (RNN)

Unit 4: Natural Language Processing
- Text Preprocessing
- Word Embeddings
- Transformers and Attention Mechanism

Unit 5: AI Ethics and Future
- Bias in AI Systems
- Responsible AI Development
- Future trends in AI`;

const DEMO_SUBJECT = 'AI for Engineers';

// ═══ INIT ═══
switchView('landing');

// Smooth scroll navbar effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const nav = $('#navbar');
  const y = window.scrollY;
  if (y > 50) {
    nav.style.borderBottomColor = 'rgba(255,255,255,0.08)';
  } else {
    nav.style.borderBottomColor = 'rgba(255,255,255,0.05)';
  }
  lastScroll = y;
});
