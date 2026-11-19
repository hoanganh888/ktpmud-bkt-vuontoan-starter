/* Trang làm bài chung: hỗ trợ cả dạng Estimate trong luồng học hiện có. */
(function lessonPlayer() {
  const params = new URLSearchParams(location.search);
  const lessonId = params.get('lesson');
  const setId = params.get('set');
  const startedAt = Date.now();
  const answers = {};
  let questions = [];
  let submitted = false;

  const container = document.getElementById('questions-container');
  const progressBar = document.getElementById('lesson-progress');
  const progressText = document.getElementById('lesson-progress-text');
  const resultBox = document.getElementById('lesson-result');

  function isAnswered(q) {
    const value = answers[q.id];
    if (q.type === 'estimate') return !!(value && value.estimate !== undefined && String(value.estimate).trim() !== '');
    return value != null && String(value).trim() !== '';
  }

  function updateProgress() {
    const done = questions.filter(isAnswered).length;
    if (progressBar) progressBar.style.width = questions.length ? `${Math.round(done / questions.length * 100)}%` : '0%';
    if (progressText) progressText.textContent = `Đã trả lời ${done}/${questions.length} câu`;
  }

  function render() {
    container.innerHTML = questions.map((q, idx) => {
      let body = '';
      if (q.type === 'estimate') {
        body = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <label class="block font-label-md">1. Kết quả ước lượng
            <input data-estimate="${q.id}" type="number" step="any" inputmode="decimal" placeholder="Kết quả ước lượng"
              class="mt-2 w-full h-12 px-4 rounded-xl bg-surface-container-low text-primary focus:outline-none focus:ring-4 focus:ring-primary-fixed"/>
          </label>
          <label class="block font-label-md">2. Kết quả tính chính xác
            <input data-exact="${q.id}" type="number" step="any" inputmode="decimal" placeholder="Kết quả chính xác"
              class="mt-2 w-full h-12 px-4 rounded-xl bg-surface-container-low text-primary focus:outline-none focus:ring-4 focus:ring-primary-fixed"/>
          </label>
        </div>
        <div class="flex flex-wrap items-center gap-3 mt-3">
          <button type="button" data-check-estimate="${q.id}" class="px-4 py-2 rounded-xl bg-primary text-white font-label-md hover:opacity-90">Kiểm tra ước lượng</button>
          <span data-estimate-feedback="${q.id}" role="status" aria-live="polite" class="font-label-md text-on-surface-variant"></span>
        </div>
        <p class="mt-2 text-sm text-on-surface-variant">Ước lượng trước, sau đó tự tính chính xác.</p>`;
      } else if (q.type === 'multiple-choice' && q.options) {
        body = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">${q.options.map((op, i) => `
          <button type="button" data-q="${q.id}" data-val="${['A', 'B', 'C', 'D'][i]}" class="opt-btn text-left px-4 py-3 rounded-2xl bg-surface-container-low hover:bg-secondary-container/60 font-body-md transition-all">
            <strong class="text-primary">${['A', 'B', 'C', 'D'][i]}.</strong> ${op}</button>`).join('')}</div>`;
      } else if (q.type === 'paint') {
        body = `<div class="flex gap-2.5 mt-3">
          <button type="button" data-q="${q.id}" data-val="green" class="opt-btn px-5 py-3 rounded-2xl bg-secondary-fixed text-on-secondary-fixed font-headline-sm">Tô Xanh lá</button>
          <button type="button" data-q="${q.id}" data-val="yellow" class="opt-btn px-5 py-3 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm">Tô Vàng</button></div>
          <p class="mt-2 font-label-sm text-on-surface-variant">Chọn màu đúng theo kết quả của phép tính.</p>`;
      } else if (q.type === 'compare') {
        body = `<div class="flex gap-2.5 mt-3">${['>', '<', '='].map(s => `
          <button type="button" data-q="${q.id}" data-val="${s}" class="opt-btn w-14 h-14 rounded-2xl bg-surface-container-low font-headline-lg text-primary">${s}</button>`).join('')}</div>`;
      } else {
        body = `<input data-q="${q.id}" type="text" inputmode="numeric" placeholder="Điền đáp số..." class="mt-3 w-56 h-14 text-center rounded-2xl bg-surface-container-low text-primary font-headline-lg focus:outline-none focus:ring-4 focus:ring-primary-fixed"/>`;
      }
      return `<article class="rounded-3xl bg-surface-container-lowest shadow-[0_8px_24px_rgba(0,97,39,0.06)] p-6">
        <p class="font-label-sm text-tertiary font-bold">Câu ${idx + 1} • ${q.points} điểm${q.category ? ' • ' + q.category : ''}</p>
        <h3 class="font-headline-md mt-1">${q.prompt}</h3>${body}</article>`;
    }).join('');

    container.querySelectorAll('.opt-btn').forEach(btn => btn.addEventListener('click', () => {
      if (submitted) return;
      answers[btn.dataset.q] = btn.dataset.val;
      container.querySelectorAll(`.opt-btn[data-q="${btn.dataset.q}"]`).forEach(b => {
        b.classList.toggle('ring-4', b === btn);
        b.classList.toggle('ring-primary-fixed-dim', b === btn);
      });
      updateProgress();
    }));
    container.querySelectorAll('input[data-q]').forEach(inp => inp.addEventListener('input', () => {
      answers[inp.dataset.q] = inp.value.trim(); updateProgress();
    }));
    container.querySelectorAll('input[data-estimate], input[data-exact]').forEach(inp => inp.addEventListener('input', () => {
      const id = inp.dataset.estimate || inp.dataset.exact;
      const current = answers[id] && typeof answers[id] === 'object' ? answers[id] : {};
      if (inp.dataset.estimate) current.estimate = inp.value;
      else current.exactAnswer = inp.value;
      current.status = current.status || 'unknown';
      answers[id] = current;
      updateProgress();
    }));
    container.querySelectorAll('[data-check-estimate]').forEach(btn => btn.addEventListener('click', async () => {
      const id = btn.dataset.checkEstimate;
      const current = answers[id] || {};
      if (current.estimate == null || String(current.estimate).trim() === '') {
        const feedback = container.querySelector(`[data-estimate-feedback="${id}"]`);
        feedback.textContent = 'Em hãy nhập kết quả ước lượng trước nhé.';
        feedback.className = 'font-label-md text-error';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Đang kiểm tra...';
      try {
        const result = await window.MathAPI.post('/api/estimate/check', { questionId: id, estimate: current.estimate });
        current.status = result.status;
        answers[id] = current;
        const feedback = container.querySelector(`[data-estimate-feedback="${id}"]`);
        feedback.textContent = result.message;
        feedback.className = `font-label-md ${result.status === 'exact' ? 'text-green-700' : result.status.startsWith('within_') ? 'text-amber-700' : 'text-error'}`;
        const estimateInput = container.querySelector(`[data-estimate="${id}"]`);
        if (result.status === 'exact') {
          const exactInput = container.querySelector(`[data-exact="${id}"]`);
          if (exactInput) exactInput.value = current.estimate;
          current.exactAnswer = exactInput ? exactInput.value : current.estimate;
          answers[id] = current;
          estimateInput.classList.add('ring-2', 'ring-green-500');
          exactInput?.classList.add('ring-2', 'ring-green-500');
        } else if (result.status.startsWith('within_')) {
          estimateInput.classList.add('ring-2', 'ring-amber-500');
        } else {
          estimateInput.classList.add('ring-2', 'ring-red-500');
        }
        btn.textContent = 'Đã kiểm tra';
        estimateInput.disabled = true;
        updateProgress();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Kiểm tra ước lượng';
        const feedback = container.querySelector(`[data-estimate-feedback="${id}"]`);
        feedback.textContent = `Không kiểm tra được: ${err.message}`;
        feedback.className = 'font-label-md text-error';
      }
    }));
    // Khôi phục câu trả lời và feedback đã lưu khi tải lại trang.
    questions.forEach(q => {
      const value = answers[q.id];
      if (q.type === 'estimate' && value && typeof value === 'object') {
        const estimateInput = container.querySelector(`[data-estimate="${q.id}"]`);
        const exactInput = container.querySelector(`[data-exact="${q.id}"]`);
        const feedback = container.querySelector(`[data-estimate-feedback="${q.id}"]`);
        const checkButton = container.querySelector(`[data-check-estimate="${q.id}"]`);
        if (estimateInput) estimateInput.value = value.estimate ?? '';
        if (exactInput) exactInput.value = value.exactAnswer ?? '';
        const messages = {
          exact: 'Kết quả ước lượng khớp với kết quả chính xác.',
          within_above: 'Giá trị ước lượng nằm trên kết quả chính xác nhưng vẫn trong sai số cho phép.',
          within_below: 'Giá trị ước lượng nằm dưới kết quả chính xác nhưng vẫn trong sai số cho phép.',
          outside: 'Giá trị ước lượng nằm ngoài sai số cho phép.',
          unknown: 'Trạng thái: unknown – chưa kiểm tra'
        };
        const status = value.status || 'unknown';
        if (feedback) {
          feedback.textContent = messages[status] || messages.unknown;
          feedback.className = `font-label-md ${status === 'exact' ? 'text-green-700' : status.startsWith('within_') ? 'text-amber-700' : status === 'outside' ? 'text-error' : 'text-on-surface-variant'}`;
        }
        if (status !== 'unknown') {
          if (checkButton) { checkButton.disabled = true; checkButton.textContent = 'Đã kiểm tra'; }
          if (estimateInput) {
            estimateInput.disabled = true;
            estimateInput.classList.add('ring-2', status === 'exact' ? 'ring-green-500' : status.startsWith('within_') ? 'ring-amber-500' : 'ring-red-500');
          }
          if (status === 'exact' && exactInput) exactInput.classList.add('ring-2', 'ring-green-500');
        }
      } else if (q.type !== 'estimate' && value != null) {
        const input = container.querySelector(`input[data-q="${q.id}"]`);
        if (input) input.value = value;
        container.querySelectorAll(`.opt-btn[data-q="${q.id}"]`).forEach(btn => {
          const selected = btn.dataset.val === String(value);
          btn.classList.toggle('ring-4', selected);
          btn.classList.toggle('ring-primary-fixed-dim', selected);
        });
      }
    });
    updateProgress();
  }

  function showSavedResult(r, restored = false) {
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `<div class="text-4xl mb-1">📘</div>
      <h3 class="font-headline-md">Em đạt ${r.scorePercent}% — đủ điểm ở ${r.correctCount}/${r.totalCount} câu!</h3>
      <p class="font-body-md mt-1">${r.starsEarned ? `Nhận thêm ⭐ +${r.starsEarned} Sao vàng.` : 'Điểm đã được lưu vào hồ sơ.'}
      ${restored ? ' Đây là kết quả đã lưu từ lần nộp trước.' : ' Kết quả đã được lưu vào hồ sơ.'}</p>`;
  }

  async function init() {
    if (!setId) { container.innerHTML = '<p class="font-body-md">Thiếu mã bộ bài. Em quay lại Mục Lục chọn bài nhé!</p>'; return; }
    try {
      if (lessonId) {
        const { lessons } = await window.MathAPI.get('/api/lessons');
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
          document.getElementById('lesson-title').textContent = `Bài ${lesson.number}: ${lesson.title}`;
          document.getElementById('lesson-desc').textContent = lesson.description || '';
        }
      }
      const data = await window.MathAPI.get(`/api/question-sets/${encodeURIComponent(setId)}/questions`);
      questions = data.questions;
      questions.filter(q => q.type === 'estimate').forEach(q => {
        if (!answers[q.id]) answers[q.id] = { estimate: '', exactAnswer: '', status: 'unknown' };
      });
      document.getElementById('set-kind').textContent = `Bộ bài: ${setId} • ${questions.length} câu`;
      const latest = await window.MathAPI.get(`/api/submissions/${encodeURIComponent(setId)}/latest`);
      if (latest.submission) {
        Object.assign(answers, latest.submission.answers || {});
        submitted = true;
      }
      render();
      if (submitted) {
        container.querySelectorAll('input,button').forEach(el => { el.disabled = true; });
        showSavedResult(latest.submission, true);
        document.getElementById('btn-submit-lesson').disabled = true;
        document.getElementById('btn-submit-lesson').textContent = 'Đã nộp bài';
      }
    } catch (err) { container.innerHTML = `<p class="font-body-md">Chưa tải được bài: ${err.message}</p>`; }
  }

  document.getElementById('btn-submit-lesson').addEventListener('click', async () => {
    if (submitted) return;
    const missing = questions.filter(q => !isAnswered(q)).length;
    if (missing > 0 && !confirm(`Em còn ${missing} câu chưa trả lời. Vẫn nộp bài nhé?`)) return;
    try {
      const r = await window.MathAPI.post('/api/submissions', { setId, answers, durationSec: Math.round((Date.now() - startedAt) / 1000) });
      submitted = true;
      container.querySelectorAll('input,button').forEach(el => { el.disabled = true; });
      document.getElementById('btn-submit-lesson').disabled = true;
      document.getElementById('btn-submit-lesson').textContent = 'Đã nộp bài';
      showSavedResult(r);
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) { alert(`Chưa nộp được bài: ${err.message}`); }
  });

  document.addEventListener('mathapp:user-ready', init);
})();
