import { spawn } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const rawArgs = process.argv.slice(2);
const shouldSetupElevenLabs = rawArgs.includes('--setup-elevenlabs') || process.env.npm_config_setup_elevenlabs === 'true';
const shouldForceSetup = rawArgs.includes('--force-elevenlabs-agent') || process.env.npm_config_force_elevenlabs_agent === 'true';
const shouldSkipTools = rawArgs.includes('--skip-elevenlabs-tools') || process.env.npm_config_skip_elevenlabs_tools === 'true';

const viteArgs = rawArgs.filter((arg) => ![
  '--setup-elevenlabs',
  '--force-elevenlabs-agent',
  '--skip-elevenlabs-tools'
].includes(arg));

try {
  if (shouldSetupElevenLabs) {
    const setupArgs = [path.join(ROOT, 'scripts', 'setup-elevenlabs-agent.mjs')];
    if (shouldForceSetup) setupArgs.push('--force');
    if (shouldSkipTools) setupArgs.push('--skip-tools');

    await run(process.execPath, setupArgs);
  }

  const viteJsEntry = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

  await run(process.execPath, [viteJsEntry, ...viteArgs]);
} catch (error) {
  console.error(`[dev] ${error.message}`);
  process.exit(1);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: false,
      env: process.env
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${path.basename(command)} exited with code ${code}`));
    });
  });
}
