var os = require('os');

var logs = [];
function addLog(str) {
    logs.push(str)
}

var systemInfo = {
    platform: os.platform(),
    type: os.type(),
    arch: os.arch(),
    release: os.release(),
    version: os.version ? os.version() : 'Unknown',
    hostname: os.hostname(),
    homedir: os.homedir(),
    tmpdir: os.tmpdir(),
    endianness: os.endianness(),
};

addLog('💻 SYSTEM:');
addLog(`   Platform: ${systemInfo.platform}`);
addLog(`   Type: ${systemInfo.type}`);
addLog(`   Architecture: ${systemInfo.arch}`);
addLog(`   Release: ${systemInfo.release}`);
addLog(`   Hostname: ${systemInfo.hostname}`);


var cpus = os.cpus();
var loadAvg = os.loadavg();

var cpuInfo = {
    model: cpus[0].model,
    speed: cpus[0].speed,
    cores: cpus.length,
    loadAverage: loadAvg,
    cpuDetails: cpus
};

addLog('');
addLog('🔧 CPU:');
addLog(`   Model: ${cpuInfo.model}`);
addLog(`   Speed: ${cpuInfo.speed} MHz`);
addLog(`   Cores: ${cpuInfo.cores}${cpuInfo.physicalCores ? ` (${cpuInfo.physicalCores} physical)` : ''}`);
addLog(`   Load Average: ${loadAvg.map(load => load.toFixed(2)).join(', ')}`);


var totalMem = os.totalmem();
var freeMem = os.freemem();
var usedMem = totalMem - freeMem;

var memoryInfo = {
    total: totalMem,
    free: freeMem,
    used: usedMem,
    usagePercent: (usedMem / totalMem) * 100
};

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes) return 'Unknown';

    var k = 1024;
    var dm = decimals < 0 ? 0 : decimals;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

addLog('');
addLog('💾 MEMORY:');
addLog(`   Total: ${formatBytes(memoryInfo.total)}`);
addLog(`   Used: ${formatBytes(memoryInfo.used)} (${memoryInfo.usagePercent.toFixed(1)}%)`);
addLog(`   Free: ${formatBytes(memoryInfo.free)}`);


console.log(logs.join('\n'));