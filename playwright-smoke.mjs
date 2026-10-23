import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))

const users = {
  admin: { id: 1, name: 'Avery Admin', email: 'admin@taskflow.local', role: 'admin' },
  member: { id: 2, name: 'Morgan Member', email: 'member@taskflow.local', role: 'user' },
}
let currentUser = users.admin
let nextProjectId = 8
let nextTaskId = 2
const projects = [{ id: 7, name: 'Website refresh', description: 'Plan and deliver the next website release.' }]
const tasksByProject = new Map([[7, [{ id: 1, project_id: 7, title: 'Review landing page copy', description: 'Review the first draft and leave feedback.', assignee_id: 2, status: 'IN_PROGRESS', priority: 'HIGH', due_date: '2026-11-01', assignee: { id: 2, name: users.member.name } }]]])
const projectData = id => {
  const record = projects.find(item => item.id === Number(id))
  const allTasks = tasksByProject.get(Number(id)) || []
  const tasks = currentUser.role === 'admin' ? allTasks : allTasks.filter(task => task.assignee_id === currentUser.id)
  return { ...record, creator: { id: 1, name: users.admin.name }, tasks }
}

await page.route('**/api/**', async route => {
  const request = route.request()
  const path = new URL(request.url()).pathname.replace(/\/+$/, '')
  const method = request.method()
  let status = 200
  let data = {}

  if (path.endsWith('/login') && method === 'POST') {
    const email = request.postDataJSON().email
    currentUser = email === users.member.email ? users.member : users.admin
    data = { token: `playwright-${currentUser.role}`, user: currentUser }
  } else if (path.endsWith('/logout') && method === 'POST') data = { message: 'Logged out' }
  else if (path.endsWith('/me')) data = currentUser
  else if (path.endsWith('/projects') && method === 'GET') {
    const visible = projects.filter(item => currentUser.role === 'admin' || (tasksByProject.get(item.id) || []).some(task => task.assignee_id === currentUser.id))
    data = visible.map(item => ({ ...projectData(item.id), tasks_count: projectData(item.id).tasks.length }))
  } else if (/\/projects\/\d+$/.test(path) && method === 'GET') {
    const id = Number(path.split('/').at(-1))
    const found = projects.some(item => item.id === id)
    const project = found ? projectData(id) : null
    if (!project || (currentUser.role !== 'admin' && !project.tasks.length)) { status = 404; data = null }
    else data = project
  } else if (path.endsWith('/users') && method === 'GET') data = Object.values(users).map(({ id, name, email, role }) => ({ id, name, email, role }))
  else if (path.endsWith('/projects') && method === 'POST') {
    const input = request.postDataJSON()
    const created = { id: nextProjectId++, ...input }
    projects.push(created)
    tasksByProject.set(created.id, [])
    data = created
    status = 201
  } else if (/\/projects\/\d+\/tasks$/.test(path) && method === 'POST') {
    const projectId = Number(path.split('/').at(-2))
    const input = request.postDataJSON()
    const assignee = Object.values(users).find(user => user.id === Number(input.assignee_id))
    const task = { id: nextTaskId++, project_id: projectId, ...input, assignee_id: Number(input.assignee_id), status: 'TODO', assignee: { id: assignee.id, name: assignee.name } }
    tasksByProject.get(projectId).push(task)
    data = task
    status = 201
  } else if (/\/tasks\/\d+$/.test(path) && method === 'PATCH') {
    const taskId = Number(path.split('/').at(-1))
    const task = [...tasksByProject.values()].flat().find(item => item.id === taskId)
    Object.assign(task, request.postDataJSON())
    data = task
  }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data === null ? { message: 'Not found' } : { data }) })
})

try {
  await page.goto('http://127.0.0.1:5173')
  await page.getByLabel('Email address').fill(users.admin.email)
  await page.getByLabel('Password').fill('Admin123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('heading', { name: 'Website refresh' }).waitFor()
  await page.getByText('Review landing page copy').waitFor()

  await page.getByRole('button', { name: 'Create project' }).click()
  await page.getByPlaceholder('e.g. Website refresh').fill('Playwright smoke workspace')
  await page.locator('.modal').getByRole('button', { name: 'Create project' }).click()
  await page.getByRole('heading', { name: 'Playwright smoke workspace' }).waitFor()
  await page.getByText('Nothing here yet. Add a task and give it a clear next step.').waitFor()

  await page.getByRole('button', { name: 'Add task' }).click()
  await page.getByLabel('Task name (required)').fill('Prepare launch notes')
  await page.getByLabel('Assignee (required)').selectOption('2')
  await page.getByLabel('Due date (required)').fill('2026-11-10')
  await page.getByRole('button', { name: 'Create task' }).click()
  await page.getByText('Review landing page copy').waitFor()

  await page.getByRole('button', { name: /^Projects/ }).click()
  await page.locator('.project-card').filter({ hasText: 'Playwright smoke workspace' }).click()
  await page.getByText('Loading project…').waitFor()
  await page.getByText('Prepare launch notes').waitFor()
  await page.getByRole('button', { name: 'Add task' }).waitFor()

  await page.locator('.status-select').selectOption('IN_PROGRESS')
  await page.waitForFunction(() => document.querySelector('.status-select')?.value === 'IN_PROGRESS')

  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByLabel('Email address').fill(users.member.email)
  await page.getByLabel('Password').fill('Member123!')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByText('Morgan Member').waitFor()
  await page.getByRole('heading', { name: 'Website refresh' }).waitFor()
  await page.getByText('Prepare launch notes').waitFor()
  await page.getByRole('button', { name: /^Projects/ }).click()
  await page.locator('.project-card').filter({ hasText: 'Playwright smoke workspace' }).click()
  await page.getByText('Prepare launch notes').waitFor()
  await page.getByText('Admins create tasks; members update assigned tasks.').waitFor()
  if (await page.getByRole('button', { name: 'Add task' }).count()) throw new Error('Member was incorrectly offered task creation.')
  await page.getByRole('button', { name: 'My tasks' }).click()
  await page.getByText('Prepare launch notes').waitFor()

  await mkdir('test-results', { recursive: true })
  await page.screenshot({ path: 'test-results/taskflow.png', fullPage: true })
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`)
  console.log('Playwright UI flow passed: admin login, project creation, task creation, project navigation, status update, member task visibility, and member permissions.')
} finally {
  await browser.close()
}
