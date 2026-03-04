/* ===== SortEx – Main JavaScript ===== */

(function () {
  'use strict';

  // ───────── DOM refs ─────────
  const $ = id => document.getElementById(id);
  const fileInput = $('fileInput');
  const fileLabel = $('fileLabel');
  const fileInfo = $('fileInfo');
  const fileName = $('fileName');
  const fileSize = $('fileSize');
  const elemCount = $('elemCount');
  const algorithmSel = $('algorithmSelect');
  const speedSlider = $('speedSlider');
  const speedValue = $('speedValue');
  const btnPlay = $('btnPlay');
  const btnPlayIcon = $('btnPlayIcon');
  const btnPlayText = $('btnPlayText');
  const btnStep = $('btnStep');
  const btnReset = $('btnReset');
  const btnDownload = $('btnDownload');
  const btnDownloadOrig = $('btnDownloadOriginal');
  const btnShowGen = $('btnShowGen');
  const genMiniPanel = $('genMiniPanel');
  const btnGenExecute = $('btnGenExecute');
  const genCountInput = $('genCount');
  const genMinInput = $('genMin');
  const genMaxInput = $('genMax');
  const canvas = $('sortCanvas');

  const canvasPlaceholder = $('canvasPlaceholder');
  const algoDesc = $('algoDesc');
  const statsPanel = $('statsPanel');
  const statComparisons = $('statComparisons');
  const statSwaps = $('statSwaps');
  const statSteps = $('statSteps');
  const dataTableWrapper = $('dataTableWrapper');
  const dataTableBody = $('dataTableBody');

  const ctx = canvas.getContext('2d');

  // ───────── State ─────────
  let originalArray = null;   // Float64Array from file
  let workArray = null;       // mutable copy for sorting
  let generator = null;       // sorting generator
  let animFrameId = null;
  let playing = false;
  let finished = false;
  let speed = 50;             // ms per step
  let lastStepTime = 0;

  let highlightIndices = [];  // indices currently being compared
  let swapIndices = [];       // indices just swapped
  let sortedIndices = new Set();
  let comparisons = 0;
  let swaps = 0;
  let steps = 0;

  // ───────── Algorithm descriptions ─────────
  const ALGO_INFO = {
    bubble: 'Bubble Sort – so sánh và hoán đổi các cặp phần tử liền kề, lặp lại cho đến khi mảng được sắp xếp. Độ phức tạp O(n²).',
    selection: 'Selection Sort – tìm phần tử nhỏ nhất trong phần chưa sắp xếp và đặt vào đúng vị trí. Độ phức tạp O(n²).',
    insertion: 'Insertion Sort – lần lượt chèn từng phần tử vào vị trí đúng trong phần đã sắp xếp. Độ phức tạp O(n²).',
    merge: 'Merge Sort – chia mảng thành hai nửa, sắp xếp đệ quy rồi trộn lại. Độ phức tạp O(n log n).',
    quick: 'Quick Sort – chọn pivot, phân hoạch mảng, sắp xếp đệ quy hai phần. Độ phức tạp trung bình O(n log n).',
  };

  // ───────── Sorting generators ─────────
  // Each yields { type, indices, array } objects
  // type: 'compare' | 'swap' | 'sorted' | 'done'

  function* bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - 1 - i; j++) {
        yield { type: 'compare', indices: [j, j + 1] };
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          yield { type: 'swap', indices: [j, j + 1] };
          swapped = true;
        }
      }
      yield { type: 'sorted', indices: [n - 1 - i] };
      if (!swapped) {
        for (let k = 0; k <= n - 2 - i; k++) yield { type: 'sorted', indices: [k] };
        break;
      }
    }
    yield { type: 'sorted', indices: [0] };
    yield { type: 'done' };
  }

  function* selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        yield { type: 'compare', indices: [minIdx, j] };
        if (arr[j] < arr[minIdx]) minIdx = j;
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        yield { type: 'swap', indices: [i, minIdx] };
      }
      yield { type: 'sorted', indices: [i] };
    }
    yield { type: 'sorted', indices: [arr.length - 1] };
    yield { type: 'done' };
  }

  function* insertionSort(arr) {
    const n = arr.length;
    yield { type: 'sorted', indices: [0] };
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0) {
        yield { type: 'compare', indices: [j - 1, j] };
        if (arr[j - 1] > arr[j]) {
          [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
          yield { type: 'swap', indices: [j - 1, j] };
          j--;
        } else {
          break;
        }
      }
      yield { type: 'sorted', indices: [j] };
    }
    for (let i = 0; i < n; i++) yield { type: 'sorted', indices: [i] };
    yield { type: 'done' };
  }

  function* mergeSortGen(arr) {
    yield* mergeSortHelper(arr, 0, arr.length - 1);
    for (let i = 0; i < arr.length; i++) yield { type: 'sorted', indices: [i] };
    yield { type: 'done' };
  }

  function* mergeSortHelper(arr, left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    yield* mergeSortHelper(arr, left, mid);
    yield* mergeSortHelper(arr, mid + 1, right);
    yield* merge(arr, left, mid, right);
  }

  function* merge(arr, left, mid, right) {
    const temp = [];
    let i = left, j = mid + 1;
    while (i <= mid && j <= right) {
      yield { type: 'compare', indices: [i, j] };
      if (arr[i] <= arr[j]) {
        temp.push(arr[i++]);
      } else {
        temp.push(arr[j++]);
      }
    }
    while (i <= mid) temp.push(arr[i++]);
    while (j <= right) temp.push(arr[j++]);
    for (let k = 0; k < temp.length; k++) {
      arr[left + k] = temp[k];
      yield { type: 'swap', indices: [left + k] };
    }
  }

  function* quickSortGen(arr) {
    yield* quickSortHelper(arr, 0, arr.length - 1);
    for (let i = 0; i < arr.length; i++) yield { type: 'sorted', indices: [i] };
    yield { type: 'done' };
  }

  function* quickSortHelper(arr, low, high) {
    if (low >= high) {
      if (low >= 0 && low < arr.length) yield { type: 'sorted', indices: [low] };
      return;
    }
    const pivotIdx = yield* partition(arr, low, high);
    yield { type: 'sorted', indices: [pivotIdx] };
    yield* quickSortHelper(arr, low, pivotIdx - 1);
    yield* quickSortHelper(arr, pivotIdx + 1, high);
  }

  function* partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      yield { type: 'compare', indices: [j, high] };
      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          yield { type: 'swap', indices: [i, j] };
        }
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    yield { type: 'swap', indices: [i + 1, high] };
    return i + 1;
  }

  const ALGORITHMS = {
    bubble: bubbleSort,
    selection: selectionSort,
    insertion: insertionSort,
    merge: mergeSortGen,
    quick: quickSortGen,
  };

  // ───────── Canvas rendering ─────────
  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth * devicePixelRatio;
    canvas.height = wrapper.clientHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    canvas.style.width = wrapper.clientWidth + 'px';
    canvas.style.height = wrapper.clientHeight + 'px';
    if (workArray) drawBars();
  }

  function drawBars() {
    if (!workArray) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const n = workArray.length;
    const gap = Math.max(1, Math.floor(w * 0.005));
    const barW = Math.max(2, (w - gap * (n + 1)) / n);
    const min = workArray.reduce((a, b) => Math.min(a, b), Infinity);
    const max = workArray.reduce((a, b) => Math.max(a, b), -Infinity);
    const range = max - min || 1;
    const topPad = 24;
    const botPad = 18;
    const availH = h - topPad - botPad;

    for (let i = 0; i < n; i++) {
      const x = gap + i * (barW + gap);
      const normH = ((workArray[i] - min) / range) * availH;
      const barH = Math.max(2, normH);
      const y = h - botPad - barH;

      // Color logic
      let fill;
      if (sortedIndices.has(i)) {
        fill = createGrad(ctx, x, y, barH, '#34d399', '#059669');
      } else if (swapIndices.includes(i)) {
        fill = createGrad(ctx, x, y, barH, '#f87171', '#dc2626');
      } else if (highlightIndices.includes(i)) {
        fill = createGrad(ctx, x, y, barH, '#fbbf24', '#d97706');
      } else {
        fill = createGrad(ctx, x, y, barH, '#818cf8', '#6366f1');
      }

      ctx.fillStyle = fill;
      ctx.beginPath();
      const r = Math.min(4, barW / 2);
      roundedRect(ctx, x, y, barW, barH, r);
      ctx.fill();

      // Value label for small arrays
      if (n <= 30) {
        ctx.fillStyle = '#aaa';
        ctx.font = `${Math.min(11, barW * 0.7)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(formatNum(workArray[i]), x + barW / 2, h - 4);
      }
    }
  }

  function createGrad(ctx, x, y, h, c1, c2) {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  function formatNum(v) {
    if (Number.isInteger(v)) return v.toString();
    return v.toFixed(2);
  }

  // ───────── File handling ─────────
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result;
      if (buf.byteLength % 8 !== 0) {
        alert('Tập tin không hợp lệ! Kích thước phải là bội số của 8 bytes.');
        return;
      }
      originalArray = new Float64Array(buf);
      loadData(file.name, file.size, originalArray);
    };
    reader.readAsArrayBuffer(file);
  });

  function loadData(name, size, arr) {
    // Show info
    fileInfo.classList.remove('hidden');
    fileName.textContent = name;
    fileSize.textContent = formatBytes(size);
    elemCount.textContent = arr.length.toLocaleString();

    // Reset state
    resetSort();
    workArray = Float64Array.from(arr);

    // Enable buttons
    btnPlay.disabled = false;
    btnStep.disabled = false;
    btnReset.disabled = false;
    algorithmSel.disabled = false;

    // Show canvas
    canvasPlaceholder.classList.add('hidden');
    resizeCanvas();
    drawBars();

    // Build data table
    buildDataTable(arr);
    dataTableWrapper.classList.remove('hidden');

    // Stats
    statsPanel.classList.remove('hidden');

    updateAlgoDesc();
  }

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  }

  function buildDataTable(arr) {
    dataTableBody.innerHTML = '';
    const limit = Math.min(arr.length, 200);
    for (let i = 0; i < limit; i++) {
      const tr = document.createElement('tr');
      tr.id = 'row-' + i;
      tr.innerHTML = `<td>${i}</td><td>${arr[i]}</td>`;
      dataTableBody.appendChild(tr);
    }
    if (arr.length > limit) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="2" style="text-align:center;color:#666">… và ${arr.length - limit} phần tử khác</td>`;
      dataTableBody.appendChild(tr);
    }
  }

  function updateDataTable() {
    if (!workArray) return;
    const rows = dataTableBody.querySelectorAll('tr[id^="row-"]');
    rows.forEach((tr, i) => {
      if (i < workArray.length) {
        tr.children[1].textContent = workArray[i];
        tr.className = '';
        if (sortedIndices.has(i)) tr.className = 'highlight-sorted';
        else if (swapIndices.includes(i)) tr.className = 'highlight-swap';
        else if (highlightIndices.includes(i)) tr.className = 'highlight-compare';
      }
    });
  }

  // ───────── Sorting control ─────────
  function initGenerator() {
    const alg = algorithmSel.value;
    workArray = Float64Array.from(originalArray);
    generator = ALGORITHMS[alg](workArray);
    comparisons = 0;
    swaps = 0;
    steps = 0;
    highlightIndices = [];
    swapIndices = [];
    sortedIndices = new Set();
    finished = false;
    updateStats();
  }

  function doStep() {
    if (!generator || finished) return false;
    const result = generator.next();
    if (result.done || (result.value && result.value.type === 'done')) {
      finished = true;
      highlightIndices = [];
      swapIndices = [];
      // Mark all sorted
      for (let i = 0; i < workArray.length; i++) sortedIndices.add(i);
      drawBars();
      updateDataTable();
      updateStats();
      btnDownload.disabled = false;
      setPlayState(false);
      return false;
    }

    const ev = result.value;
    steps++;
    if (ev.type === 'compare') {
      comparisons++;
      highlightIndices = ev.indices;
      swapIndices = [];
    } else if (ev.type === 'swap') {
      swaps++;
      swapIndices = ev.indices;
      highlightIndices = [];
    } else if (ev.type === 'sorted') {
      ev.indices.forEach(i => sortedIndices.add(i));
      highlightIndices = [];
      swapIndices = [];
    }

    drawBars();
    updateDataTable();
    updateStats();
    return true;
  }

  function updateStats() {
    statComparisons.textContent = comparisons.toLocaleString();
    statSwaps.textContent = swaps.toLocaleString();
    statSteps.textContent = steps.toLocaleString();
  }

  function animate(ts) {
    if (!playing) return;
    if (ts - lastStepTime >= speed) {
      lastStepTime = ts;
      if (!doStep()) {
        playing = false;
        setPlayState(false);
        return;
      }
    }
    animFrameId = requestAnimationFrame(animate);
  }

  function setPlayState(isPlaying) {
    playing = isPlaying;
    btnPlayIcon.textContent = isPlaying ? '⏸' : '▶';
    btnPlayText.textContent = isPlaying ? 'Tạm dừng' : (finished ? 'Chạy' : 'Tiếp tục');
    if (finished) {
      btnPlayText.textContent = 'Hoàn tất ✓';
      btnPlay.disabled = true;
      btnStep.disabled = true;
    }
  }

  // ───────── Reset ─────────
  function resetSort() {
    playing = false;
    finished = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    generator = null;
    highlightIndices = [];
    swapIndices = [];
    sortedIndices = new Set();
    comparisons = 0;
    swaps = 0;
    steps = 0;
    updateStats();
    btnDownload.disabled = true;
    if (originalArray) {
      workArray = Float64Array.from(originalArray);
      drawBars();
      buildDataTable(workArray);
      setPlayState(false);
      btnPlay.disabled = false;
      btnStep.disabled = false;
      btnPlayText.textContent = 'Chạy';
    }
  }

  // ───────── Event listeners ─────────
  btnPlay.addEventListener('click', () => {
    if (finished) return;
    if (!generator) initGenerator();
    if (playing) {
      playing = false;
      setPlayState(false);
    } else {
      playing = true;
      setPlayState(true);
      lastStepTime = 0;
      animFrameId = requestAnimationFrame(animate);
    }
  });

  btnStep.addEventListener('click', () => {
    if (finished) return;
    if (!generator) initGenerator();
    playing = false;
    setPlayState(false);
    doStep();
  });

  btnReset.addEventListener('click', () => {
    resetSort();
  });

  speedSlider.addEventListener('input', () => {
    speed = parseInt(speedSlider.value, 10);
    speedValue.textContent = speed;
  });

  algorithmSel.addEventListener('change', () => {
    resetSort();
    updateAlgoDesc();
  });

  function updateAlgoDesc() {
    const alg = algorithmSel.value;
    algoDesc.innerHTML = ALGO_INFO[alg] || '';
  }

  btnDownload.addEventListener('click', () => {
    if (!workArray) return;
    const blob = new Blob([workArray.buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sorted_output.bin';
    a.click();
    URL.revokeObjectURL(url);
  });

  btnDownloadOrig.addEventListener('click', () => {
    if (!originalArray) return;
    const blob = new Blob([originalArray.buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'input_data.bin';
    a.click();
    URL.revokeObjectURL(url);
  });

  // ───────── Embedded Generation ─────────

  btnShowGen.addEventListener('click', () => {
    genMiniPanel.classList.toggle('hidden');
    btnShowGen.textContent = genMiniPanel.classList.contains('hidden')
      ? '🎲 Sinh dữ liệu mẫu...'
      : '✕ Đóng bảng sinh dữ liệu';
  });

  btnGenExecute.addEventListener('click', () => {
    const count = Math.max(2, Math.min(1000, parseInt(genCountInput.value, 10) || 20));
    const min = parseFloat(genMinInput.value) || 0;
    const max = parseFloat(genMaxInput.value) || 100;

    const arr = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      arr[i] = Math.round((min + Math.random() * (max - min)) * 100) / 100;
    }

    originalArray = arr;
    loadData('generated_data.bin', arr.byteLength, arr);

    // Auto-hide panel after generation
    genMiniPanel.classList.add('hidden');
    btnShowGen.textContent = '🎲 Sinh dữ liệu mẫu...';
  });

  // ───────── Resize ─────────

  window.addEventListener('resize', () => resizeCanvas());
  resizeCanvas();

  // ───────── Drag & Drop ─────────
  fileLabel.addEventListener('dragover', e => {
    e.preventDefault();
    fileLabel.style.borderColor = '#818cf8';
    fileLabel.style.background = 'rgba(129,140,248,.1)';
  });
  fileLabel.addEventListener('dragleave', () => {
    fileLabel.style.borderColor = '';
    fileLabel.style.background = '';
  });
  fileLabel.addEventListener('drop', e => {
    e.preventDefault();
    fileLabel.style.borderColor = '';
    fileLabel.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change'));
    }
  });

})();
