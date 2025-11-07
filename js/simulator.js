(() => {
  let enabled = !!APP_CONFIG.simulate;
  const setEnabled = (v) => { enabled = !!v; };
  async function pushRoom(roomKey) {
    const occ = Math.random() < 0.5 ? 1 : 0;
    const light = Math.round(occ ? 250 + Math.random()*100 : Math.random()*150);
    const temp = Math.round((26 + Math.random()*8 + (roomKey === 'server' ? 3 : 0))*10)/10;
    const hum = Math.round(55 + Math.random()*20);
    const power = Math.round(occ ? 120 + Math.random()*180 : Math.random()*60);
    const body = {
      room_key: roomKey,
      readings: { occupancy: occ, light: light, temp: temp, humidity: hum, power: power },
      assets: roomKey === 'server' ? { smoke: Math.random()<0.02 } : undefined
    };
    try {
      await fetch('api/ingest.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch(e) {}
  }
  async function pushAssets() {
    const waterLevel = Math.round(40 + Math.random()*40); // percent
    const waterFlow = Math.round(Math.random()*10*10)/10; // L/min
    const gridVoltage = Math.round((220 + Math.random()*15)*10)/10; // ~220–235 V
    const body = { assets: { waterLevel, waterFlow, gridVoltage } };
    try { await fetch('api/ingest.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }); } catch(e) {}
  }
  setInterval(() => {
    if (!enabled) return;
    APP_CONFIG.rooms.forEach(r => pushRoom(r.key));
    pushAssets();
  }, APP_CONFIG.pollIntervalMs);
  window.Simulator = { setEnabled };
})();
