(() => {
  const roomsList = document.getElementById('roomsList');
  const devicesList = document.getElementById('devicesList');
  const saveRoomBtn = document.getElementById('saveRoom');
  const roomKeyInput = document.getElementById('roomKey');
  const roomNameInput = document.getElementById('roomName');
  const saveDeviceBtn = document.getElementById('saveDevice');
  const deviceKeyInput = document.getElementById('deviceKey');
  const deviceNameInput = document.getElementById('deviceName');
  const deviceRoomInput = document.getElementById('deviceRoom');
  const deviceTypeSelect = document.getElementById('deviceType');

  // Settings inputs
  const setSimulate = document.getElementById('setSimulate');
  const setSseEnabled = document.getElementById('setSseEnabled');
  const setPollInterval = document.getElementById('setPollInterval');
  const setLightLuxDim = document.getElementById('setLightLuxDim');
  const setAulaTempForFan = document.getElementById('setAulaTempForFan');
  const setAulaTempForAC = document.getElementById('setAulaTempForAC');
  const setServerTempMax = document.getElementById('setServerTempMax');
  const setTandonMinPercent = document.getElementById('setTandonMinPercent');
  const saveSettingsBtn = document.getElementById('saveSettings');

  function renderRooms(rooms) {
    roomsList.innerHTML = '';
    if (!rooms || rooms.length === 0) {
      roomsList.innerHTML = '<div class="hint">Belum ada ruangan.</div>';
      return;
    }
    rooms.forEach(r => {
      const div = document.createElement('div');
      div.className = 'kv';
      div.innerHTML = `<span>${r.key}</span><strong>${r.name} <button class="btn" data-action="del-room" data-key="${r.key}">Hapus</button></strong>`;
      roomsList.appendChild(div);
    });
  }

  function renderDevices(devs) {
    devicesList.innerHTML = '';
    if (!devs || devs.length === 0) {
      devicesList.innerHTML = '<div class="hint">Belum ada device.</div>';
      return;
    }
    devs.forEach(d => {
      const div = document.createElement('div');
      div.className = 'kv';
      const desired = d.desired_state ? 'ON' : 'OFF';
      const current = d.current_state ? 'ON' : 'OFF';
      div.innerHTML = `<span>${d.key}</span><strong>${d.name} — ${d.type} @ ${d.room_key} | desired: ${desired}, current: ${current} 
        <button class="btn" data-action="toggle" data-device="${d.key}" data-next="${d.desired_state ? 0 : 1}">Toggle</button>
        <button class="btn" data-action="edit-device" data-key="${d.key}" data-name="${d.name}" data-room="${d.room_key}" data-type="${d.type}">Edit</button>
        <button class="btn" data-action="del-device" data-key="${d.key}">Hapus</button>
      </strong>`;
      devicesList.appendChild(div);
    });
  }

  async function loadRooms() {
    const res = await fetch('api/admin_rooms.php');
    const json = await res.json();
    if (json.ok) renderRooms(json.rooms);
  }

  async function loadDevices() {
    const res = await fetch('api/admin_devices.php');
    const json = await res.json();
    if (json.ok) renderDevices(json.devices);
  }

  async function saveRoom() {
    const key = roomKeyInput.value.trim();
    const name = roomNameInput.value.trim();
    if (!key || !name) return;
    await fetch('api/admin_rooms.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, name })
    });
    roomKeyInput.value = '';
    roomNameInput.value = '';
    await loadRooms();
  }

  async function saveDevice() {
    const key = deviceKeyInput.value.trim();
    const name = deviceNameInput.value.trim();
    const room_key = deviceRoomInput.value.trim();
    const type = deviceTypeSelect.value;
    if (!key || !name || !room_key || !type) return;
    await fetch('api/admin_devices.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, name, room_key, type })
    });
    deviceKeyInput.value = '';
    deviceNameInput.value = '';
    deviceRoomInput.value = '';
    deviceTypeSelect.value = 'other';
    await loadDevices();
  }

  async function deleteRoom(key) {
    await fetch('api/admin_rooms.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    await loadRooms();
  }

  async function deleteDevice(key) {
    await fetch('api/admin_devices.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    await loadDevices();
  }

  async function toggleDevice(device_key, nextState) {
    await fetch('api/control.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_key, desired_state: nextState })
    });
    await loadDevices();
  }

  // Wire buttons
  if (saveRoomBtn) saveRoomBtn.addEventListener('click', saveRoom);
  if (saveDeviceBtn) saveDeviceBtn.addEventListener('click', saveDevice);

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const action = t.getAttribute('data-action');
    if (action === 'del-room') {
      const key = t.getAttribute('data-key');
      deleteRoom(key);
    } else if (action === 'del-device') {
      const key = t.getAttribute('data-key');
      deleteDevice(key);
    } else if (action === 'edit-device') {
      const key = t.getAttribute('data-key');
      const name = t.getAttribute('data-name');
      const room = t.getAttribute('data-room');
      const type = t.getAttribute('data-type');
      deviceKeyInput.value = key;
      deviceNameInput.value = name;
      deviceRoomInput.value = room;
      deviceTypeSelect.value = type || 'other';
    } else if (action === 'toggle') {
      const deviceKey = t.getAttribute('data-device');
      const next = parseInt(t.getAttribute('data-next') || '0', 10);
      toggleDevice(deviceKey, next);
    }
  });

  // Load and show settings
  async function loadSettings() {
    let defaults = window.APP_CONFIG || {};
    const res = await fetch('api/admin_settings.php');
    const json = await res.json();
    const s = json.ok ? json.settings : {};
    // resolve values (fallback to defaults)
    const simulate = (s.simulate !== undefined) ? s.simulate : defaults.simulate;
    const sseEnabled = (s.sseEnabled !== undefined) ? s.sseEnabled : defaults.sseEnabled;
    const pollIntervalMs = (s.pollIntervalMs !== undefined) ? s.pollIntervalMs : defaults.pollIntervalMs;
    const th = s.thresholds || {};
    const dth = defaults.thresholds || {};
    setSimulate.value = String(!!simulate);
    setSseEnabled.value = String(!!sseEnabled);
    setPollInterval.value = pollIntervalMs ?? '';
    setLightLuxDim.value = th.lightLuxDim ?? dth.lightLuxDim ?? '';
    setAulaTempForFan.value = th.aulaTempForFan ?? dth.aulaTempForFan ?? '';
    setAulaTempForAC.value = th.aulaTempForAC ?? dth.aulaTempForAC ?? '';
    setServerTempMax.value = th.serverTempMax ?? dth.serverTempMax ?? '';
    setTandonMinPercent.value = th.tandonMinPercent ?? dth.tandonMinPercent ?? '';
  }

  async function saveSettings() {
    const payload = {
      settings: {
        simulate: setSimulate.value === 'true',
        sseEnabled: setSseEnabled.value === 'true',
        pollIntervalMs: parseInt(setPollInterval.value || '0', 10) || 0,
        thresholds: {
          lightLuxDim: parseInt(setLightLuxDim.value || '0', 10) || 0,
          aulaTempForFan: parseInt(setAulaTempForFan.value || '0', 10) || 0,
          aulaTempForAC: parseInt(setAulaTempForAC.value || '0', 10) || 0,
          serverTempMax: parseInt(setServerTempMax.value || '0', 10) || 0,
          tandonMinPercent: parseInt(setTandonMinPercent.value || '0', 10) || 0,
        }
      }
    };
    await fetch('api/admin_settings.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await loadSettings();
    alert('Pengaturan disimpan.');
  }

  // Initial load
  loadRooms();
  loadDevices();
  loadSettings();
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
})();
