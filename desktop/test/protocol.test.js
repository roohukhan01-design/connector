'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const WebSocket = require('ws');

process.env.ROOHU_PORT = String(49000 + Math.floor(Math.random() * 1000));
process.env.ROOHU_HOST = '127.0.0.1';
const { Hub } = require('../server');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'roohu-connect-test-'));
const hub = new Hub(tempDir);
const url = 'wss://127.0.0.1:' + process.env.ROOHU_PORT + '/ws';
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest('hex');

function check(name, condition, detail) {
  if (!condition) throw new Error('FAIL ' + name + (detail ? ': ' + JSON.stringify(detail) : ''));
  console.log('PASS ' + name);
}

function connect(makeMessage) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { rejectUnauthorized: false });
    const messages = [];
    const timer = setTimeout(() => ws.terminate(), 2500);
    ws.on('message', raw => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch (e) { clearTimeout(timer); reject(e); return; }
      messages.push(msg);
      if (msg.t === 'hello') {
        try { ws.send(JSON.stringify(makeMessage(msg))); }
        catch (e) { clearTimeout(timer); reject(e); }
      } else if (msg.t === 'paired' || msg.t === 'ok' || msg.t === 'error') {
        ws.close();
      }
    });
    ws.on('error', e => { clearTimeout(timer); reject(e); });
    ws.on('close', () => { clearTimeout(timer); resolve(messages); });
  });
}

async function run() {
  hub.start();
  await new Promise((resolve, reject) => {
    hub.server.once('listening', resolve);
    hub.server.once('error', reject);
  });

  let out = await connect(m => ({ t: 'pair', id: 'p1', name: 'Phone', proof: 'invalid' }));
  check('pairing without active code is rejected', out.some(m => m.t === 'error'));

  let pairing = hub.newPairing();
  out = await connect(m => ({
    t: 'pair', id: 'p1', name: 'Phone',
    proof: hmac(pairing.pin === '000000' ? '111111' : '000000', m.nonce + hub.fp)
  }));
  check('wrong pairing code is rejected', out.some(m => m.t === 'error' && /Wrong/.test(m.msg)));

  out = await connect(m => ({ t: 'pair', id: 'p1', name: 'Phone', proof: hmac(pairing.pin, m.nonce + hub.fp) }));
  const paired = out.find(m => m.t === 'paired');
  check('correct pairing code creates a trusted device', !!paired, out);

  out = await connect(m => ({ t: 'pair', id: 'p2', name: 'Other', proof: hmac(pairing.pin, m.nonce + hub.fp) }));
  check('pairing code can only be used once', out.some(m => m.t === 'error'));

  out = await connect(m => ({ t: 'auth', id: 'p1', token: paired.token }));
  check('saved token reconnects', out.some(m => m.t === 'ok'));

  out = await connect(m => ({ t: 'auth', id: 'p1', token: 'bad-token' }));
  check('bad token is rejected', out.some(m => m.t === 'error'));

  out = await connect(m => ({ t: 'auth', id: 'unknown', token: paired.token }));
  check('unknown device is rejected', out.some(m => m.t === 'error'));

  hub.forget('p1');
  out = await connect(m => ({ t: 'auth', id: 'p1', token: paired.token }));
  check('forgotten device cannot reconnect', out.some(m => m.t === 'error'));

  pairing = hub.newPairing();
  for (let i = 0; i < 5; i++) {
    await connect(m => ({
      t: 'pair', id: 'p3', name: 'Phone',
      proof: hmac(pairing.pin === '999999' ? '888888' : '999999', m.nonce + hub.fp)
    }));
  }
  out = await connect(m => ({ t: 'pair', id: 'p3', name: 'Phone', proof: hmac(pairing.pin, m.nonce + hub.fp) }));
  check('pairing code expires after five wrong attempts', !out.some(m => m.t === 'paired'));

  const saved = JSON.parse(fs.readFileSync(path.join(tempDir, 'trusted.json'), 'utf8'));
  check('PC stores only a hash of the phone token', !JSON.stringify(saved).includes(paired.token));
}

run().catch(err => {
  console.error(err);
  process.exitCode = 1;
}).finally(() => {
  hub.stop();
  fs.rmSync(tempDir, { recursive: true, force: true });
});
