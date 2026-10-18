// Builds the dashboard into dist/ and deploys it to the Vercel project "ensido-employee-dashboard"
// → https://ensido-employee-dashboard.vercel.app
//
//   npm run deploy               production deploy (needs `npx vercel login` once, with access to the ensido team)
//   npm run deploy -- --preview  preview deploy (unique URL, production untouched)
//
// The build is deployed from a temp folder OUTSIDE this git repo: otherwise the Vercel CLI attaches the latest
// commit's author, and Vercel blocks the deploy when that email isn't a member of the ensido team.
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Vercel project/team IDs are identifiers, not secrets.
const PROJECT = { projectId: 'prj_tV5TdTemX8WESe9H6ButbeHSOMin', orgId: 'team_9TRAHhoSsfGjFIkxmX6BXozf', projectName: 'ensido-employee-dashboard' }
const preview = process.argv.includes('--preview')

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd })

run('npm run build')
const out = mkdtempSync(join(tmpdir(), 'ensido-dashboard-deploy-'))
try {
  cpSync('dist', out, { recursive: true })
  mkdirSync(join(out, '.vercel'), { recursive: true })
  writeFileSync(join(out, '.vercel', 'project.json'), JSON.stringify(PROJECT))
  run(`npx vercel@latest deploy ${preview ? '' : '--prod'} --yes`, out)
} finally {
  // Removes the temp folder, including any .env.local the CLI may have pulled. Windows can briefly keep the folder
  // locked after the CLI exits, so retry instead of failing an otherwise successful deploy.
  try {
    rmSync(out, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 })
  } catch {
    console.warn(`Deploy finished, but could not remove ${out}. Delete it manually (it may contain a Vercel token).`)
  }
}
