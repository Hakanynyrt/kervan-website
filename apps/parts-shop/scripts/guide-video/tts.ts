/**
 * Synthetic voice for the guide videos (owner, 2026-11-02: "yapay ses").
 * - azure: Azure Speech REST (neural voice; the published videos). The key and region come only
 *   from the environment (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION) and are never printed, logged or
 *   written anywhere; an error says the HTTP status only. Running it sends the narration text
 *   (article sentences, already public) to Azure: only the owner runs it, on his own PC.
 * - sapi: a Turkish Windows voice (e.g. "Microsoft Tolga", also from the OneCore voice list) via
 *   SAPI COM in PowerShell, offline. Trials only: the script refuses to publish it.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_AZURE_VOICE = 'tr-TR-EmelNeural';
const VOICE_RE = /^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/;
const REGION_RE = /^[a-z0-9]+$/;

export const escapeXml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export function ssml(text: string, voice: string): string {
  if (!VOICE_RE.test(voice)) throw new Error(`Azure ses adı geçersiz: ${voice}`);
  const lang = voice.slice(0, 5);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${voice}">${escapeXml(text)}</voice></speak>`;
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; arrayBuffer(): Promise<ArrayBuffer> }>;

/** One line → one 24 kHz 16-bit mono wav. */
export async function azureTts(
  text: string,
  outWav: string,
  opts: { voice?: string; env?: NodeJS.ProcessEnv; fetchImpl?: FetchLike } = {},
): Promise<void> {
  const env = opts.env ?? process.env;
  const key = env.AZURE_SPEECH_KEY;
  const region = env.AZURE_SPEECH_REGION;
  if (!key || !region)
    throw new Error(
      'Azure TTS: AZURE_SPEECH_KEY ve AZURE_SPEECH_REGION ortam değişkenleri gerekli',
    );
  if (!REGION_RE.test(region)) throw new Error('Azure TTS: AZURE_SPEECH_REGION geçersiz');
  const body = ssml(text, opts.voice ?? DEFAULT_AZURE_VOICE);
  const doFetch = opts.fetchImpl ?? (fetch as unknown as FetchLike);
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await doFetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
        'User-Agent': 'kervan-guide-video',
      },
      body,
    });
  } catch {
    // The original error is dropped on purpose: nothing from the request is echoed.
    throw new Error('Azure TTS: bağlantı kurulamadı');
  }
  if (!res.ok) throw new Error(`Azure TTS: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.subarray(0, 4).toString('latin1') !== 'RIFF') throw new Error('Azure TTS: wav değil');
  fs.writeFileSync(outWav, buf);
}

/** SAPI COM: the first Turkish voice (LCID 41F) of the SAPI or OneCore lists, 24 kHz mono. */
const SAPI_PS = String.raw`
$ErrorActionPreference = 'Stop'
$text = [IO.File]::ReadAllText($env:KV_TTS_TEXT, [Text.Encoding]::UTF8)
$pick = $null
foreach ($id in @('HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech\Voices', 'HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices')) {
  $cat = New-Object -ComObject SAPI.SpObjectTokenCategory
  try { $cat.SetId($id, $false) } catch { continue }
  foreach ($t in $cat.EnumerateTokens()) {
    $lang = ''
    try { $lang = [string]$t.GetAttribute('Language') } catch {}
    if (@($lang.Split(';') | Where-Object { $_ -and [Convert]::ToInt32($_.Trim(), 16) -eq 0x41F }).Count) {
      if (-not $env:KV_TTS_NAME -or $t.GetDescription() -like ('*' + $env:KV_TTS_NAME + '*')) { $pick = $t; break }
    }
  }
  if ($pick) { break }
}
if (-not $pick) { exit 3 }
$voice = New-Object -ComObject SAPI.SpVoice
$voice.Voice = $pick
$fmt = New-Object -ComObject SAPI.SpAudioFormat
$fmt.Type = 26
$fs = New-Object -ComObject SAPI.SpFileStream
$fs.Format = $fmt
$fs.Open($env:KV_TTS_OUT, 3, $false)
$voice.AudioOutputStream = $fs
[void]$voice.Speak($text, 16)
$fs.Close()
[Console]::Out.Write($pick.GetDescription())
`;

/** One line → one wav with a Turkish Windows voice; returns the voice's name. */
export function sapiTts(text: string, outWav: string, name?: string): string {
  if (process.platform !== 'win32') throw new Error('SAPI yalnız Windows’ta');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kv-sapi-'));
  try {
    const txt = path.join(tmp, 'line.txt');
    fs.writeFileSync(txt, text, 'utf8');
    const r = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', SAPI_PS],
      {
        env: { ...process.env, KV_TTS_TEXT: txt, KV_TTS_OUT: outWav, KV_TTS_NAME: name ?? '' },
        encoding: 'utf8',
      },
    );
    if (r.status === 3) throw new Error('Türkçe SAPI sesi kurulu değil');
    if (r.status !== 0) throw new Error(`SAPI hata verdi (çıkış ${r.status})`);
    return r.stdout.trim().split(' - ')[0] || 'sapi';
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
