import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))

let tasks = [{ id: 1, project_id: 7, title: 'Review landing page copy', description: 'Review the first draft and leave feedback.', assignee_id: 2, status: 'IN_PROGRESS', priority: 'HIGH', due_date: '2026-11-01', assignee: { id: 2, name: 'Morgan Member' } }]
const project = () => ({ id: 7, name: 'Website refresh', description: 'Plan and deliver the next website release.', creator: { id: 1, name: 'Avery Admin' }, tasks })

await page.route('**/api/**', async route => {
  const request = route.request()
  const path = new URL(request.url()).pathname
  const method = request.method()
  let data = {}

  if (path.endsWith('/login') && method === 'POST') data = { token: 'playwright-token', user: { id: 1, name: 'Avery Admin', email: 'admin@taskflow.local', role: 'admin' } }
  else if (path.endsWith('/me')) data = { id: 1, name: 'Avery Admin', email: 'admin@taskflow.local', role: 'admin' }
  else if (path.endsWith('/projects/7') && method === 'GET') data = project()
  else if (path.endsWith('/projects') && method === 'GET') data = [project()]
  else if (path.endsWith('/users')) data = [{ id: 1, name: 'Avery Admin' }, { id: 2, name: 'Morgan Member' }]
  else if (path.endsWith('/projects/7/tasks') && method === 'POST') {
    const input = request.postDataJSON()
    const task = { id: 2, project_id: 7, ...input, status: 'TODO', assignee: { id: input.assignee_id, name: 'Morgan Member' } }
    tasks.push(task)
    data = task
  } else if (path.endsWith('/tasks/1') && method === 'PATCH') {
    const input = request.postDataJSON()
    tasks = tasks.map(task => task.id === 1 ? { ...task, ...input } : task)
    data = tasks.find(task => task.id === 1)
  }
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) })
})

try {
  await page.goto('http://127.0.0.1:5173')
  await page.getByLabel('Email address').fill('admin@taskflow.local')
  await page.getByLabel('Password').fill('Admin123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('heading', { name: 'Website refresh' }).waitFor()
  await page.getByText('Review landing page copy').waitFor()
  await page.getByRole('button', { name: 'New task' }).click()
  await page.getByPlaceholder('e.g. Review launch checklist').fill('Prepare launch notes')
  await page.getByLabel('Assignee').selectOption('2')
  await page.getByLabel('Due date').fill('2026-11-10')
  await page.getByRole('button', { name: 'Create task' }).click()
  await page.getByText('Prepare launch notes').waitFor()
  await mkdir('test-results', { recursive: true })
  await page.screenshot({ path: 'test-results/taskflow.png', fullPage: true })
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log(`Playwright UI flow passed: ${await page.locator('.task-row').count()} tasks shown; task creation completed.`)
} finally {
  await browser.close()
}
