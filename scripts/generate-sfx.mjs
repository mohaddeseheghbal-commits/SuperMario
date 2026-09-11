#!/usr/bin/env node
// Generates the game's sound effect files via the ElevenLabs Sound Effects API.
// Requires ELEVENLABS_API_KEY in the environment. Reads scripts/sfx-config.json
// and writes one mp3 per entry into assets/audio/.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY environment variable.');
  process.exit(1);
}

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(await readFile(path.join(scriptsDir, 'sfx-config.json'), 'utf8'));

const outDir = path.resolve('assets/audio');
await mkdir(outDir, { recursive: true });

for (const sfx of config) {
  process.stdout.write(`Generating "${sfx.id}" -> assets/audio/${sfx.file} ... `);

  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: sfx.prompt,
      duration_seconds: sfx.duration,
      prompt_influence: sfx.promptInfluence ?? 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.log('FAILED');
    throw new Error(`ElevenLabs request failed for "${sfx.id}" (${res.status}): ${errText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(outDir, sfx.file), buffer);
  console.log('ok');
}

console.log('All sound effects generated.');
