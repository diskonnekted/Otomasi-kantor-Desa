window.APP_CONFIG = {
  simulate: false,
  sseEnabled: false,
  pollIntervalMs: 30000,
  rooms: [
    { key: 'pelayanan', name: 'Ruang Pelayanan' },
    { key: 'aula', name: 'Ruang Rapat' },
    { key: 'toilet', name: 'Statistik Pemakaian Listrik' },
    { key: 'server', name: 'Ruang Server' },
    { key: 'tandon', name: 'Tandon Air' }
  ],
  devices: [
    { key: 'pelayanan_light', name: 'Lampu Pelayanan', type: 'light', room: 'pelayanan' },
    { key: 'aula_light', name: 'Lampu Aula', type: 'light', room: 'aula' },
    { key: 'toilet_light', name: 'Lampu Toilet', type: 'light', room: 'toilet' },
    { key: 'aula_fan', name: 'Kipas Aula', type: 'fan', room: 'aula' },
    { key: 'aula_ac', name: 'AC Aula', type: 'ac', room: 'aula' },
    { key: 'server_fan', name: 'Kipas Server', type: 'fan', room: 'server' },
    { key: 'pamsimas_pump', name: 'Pompa Tandon', type: 'pump', room: 'tandon' },
    { key: 'street_main', name: 'Lampu Jalan', type: 'street', room: 'jalan' }
  ],
  thresholds: {
    lightLuxDim: 100,
    aulaTempForFan: 29,
    aulaTempForAC: 31,
    serverTempMax: 34,
    tandonMinPercent: 25
  }
};
