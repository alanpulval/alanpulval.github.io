import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { readFileSync as readText, writeFileSync as writeText, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Usage: node brain/encrypt.mjs <private-assumptions.json> <public-index.html> <private-password.txt> [more-private-sources.json ...]
const [, , sourceArg, outputArg, passwordArg, ...extraSources] = process.argv;
if (!sourceArg || !outputArg || !passwordArg) throw new Error('Usage: node brain/encrypt.mjs <private-assumptions.json> <public-index.html> <private-password.txt> [more-private-sources.json ...]');
const source = resolve(sourceArg), output = resolve(outputArg), passwordFile = resolve(passwordArg);
const data = JSON.parse(readText(source, 'utf8'));
if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('Expected nodes and edges arrays');
for (const sourcePath of extraSources) {
  const extra = JSON.parse(readText(resolve(sourcePath), 'utf8'));
  if (!Array.isArray(extra.nodes) || !Array.isArray(extra.edges)) throw new Error('Expected nodes and edges arrays in ' + sourcePath);
  data.nodes.push(...extra.nodes);
  data.edges.push(...extra.edges);
}
mkdirSync(dirname(passwordFile), { recursive: true });
if (!existsSync(passwordFile)) writeText(passwordFile, randomBytes(24).toString('base64url'), { encoding: 'utf8', mode: 0o600 });
const password = readText(passwordFile, 'utf8').trimEnd();
if (password.length < 24) throw new Error('Password must have at least 24 characters');
const salt = randomBytes(16), iv = randomBytes(12), iterations = 310000;
const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final(), cipher.getAuthTag()]);
const payload = { version: 1, kdf: 'PBKDF2-SHA256', cipher: 'AES-256-GCM', iterations, salt: salt.toString('base64'), iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64') };
const html = readText(output, 'utf8');
const block = /<!-- ENCRYPTED_ATLAS_START -->[\s\S]*?<!-- ENCRYPTED_ATLAS_END -->/;
if (!block.test(html)) throw new Error('Missing encrypted-atlas markers in the HTML file');
const script = `<script id="encrypted-atlas" type="application/json">${JSON.stringify(payload)}</script>`;
writeText(output, html.replace(block, `<!-- ENCRYPTED_ATLAS_START -->\n  ${script}\n  <!-- ENCRYPTED_ATLAS_END -->`));
console.log(`Encrypted ${data.nodes.length} nodes and ${data.edges.length} edges into ${output}`);
