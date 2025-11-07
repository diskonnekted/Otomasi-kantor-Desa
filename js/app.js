(() => {
  const roomsGrid = document.getElementById('roomsGrid');
  const assets = { waterLevel: document.getElementById('waterLevel'), waterFlow: document.getElementById('waterFlow'), streetLightStatus: document.getElementById('streetLightStatus') };
  const pir = { status: document.getElementById('pirStatus'), last: document.getElementById('pirLast'), countTonight: document.getElementById('pirCountTonight') };
  const pirIndicator = document.getElementById('pirIndicator');
  const pirLog = document.getElementById('pirLog');
  const pirCard = document.getElementById('pirCard');
  const pirResetBtn = document.getElementById('pirResetLog');
  const pirEvents = [];
  let lastPirOcc = 0;
  let lastPirEventAtMs = 0;
  const pirDebounceMs = 30000; // 30 detik untuk mencegah hit beruntun

  if (pirResetBtn) {
    pirResetBtn.addEventListener('click', () => {
      // Reset tampilan dan state
      pirEvents.length = 0;
      if (pirLog) pirLog.innerHTML = '';
      if (pir.countTonight) pir.countTonight.textContent = '0';
      if (pir.last) pir.last.textContent = '-';
      if (pirIndicator) {
        pirIndicator.classList.remove('on');
        pirIndicator.classList.add('off');
      }
      if (pirCard) pirCard.classList.remove('alert');
      lastPirOcc = 0;
      lastPirEventAtMs = 0;
    });
  }
  const stats = { totalPower: document.getElementById('totalPower'), avgTemp: document.getElementById('avgTemp'), activeOccupancy: document.getElementById('activeOccupancy') };
  const connectionStatus = document.getElementById('connectionStatus');
  const simulateToggle = document.getElementById('simulateToggle');
  const queueNumber = document.getElementById('queueNumber');
  const feedbackScore = document.getElementById('feedbackScore');
  const arrivalCountEl = document.getElementById('arrivalCount');
  // Elemen pemantauan lingkungan kantor
  const envAvgTempEl = document.getElementById('envAvgTemp');
  const envAvgHumidityEl = document.getElementById('envAvgHumidity');
  const envAvgLightEl = document.getElementById('envAvgLight');
  const envHotRoomsCountEl = document.getElementById('envHotRoomsCount');
  const envLowLightCountEl = document.getElementById('envLowLightCount');
  const envLastUpdateEl = document.getElementById('envLastUpdate');
  // Elemen cuaca & LDR
  const weatherStatusEl = document.getElementById('weatherStatus');
  const lightStatusEl = document.getElementById('lightStatus');
  const weatherCardEl = document.getElementById('weatherCard');
  // Elemen card pelayanan akan dibuat dinamis; ambil referensi setelah rendering
  let pelayananIndicator;
  let pelayananArrivalStatus;
  let pelayananLastArrival;
  let pelayananArrivalLog;
  const pelayananArrivalEvents = [];
  let lastPelayananOcc = 0;
  let arrivalCountTotal = 0;

  // Elemen dan state Ruang Rapat (aula)
  let rapatIndicator;
  let rapatArrivalStatus;
  let rapatLastArrival;
  let rapatArrivalLog;
  const rapatArrivalEvents = [];
  let lastRapatOcc = 0;

  // Elemen dan state Statistik Listrik (toilet)
  let toiletPowerNow;
  let toiletEnergyToday;
  let toiletEnergyAvg;
  let toiletEnergyAccKWh = 0;
  let lastToiletTs = null;

  // Elemen dan state Tandon Air
  let tandonPercentEl;
  let tandonStatusEl;
  let tandonIndicatorEl;
  let tandonWaterEl;

  // Build room cards
  const roomCards = new Map();
  const cardColors = ['blue','sky','green','amber','red','violet'];
  APP_CONFIG.rooms.forEach(({ key, name }, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.classList.add(cardColors[i % cardColors.length]);
    if (key === 'pelayanan') {
      card.innerHTML = `
        <div class="service-header">
          <h3>Ruang Pelayanan — Kehadiran Tamu</h3>
        </div>
        <div class="kv"><span>Status</span><strong><span id="pelayananIndicator" class="indicator off"></span><span id="pelayananArrivalStatus">Tidak ada</span></strong></div>
        <div class="kv"><span>Terakhir Terdeteksi</span><strong id="pelayananLastArrival">-</strong></div>
        <div class="arrival-log">
          <div class="log-title">Log Kedatangan (terbaru)</div>
          <ul id="pelayananArrivalLog"></ul>
        </div>
        <div class="service-watermark" aria-hidden="true">
          <svg viewBox="0 0 64 64" class="service-svg">
            <!-- Ikon loket (outline yang jelas) -->
            <!-- Bingkai jendela loket -->
            <rect x="12" y="10" width="40" height="20" rx="3"></rect>
            <!-- Petugas (kepala dan badan sederhana) -->
            <circle cx="32" cy="20" r="5"></circle>
            <rect x="27" y="26" width="10" height="6" rx="2"></rect>
            <!-- Meja loket panjang -->
            <rect x="8" y="38" width="48" height="16" rx="4"></rect>
            <!-- Garis pemisah kecil di meja -->
            <line x1="20" y1="46" x2="44" y2="46"></line>
          </svg>
        </div>
      `;
    } else if (key === 'aula') {
      card.innerHTML = `
        <div class="service-header">
          <h3>Ruang Rapat — Kehadiran Tamu</h3>
        </div>
        <div class="kv"><span>Status</span><strong><span id="rapatIndicator" class="indicator off"></span><span id="rapatArrivalStatus">Tidak ada</span></strong></div>
        <div class="kv"><span>Terakhir Terdeteksi</span><strong id="rapatLastArrival">-</strong></div>
        <div class="arrival-log">
          <div class="log-title">Log Kedatangan (terbaru)</div>
          <ul id="rapatArrivalLog"></ul>
        </div>
        <div class="service-watermark" aria-hidden="true">
          <svg viewBox="0 0 64 64" class="service-svg">
            <!-- Ikon rapat: meja dan tiga orang -->
            <rect x="12" y="28" width="40" height="10" rx="4"></rect>
            <rect x="8" y="38" width="10" height="8" rx="2"></rect>
            <rect x="46" y="38" width="10" height="8" rx="2"></rect>
            <circle cx="22" cy="22" r="4"></circle>
            <circle cx="32" cy="20" r="4"></circle>
            <circle cx="42" cy="22" r="4"></circle>
            <line x1="22" y1="26" x2="22" y2="28"></line>
            <line x1="32" y1="24" x2="32" y2="28"></line>
            <line x1="42" y1="26" x2="42" y2="28"></line>
          </svg>
        </div>
      `;
    } else if (key === 'toilet') {
      card.innerHTML = `
        <div class="service-header">
          <h3>Statistik Pemakaian Listrik</h3>
        </div>
        <div class="kv"><span>Daya Saat Ini</span><strong id="toiletPowerNow">-</strong></div>
        <div class="kv"><span>Energi Hari Ini</span><strong id="toiletEnergyToday">-</strong></div>
        <div class="kv"><span>Rata-rata Mingguan</span><strong id="toiletEnergyAvg">-</strong></div>
        <div class="service-watermark" aria-hidden="true">
          <svg viewBox="0 0 64 64" class="service-svg">
            <!-- Ikon listrik: meter dan petir -->
            <rect x="12" y="12" width="40" height="28" rx="4"></rect>
            <path d="M32 16 L24 32 L34 32 L28 44" />
            <line x1="32" y1="28" x2="40" y2="24"></line>
            <circle cx="24" cy="44" r="2"></circle>
            <circle cx="40" cy="44" r="2"></circle>
          </svg>
        </div>
      `;
    } else if (key === 'server') {
      card.innerHTML = `
        <div class="service-header"><h3>${name}</h3></div>
        <div class="kv"><span>Okupansi</span><strong data-field="occupancy">-</strong></div>
        <div class="kv"><span>Cahaya</span><strong data-field="light">- lx</strong></div>
        <div class="kv"><span>Suhu</span><strong data-field="temp">- °C</strong></div>
        <div class="kv"><span>Kelembaban</span><strong data-field="humidity">- %</strong></div>
        <div class="kv"><span>Daya</span><strong data-field="power">- W</strong></div>
        <div class="actions" data-room="${key}"></div>
        <div class="service-watermark" aria-hidden="true">
          <svg viewBox="0 0 64 64" class="service-svg">
            <!-- Ikon server: rak bertumpuk -->
            <rect x="12" y="12" width="40" height="10" rx="2"></rect>
            <rect x="12" y="26" width="40" height="10" rx="2"></rect>
            <rect x="12" y="40" width="40" height="10" rx="2"></rect>
            <circle cx="18" cy="17" r="1.5"></circle>
            <circle cx="24" cy="17" r="1.5"></circle>
            <circle cx="30" cy="17" r="1.5"></circle>
            <circle cx="18" cy="31" r="1.5"></circle>
            <circle cx="24" cy="31" r="1.5"></circle>
            <circle cx="30" cy="31" r="1.5"></circle>
            <circle cx="18" cy="45" r="1.5"></circle>
            <circle cx="24" cy="45" r="1.5"></circle>
            <circle cx="30" cy="45" r="1.5"></circle>
          </svg>
        </div>
      `;
    } else if (key === 'tandon') {
      card.innerHTML = `
        <div class="service-header"><h3>Tandon Air</h3></div>
        <div class="tank">
          <div id="tandonWater" class="water"></div>
        </div>
        <div class="kv"><span>Persentase</span><strong id="tandonPercent">-</strong></div>
        <div class="kv"><span>Status</span><strong><span id="tandonIndicator" class="indicator off"></span><span id="tandonStatus">-</span></strong></div>
        <div class="actions" data-room="${key}"></div>
      `;
    } else {
      card.innerHTML = `
        <h3>${name}</h3>
        <div class="kv"><span>Okupansi</span><strong data-field="occupancy">-</strong></div>
        <div class="kv"><span>Cahaya</span><strong data-field="light">- lx</strong></div>
        <div class="kv"><span>Suhu</span><strong data-field="temp">- °C</strong></div>
        <div class="kv"><span>Kelembaban</span><strong data-field="humidity">- %</strong></div>
        <div class="kv"><span>Daya</span><strong data-field="power">- W</strong></div>
        <div class="actions" data-room="${key}"></div>
      `;
    }
  roomsGrid.appendChild(card);
  roomCards.set(key, card);
  });

  // Ambil elemen setelah card dirender
  pelayananIndicator = document.getElementById('pelayananIndicator');
  pelayananArrivalStatus = document.getElementById('pelayananArrivalStatus');
  pelayananLastArrival = document.getElementById('pelayananLastArrival');
  pelayananArrivalLog = document.getElementById('pelayananArrivalLog');

  // Ambil elemen untuk Ruang Rapat
  rapatIndicator = document.getElementById('rapatIndicator');
  rapatArrivalStatus = document.getElementById('rapatArrivalStatus');
  rapatLastArrival = document.getElementById('rapatLastArrival');
  rapatArrivalLog = document.getElementById('rapatArrivalLog');

  // Ambil elemen untuk Statistik Listrik
  toiletPowerNow = document.getElementById('toiletPowerNow');
  toiletEnergyToday = document.getElementById('toiletEnergyToday');
  toiletEnergyAvg = document.getElementById('toiletEnergyAvg');

  // Ambil elemen untuk Tandon Air
  tandonPercentEl = document.getElementById('tandonPercent');
  tandonStatusEl = document.getElementById('tandonStatus');
  tandonIndicatorEl = document.getElementById('tandonIndicator');
  tandonWaterEl = document.getElementById('tandonWater');

  // Add device buttons per room
  APP_CONFIG.devices.forEach(d => {
    const roomCard = roomCards.get(d.room);
    if (!roomCard) return;
    if (d.room === 'pelayanan' || d.room === 'aula' || d.room === 'toilet') return; // Tidak ada tombol di card layanan, rapat, dan statistik listrik
    const actions = roomCard.querySelector('.actions');
    if (!actions) return;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.dataset.deviceKey = d.key;
    btn.dataset.action = 'toggle';
    btn.textContent = `${d.name}: OFF`;
    actions.appendChild(btn);
  });

  // Energy charts: Monthly KWh (last 6 months) and realtime per hour
  function lastSixMonthLabels() {
    const labels = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(dt.toLocaleString('id-ID', { month: 'short' }));
    }
    return labels;
  }

  // Dummy simulator values for monthly KWh when backend not providing them
  let monthlyKwhSim = null;
  function generateDummyMonthlyKwh() {
    const base = 120 + Math.random()*40; // base kWh
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const drift = (i-3) * (Math.random()*4 - 2); // small trend
      const noise = (Math.random()*20 - 10); // +/-10
      arr.push(Math.max(60, Math.round((base + drift + noise) * 10) / 10));
    }
    return arr;
  }

  const monthlyChart = new Chart(document.getElementById('monthlyKwhChart'), {
    type: 'bar',
    data: {
      labels: lastSixMonthLabels(),
      datasets: [{
        label: 'KWh',
        data: [0,0,0,0,0,0],
        backgroundColor: '#2563EB',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { ticks: { color: '#475569' } },
        y: { grid: { color: 'rgba(2,6,23,0.08)' }, ticks: { color: '#475569' } }
      }
    }
  });

  const sixHourLabels = ['00–06','06–12','12–18','18–24'];
  const realtimeChart = new Chart(document.getElementById('realtimeEnergyChart'), {
    type: 'line',
    data: {
      labels: sixHourLabels,
      datasets: [
        { label: 'Voltase (V)', data: [null,null,null,null], borderColor: '#8B5CF6', borderWidth: 2, tension: 0.25, pointRadius: 0, fill: false },
        { label: 'Daya (W)', data: [null,null,null,null], borderColor: '#22C55E', borderWidth: 2, tension: 0.25, pointRadius: 0, fill: false },
        { label: 'Rata-rata Daya (W)', data: [null,null,null,null], borderColor: '#F59E0B', borderDash: [6,4], borderWidth: 2, tension: 0.25, pointRadius: 0, fill: false }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true, position: 'bottom', labels: { color: '#475569' } } },
      scales: {
        x: { display: true, ticks: { color: '#475569' } },
        y: { grid: { color: 'rgba(2,6,23,0.08)' }, ticks: { color: '#475569' } }
      }
    }
  });
  const bucketSumVoltage = [0,0,0,0];
  const bucketSumWatt = [0,0,0,0];
  const bucketCount = [0,0,0,0];
  const bucketLastWatt = [null,null,null,null];

  // Seed dummy values for 4 buckets when simulation is ON so chart shows lines immediately
  function seedRealtimeBuckets() {
    if (!APP_CONFIG.simulate) return;
    for (let i = 0; i < 4; i++) {
      const volt = 220 + Math.random()*15; // ~220–235 V
      const watt = 120 + Math.random()*180; // ~120–300 W
      bucketSumVoltage[i] = volt * 3; // pretend 3 samples
      bucketSumWatt[i] = watt * 3;
      bucketCount[i] = 3;
      bucketLastWatt[i] = +(watt.toFixed(2));
      const avgVolt = +(bucketSumVoltage[i] / bucketCount[i]).toFixed(2);
      const avgWatt = +(bucketSumWatt[i] / bucketCount[i]).toFixed(2);
      realtimeChart.data.datasets[0].data[i] = avgVolt;
      realtimeChart.data.datasets[1].data[i] = bucketLastWatt[i];
      realtimeChart.data.datasets[2].data[i] = avgWatt;
    }
    realtimeChart.update();
  }
  seedRealtimeBuckets();

  // Actions: device toggle
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'queueNext') {
      queueNumber.textContent = (parseInt(queueNumber.textContent, 10) || 0) + 1;
      return;
    }
    // tidak ada autoQueueToggle di card layanan
    if (btn.classList.contains('feedback')) {
      const score = +btn.dataset.score;
      const prev = parseFloat(feedbackScore.textContent) || 0;
      feedbackScore.textContent = ((prev + score) / 2).toFixed(2);
      return;
    }
    const deviceKey = btn.dataset.deviceKey;
    const action = btn.dataset.action;
    if (action === 'toggle') {
      const next = btn.textContent.includes(': OFF') ? 1 : 0;
      btn.disabled = true;
      await fetch('api/control.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_key: deviceKey, desired_state: next })
      }).catch(()=>{});
      btn.textContent = btn.textContent.replace(/: (ON|OFF)/, `: ${next ? 'ON' : 'OFF'}`);
      btn.disabled = false;
    }
  });

  // Set initial simulate button state
  simulateToggle.textContent = `Simulasi: ${APP_CONFIG.simulate ? 'ON' : 'OFF'}`;
  // Simulate toggle
  simulateToggle.addEventListener('click', () => {
    APP_CONFIG.simulate = !APP_CONFIG.simulate;
    simulateToggle.textContent = `Simulasi: ${APP_CONFIG.simulate ? 'ON' : 'OFF'}`;
    window.Simulator && window.Simulator.setEnabled(APP_CONFIG.simulate);
  });

  // Poll metrics
  async function refreshMetrics() {
    try {
      const res = await fetch('api/metrics.php');
      const data = await res.json();
      connectionStatus.textContent = 'Connected';
      connectionStatus.style.background = '#0b5';

      // Update rooms
      Object.entries(data.latestByRoom || {}).forEach(([roomKey, fields]) => {
        const card = roomCards.get(roomKey);
        if (!card) return;
        ['occupancy','light','temp','humidity','power'].forEach(k => {
          const el = card.querySelector(`[data-field="${k}"]`);
          if (!el) return;
          const v = fields[k];
          if (v === undefined || v === null) return;
          el.textContent = k === 'light' ? `${v} lx` : k === 'humidity' ? `${v} %` : k === 'temp' ? `${v} °C` : k === 'power' ? `${v} W` : `${v}`;
        });
      });

      // Agregasi lingkungan: suhu, kelembaban, cahaya
      {
        const thresholds = {
          tempHot: (window.APP_CONFIG && APP_CONFIG.thresholds && APP_CONFIG.thresholds.tempHot) || 30,
          lightLow: (window.APP_CONFIG && APP_CONFIG.thresholds && APP_CONFIG.thresholds.lightLow) || 100,
        };
        const latestByRoom = data.latestByRoom || {};
        let tempSum = 0, tempCount = 0;
        let humSum = 0, humCount = 0;
        let lightSum = 0, lightCount = 0;
        let hotRooms = 0, lowLightRooms = 0;
        Object.values(latestByRoom).forEach(r => {
          const t = typeof r.temp === 'number' ? r.temp : null;
          const h = typeof r.humidity === 'number' ? r.humidity : null;
          const l = typeof r.light === 'number' ? r.light : null;
          if (t !== null) { tempSum += t; tempCount += 1; if (t > thresholds.tempHot) hotRooms += 1; }
          if (h !== null) { humSum += h; humCount += 1; }
          if (l !== null) { lightSum += l; lightCount += 1; if (l < thresholds.lightLow) lowLightRooms += 1; }
        });
        if (envAvgTempEl) envAvgTempEl.textContent = tempCount ? `${(tempSum / tempCount).toFixed(1)} °C` : '- °C';
        if (envAvgHumidityEl) envAvgHumidityEl.textContent = humCount ? `${Math.round(humSum / humCount)} %` : '- %';
        if (envAvgLightEl) envAvgLightEl.textContent = lightCount ? `${Math.round(lightSum / lightCount)} lx` : '- lx';
        if (envHotRoomsCountEl) envHotRoomsCountEl.textContent = String(hotRooms);
        if (envLowLightCountEl) envLowLightCountEl.textContent = String(lowLightRooms);
        // Status cuaca & terang/gelap (LDR)
        const avgLight = lightCount ? (lightSum / lightCount) : null;
        const avgHum = humCount ? (humSum / humCount) : null;
        const isDark = (lowLightRooms > 0) || (avgLight != null && avgLight < thresholds.lightLow);
        if (lightStatusEl) lightStatusEl.textContent = isDark ? 'Gelap (LDR)' : 'Terang (LDR)';
        let isRaining = (typeof data.assets?.rain === 'boolean') ? !!data.assets.rain : null;
        if (isRaining == null && window.APP_CONFIG && APP_CONFIG.simulate) {
          // Heuristik simulasi: kelembaban tinggi dan gelap => hujan
          isRaining = (avgHum != null ? avgHum > 75 : false) && isDark;
        }
        if (weatherStatusEl) weatherStatusEl.textContent = isRaining ? 'Hujan' : 'Cerah';
        if (weatherCardEl) {
          weatherCardEl.classList.toggle('weather-rain', !!isRaining);
          weatherCardEl.classList.toggle('weather-clear', !isRaining);
        }
        if (envLastUpdateEl) {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          envLastUpdateEl.textContent = `${hh}:${mm}`;
        }
      }

      // Pelayanan PIR arrival detection (rising edge)
      const pelayanan = data.latestByRoom?.['pelayanan'];
      const occ = typeof pelayanan?.occupancy === 'number' ? pelayanan.occupancy : lastPelayananOcc;
      if (pelayananArrivalStatus) {
        pelayananArrivalStatus.textContent = occ ? 'Ada tamu' : 'Tidak ada';
      }
      if (pelayananIndicator) {
        pelayananIndicator.classList.toggle('on', !!occ);
        pelayananIndicator.classList.toggle('off', !occ);
      }
      if (occ === 1 && lastPelayananOcc === 0) {
        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (pelayananLastArrival) pelayananLastArrival.textContent = ts;
        // simpan maksimal 4 baris log kedatangan terbaru
        pelayananArrivalEvents.unshift(ts);
        if (pelayananArrivalEvents.length > 4) pelayananArrivalEvents.pop();
        if (pelayananArrivalLog) {
          pelayananArrivalLog.innerHTML = pelayananArrivalEvents.map(t => `<li>${t}</li>`).join('');
        }
        arrivalCountTotal += 1;
        if (arrivalCountEl) arrivalCountEl.textContent = `${arrivalCountTotal}`;
      }
      lastPelayananOcc = occ;

      // Rapat PIR arrival detection (aula)
      const rapat = data.latestByRoom?.['aula'];
      const occRapat = typeof rapat?.occupancy === 'number' ? rapat.occupancy : lastRapatOcc;
      if (rapatArrivalStatus) {
        rapatArrivalStatus.textContent = occRapat ? 'Ada tamu' : 'Tidak ada';
      }
      if (rapatIndicator) {
        rapatIndicator.classList.toggle('on', !!occRapat);
        rapatIndicator.classList.toggle('off', !occRapat);
      }
      if (occRapat === 1 && lastRapatOcc === 0) {
        const tsR = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (rapatLastArrival) rapatLastArrival.textContent = tsR;
        rapatArrivalEvents.unshift(tsR);
        if (rapatArrivalEvents.length > 4) rapatArrivalEvents.pop();
        if (rapatArrivalLog) {
          rapatArrivalLog.innerHTML = rapatArrivalEvents.map(t => `<li>${t}</li>`).join('');
        }
        arrivalCountTotal += 1;
        if (arrivalCountEl) arrivalCountEl.textContent = `${arrivalCountTotal}`;
      }
      lastRapatOcc = occRapat;

      // Statistik Listrik (toilet)
      const toiletLatest = data.latestByRoom?.['toilet'];
      const powerW = typeof toiletLatest?.power === 'number' ? toiletLatest.power : null;
      if (toiletPowerNow) toiletPowerNow.textContent = powerW != null ? `${powerW} W` : '-';
      const nowMs = Date.now();
      if (lastToiletTs != null) {
        const dtHours = (nowMs - lastToiletTs) / 3600000;
        toiletEnergyAccKWh += ((powerW || 0) * dtHours) / 1000;
      }
      lastToiletTs = nowMs;
      if (toiletEnergyToday) toiletEnergyToday.textContent = `${toiletEnergyAccKWh.toFixed(3)} kWh`;
      if (toiletEnergyAvg) toiletEnergyAvg.textContent = '-';

      // Tandon Air: isi persen dan status
      const levelPctRaw = data.assets?.waterLevel;
      const levelPct = Math.max(0, Math.min(100, Number(levelPctRaw ?? 0)));
      if (tandonPercentEl) tandonPercentEl.textContent = `${levelPct} %`;
      if (tandonWaterEl) tandonWaterEl.style.height = `${levelPct}%`;
      const minPct = APP_CONFIG.thresholds?.tandonMinPercent ?? 25;
      const ok = levelPct >= minPct;
      if (tandonStatusEl) tandonStatusEl.textContent = ok ? 'Cukup' : 'Rendah';
      if (tandonIndicatorEl) {
        tandonIndicatorEl.classList.toggle('on', ok);
        tandonIndicatorEl.classList.toggle('off', !ok);
      }

      // Update totals
      stats.totalPower.textContent = `${data.totals?.totalPower ?? 0} W`;
      stats.avgTemp.textContent = `${data.totals?.avgTemp?.toFixed?.(2) ?? '-'} °C`;
      stats.activeOccupancy.textContent = `${data.totals?.activeOccupancy ?? 0} ruang`;

      // Update PIR status (aktif hanya malam 23:00–06:00)
      {
        const h = new Date().getHours();
        const active = (h >= 23 || h < 6);
        if (pir.status) pir.status.textContent = active ? 'Aktif (23:00–06:00)' : 'Nonaktif';
        // Jika backend menyediakan data keamanan
        const sec = data.security || {};
        if (pir.last && sec.pirLast) pir.last.textContent = sec.pirLast;
        if (pir.countTonight) pir.countTonight.textContent = `${typeof sec.pirCountTonight === 'number' ? sec.pirCountTonight : 0}`;

        // Deteksi malam: jika ada okupansi aktif saat sensor aktif, anggap kejadian mencurigakan
        const suspicious = active && ((data.totals?.activeOccupancy ?? 0) > 0);
        if (pirIndicator) {
          pirIndicator.classList.toggle('on', suspicious);
          pirIndicator.classList.toggle('off', !suspicious);
        }
        if (pirCard) {
          pirCard.classList.toggle('alert', suspicious);
        }
        if (suspicious) {
          const nowMs = Date.now();
          if (nowMs - lastPirEventAtMs > pirDebounceMs) {
            const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (pir.last) pir.last.textContent = ts;
            const current = Number((pir.countTonight?.textContent || '0')) || 0;
            const next = current + 1;
            if (pir.countTonight) pir.countTonight.textContent = `${next}`;
            pirEvents.unshift(ts);
            if (pirEvents.length > 5) pirEvents.pop();
            if (pirLog) pirLog.innerHTML = pirEvents.map(t => `<li>${t}</li>`).join('');
            lastPirEventAtMs = nowMs;
          }
        }
        lastPirOcc = suspicious ? 1 : 0;
      }

      // Update assets
      assets.waterLevel.textContent = `${data.assets?.waterLevel ?? '-'} %`;
      assets.waterFlow.textContent = `${data.assets?.waterFlow ?? '-'} L/min`;
      assets.streetLightStatus.textContent = data.assets?.streetLightOn ? 'ON' : 'OFF';

      // Update Monthly KWh chart if available (expects 6 values)
      const monthlyKwh = data.totals?.monthlyKwh || data.stats?.monthlyKwh;
      if (Array.isArray(monthlyKwh) && monthlyKwh.length >= 6) {
        monthlyChart.data.labels = lastSixMonthLabels();
        monthlyChart.data.datasets[0].data = monthlyKwh.slice(-6);
        monthlyChart.update();
      } else if (APP_CONFIG.simulate) {
        if (!monthlyKwhSim) monthlyKwhSim = generateDummyMonthlyKwh();
        monthlyChart.data.labels = lastSixMonthLabels();
        monthlyChart.data.datasets[0].data = monthlyKwhSim;
        monthlyChart.update();
      }

      // Realtime chart: aggregate per 6-hour bucket (00–06, 06–12, 12–18, 18–24)
      const hour = new Date().getHours();
      const idx = Math.floor(hour / 6); // 0..3
      let voltage = data.assets?.gridVoltage ?? data.totals?.gridVoltage ?? null;
      let watt = data.totals?.totalPower ?? null;
      // Fallback simulasi bila backend belum menyediakan nilai
      if (APP_CONFIG.simulate) {
        if (typeof voltage !== 'number') voltage = 220 + Math.random()*15; // ~220–235 V
        if (typeof watt !== 'number') watt = 120 + Math.random()*180; // ~120–300 W
      }

      if (typeof voltage === 'number') {
        bucketSumVoltage[idx] += voltage;
        bucketCount[idx] += 1;
      }
      if (typeof watt === 'number') {
        bucketSumWatt[idx] += watt;
        bucketCount[idx] += 1;
        bucketLastWatt[idx] = watt;
      }
      const avgVolt = bucketCount[idx] ? +(bucketSumVoltage[idx] / bucketCount[idx]).toFixed(2) : null;
      const avgWattBucket = bucketCount[idx] ? +(bucketSumWatt[idx] / bucketCount[idx]).toFixed(2) : null;

      realtimeChart.data.datasets[0].data[idx] = avgVolt;
      realtimeChart.data.datasets[1].data[idx] = bucketLastWatt[idx];
      realtimeChart.data.datasets[2].data[idx] = avgWattBucket;
      realtimeChart.update();
    } catch (e) {
      connectionStatus.textContent = 'Disconnected';
      connectionStatus.style.background = '#c0392b';
    }
  }

  refreshMetrics();
  setInterval(refreshMetrics, APP_CONFIG.pollIntervalMs);
})();
