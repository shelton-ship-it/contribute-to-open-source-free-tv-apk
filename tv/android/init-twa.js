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

// ───────────────────────── Android TV ─────────────────────────
// O template do Bubblewrap é para telemóvel: sem LEANBACK_LAUNCHER a app NÃO aparece no
// ecrã inicial de uma Android TV / Google TV / TV Box, sem banner mostra um ícone
// quadrado minúsculo, e sem `touchscreen required=false` a Play/instalação recusa
// dispositivos sem ecrã táctil. Patch idempotente, aplicado ao projecto já gerado.
function patchAndroidTV() {
  const manifestFile = path.join(targetDir, 'app/src/main/AndroidManifest.xml');
  if (!fs.existsSync(manifestFile)) {
    console.warn('[init-twa] AndroidManifest.xml não encontrado — patch de TV ignorado');
    return;
  }
  let xml = fs.readFileSync(manifestFile, 'utf8');
  const before = xml;

  // 1) Sem ecrã táctil / leanback: o dispositivo é aceite (required=false: o mesmo APK serve telemóvel).
  if (!xml.includes('android.software.leanback')) {
    xml = xml.replace(/<application\b/, [
      '<uses-feature android:name="android.software.leanback" android:required="false"/>',
      '    <uses-feature android:name="android.hardware.touchscreen" android:required="false"/>',
      '',
      '    <application',
    ].join('\n'));
  }

  // 2) Banner 320x180dp (res/drawable-xhdpi/tv_banner.png) no <application>.
  if (!xml.includes('android:banner=')) {
    xml = xml.replace(/<application\b/, '<application\n        android:banner="@drawable/tv_banner"');
  }

  // 3) Entrada no launcher da TV (no MESMO intent-filter MAIN/LAUNCHER da LauncherActivity).
  if (!xml.includes('LEANBACK_LAUNCHER')) {
    xml = xml.replace(
      /(<category\s+android:name="android\.intent\.category\.LAUNCHER"\s*\/>)/,
      '$1\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER"/>',
    );
  }

  if (xml !== before) fs.writeFileSync(manifestFile, xml);

  const okLauncher = xml.includes('LEANBACK_LAUNCHER');
  const okBanner = xml.includes('@drawable/tv_banner');
  const okFeature = xml.includes('android.software.leanback');
  if (!(okLauncher && okBanner && okFeature)) {
    console.warn(`[init-twa] AVISO: patch TV incompleto (leanback=${okFeature} banner=${okBanner} launcher=${okLauncher}) — confirmar o AndroidManifest.xml gerado`);
  }

  const bannerSrc = path.join(targetDir, 'assets/tv_banner.png');
  const bannerDstDir = path.join(targetDir, 'app/src/main/res/drawable-xhdpi');
  if (fs.existsSync(bannerSrc)) {
    fs.mkdirSync(bannerDstDir, { recursive: true });
    fs.copyFileSync(bannerSrc, path.join(bannerDstDir, 'tv_banner.png'));
  } else {
    console.warn('[init-twa] assets/tv_banner.png em falta — android:banner vai falhar o build');
  }
}

(async () => {
  const generator = new TwaGenerator();
  await generator.createTwaProject(targetDir, twaManifest, log);
  patchAndroidTV();

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
