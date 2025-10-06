(() => {
  const state = {
    data: window.__INITIAL_STATE__ || {},
    selections: [null, null],
  };

  const elementsGrid = document.getElementById('elements-grid');
  const statusMessage = document.getElementById('status-message');
  const energyFill = document.getElementById('energy-fill');
  const energyValue = document.getElementById('energy-value');
  const ageProgressPath = document.getElementById('age-progress');
  const ageName = document.getElementById('age-name');
  const ageProgressText = document.getElementById('age-progress-text');
  const discoveredCount = document.getElementById('discovered-count');
  const legacyMultiplier = document.getElementById('legacy-multiplier');
  const logList = document.getElementById('log-list');
  const selectedFirst = document.getElementById('selected-first');
  const selectedSecond = document.getElementById('selected-second');

  function safeIconName(name) {
    return name.replace(/[^a-z0-9]/gi, '') || 'Element';
  }

  function renderElements() {
    elementsGrid.innerHTML = '';
    const discovered = state.data.discovered || [];
    discovered.forEach((name) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'element-card';
      card.setAttribute('role', 'listitem');
      card.dataset.name = name;

      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'icon';
      const iconImg = document.createElement('img');
      iconImg.alt = `${name} icon`;
      iconImg.src = `${window.__ICON_BASE__}/${safeIconName(name)}.svg`;
      iconWrapper.appendChild(iconImg);

      const label = document.createElement('div');
      label.className = 'name';
      label.textContent = name;

      card.appendChild(iconWrapper);
      card.appendChild(label);

      card.addEventListener('click', () => {
        toggleSelection(name);
        updateSelections();
        renderElements();
      });

      if (state.selections.includes(name)) {
        card.classList.add('selected');
      }

      elementsGrid.appendChild(card);
    });
  }

  function toggleSelection(name) {
    const [first, second] = state.selections;
    if (first === name) {
      state.selections[0] = null;
      return;
    }
    if (second === name) {
      state.selections[1] = null;
      return;
    }
    if (!first) {
      state.selections[0] = name;
    } else if (!second) {
      state.selections[1] = name;
    } else {
      state.selections = [name, null];
    }
  }

  function updateSelections() {
    const [first, second] = state.selections;
    selectedFirst.textContent = first ? first : '—';
    selectedSecond.textContent = second ? second : '—';
  }

  function computeAgeProgress(discoveredLength) {
    const thresholds = state.data.age_thresholds || [0];
    const ageIndex = state.data.age_index || 0;
    const currentThreshold = thresholds[Math.min(ageIndex, thresholds.length - 1)];
    const nextThreshold = thresholds[Math.min(ageIndex + 1, thresholds.length - 1)];

    if (ageIndex >= thresholds.length - 1 || nextThreshold === currentThreshold) {
      return 1;
    }
    const numerator = Math.max(0, discoveredLength - currentThreshold);
    const denominator = Math.max(1, nextThreshold - currentThreshold);
    return Math.min(1, numerator / denominator);
  }

  function updateHud() {
    const { energy = 0, energy_cap: cap = 20 } = state.data;
    const percent = Math.min(100, Math.round((energy / cap) * 100));
    energyFill.style.width = `${percent}%`;
    energyValue.textContent = `${energy} / ${cap}`;

    const discovered = state.data.discovered || [];
    const totalElements = state.data.all_elements?.length || discovered.length;
    discoveredCount.textContent = `${discovered.length} / ${totalElements}`;
    legacyMultiplier.textContent = state.data.legacy_multiplier?.toFixed(2) ?? '1.00';

    ageName.textContent = state.data.age || 'Primal';
    const progressPercent = Math.round(computeAgeProgress(discovered.length) * 100);
    ageProgressPath.setAttribute('stroke-dasharray', `${progressPercent}, 100`);
    ageProgressText.textContent = `${discovered.length} discoveries`;
  }

  function updateLog() {
    logList.innerHTML = '';
    (state.data.discovery_log || []).slice().reverse().forEach((entry) => {
      const li = document.createElement('li');
      li.className = `log-entry ${entry.success ? 'success' : 'fail'}`;
      const message = document.createElement('span');
      message.textContent = entry.message;
      const timestamp = document.createElement('span');
      timestamp.className = 'timestamp';
      timestamp.textContent = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '';
      li.appendChild(message);
      li.appendChild(timestamp);
      logList.appendChild(li);
    });
  }

  function setStatus(message, success) {
    if (!message) {
      statusMessage.textContent = '';
      statusMessage.classList.remove('success', 'fail');
      return;
    }
    statusMessage.textContent = message;
    statusMessage.classList.toggle('success', success === true);
    statusMessage.classList.toggle('fail', success === false);
  }

  function applyState(newState, message, success) {
    state.data = { ...state.data, ...newState };
    renderElements();
    updateHud();
    updateSelections();
    updateLog();
    if (typeof message !== 'undefined') {
      setStatus(message, success);
    }
  }

  async function fetchState() {
    const response = await fetch('/api/state/');
    if (response.ok) {
      const payload = await response.json();
      applyState(payload);
    }
  }

  async function combine() {
    const [first, second] = state.selections;
    if (!first || !second) {
      setStatus('Select two elements to synthesize.', false);
      return;
    }
    const response = await fetch('/api/combine/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first, second }),
    });
    if (response.ok) {
      const payload = await response.json();
      applyState(payload, payload.message, payload.success);
      if (payload.success) {
        state.selections = [null, null];
        updateSelections();
        renderElements();
      }
    } else {
      setStatus('Combination failed to process.', false);
    }
  }

  async function resetUniverse() {
    const response = await fetch('/api/reset/', { method: 'POST' });
    if (response.ok) {
      const payload = await response.json();
      state.selections = [null, null];
      applyState(payload, payload.message, true);
    }
  }

  document.getElementById('combine-button').addEventListener('click', combine);
  document.getElementById('reset-button').addEventListener('click', resetUniverse);

  setInterval(fetchState, 20000);

  applyState(state.data, 'Welcome back to the Nexus.', true);
})();
