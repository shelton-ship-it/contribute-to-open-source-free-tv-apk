#!/usr/bin/env node
//
// init-twa.js — gera o projeto Android a partir do twa-manifest.json já
// commitado neste directório, SEM passar pelo "bubblewrap init" (que é
// interactivo por definição: pede confirmações e, sem terminal, entra em
// loop infinito em CI — visto em produção neste workflow).
//
// Chama directamente a API do @bubblewrap/core (TwaGenerator.createTwaProject),
// o mesmo motor que o CLI usa por baixo, e escreve o ficheiro de checksum
// que falta — sem ele, "bubblewrap build" pergunta sempre se quer
// regenerar o projeto (também interactivo, também trava em CI).
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const npmRootGlobal = execSync('npm root -g').toString().trim();
const CORE_PATH = path.join(npmRootGlobal, '@bubblewrap/cli/node_modules/@bubblewrap/core');

if (!fs.existsSync(CORE_PATH)) {
  console.error(`[init-twa] @bubblewrap/core não encontrado em ${CORE_PATH}`);
  process.exit(1);
}

const { TwaManifest, TwaGenerator, ConsoleLog } = require(CORE_PATH);

const targetDir = __dirname; // tv/android — manifest, keystore e projecto gerado convivem aqui
const manifestPath = path.join(targetDir, 'twa-manifest.json');
const json = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const twaManifest = new TwaManifest(json);
const log = new ConsoleLog('init-twa');

(async () => {
  const generator = new TwaGenerator();
  await generator.createTwaProject(targetDir, twaManifest, log);

  // createTwaProject já reescreve o twa-manifest.json (normalizado) dentro
  // de targetDir — o checksum tem de ser calculado sobre ESSE ficheiro,
  // exactamente como "bubblewrap build" o vai reler a seguir.
  const savedManifestPath = path.join(targetDir, 'twa-manifest.json');
  fs.writeFileSync(
    path.join(targetDir, 'manifest-checksum.txt'),
    crypto.createHash('sha1').update(fs.readFileSync(savedManifestPath)).digest('hex'),
  );

  log.info(`Projecto TWA gerado em ${targetDir}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
