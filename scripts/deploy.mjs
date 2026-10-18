// Builds the dashboard into dist/ and deploys it to the Vercel project "ensido-employee-dashboard"
// → https://ensido-employee-dashboard.vercel.app
//
//   npm run deploy               production deploy (needs `npx vercel login` once, with access to the ensido team)
//   npm run deploy -- --preview  preview deploy (unique URL, production untouched)
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'

const OUT = 'dist'
// Vercel project/team IDs are identifiers, not secrets.
const PROJECT = { projectId: 'prj_tV5TdTemX8WESe9H6ButbeHSOMin', orgId: 'team_9TRAHhoSsfGjFIkxmX6BXozf', projectName: 'ensido-employee-dashboard' }
const preview = process.argv.includes('--preview')

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd })

run('npm run build')
mkdirSync(`${OUT}/.vercel`, { recursive: true })
writeFileSync(`${OUT}/.vercel/project.json`, JSON.stringify(PROJECT))
run(`npx vercel@latest deploy ${preview ? '' : '--prod'} --yes`, OUT)
// Never leave pulled env/token files in a folder that gets published.
rmSync(`${OUT}/.env.local`, { force: true })
