import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const errors = []

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      return []
    }
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

function addError(message) {
  errors.push(message)
}

const markdown = walk(root).filter(path => extname(path).toLowerCase() === '.md')
const required = ['AGENTS.md', 'docs/skills/INDEX.md', 'docs/README.md']
for (const path of required) {
  if (!existsSync(join(root, path))) {
    addError(`missing required file: ${path}`)
  }
}

const skillFiles = walk(join(root, 'docs/skills')).filter(path => path.endsWith('/SKILL.md'))
for (const path of skillFiles) {
  const relativePath = relative(root, path)
  const directory = relative(join(root, 'docs/skills'), path).split('/')[0]
  const source = readFileSync(path, 'utf8')
  const frontMatterStart = source.startsWith('---\n')
  const frontMatterEnd = source.indexOf('\n---\n', 4)

  if (!frontMatterStart || frontMatterEnd === -1) {
    addError(`${relativePath}: missing YAML front matter`)
    continue
  }

  const fields = source.slice(4, frontMatterEnd).split('\n')
  const name = fields.find(line => line.startsWith('name:'))?.slice(5).trim()
  const description = fields.find(line => line.startsWith('description:'))?.slice(12).trim()

  if (!name || !description) {
    addError(`${relativePath}: front matter needs name and description`)
  }
  if (name && name !== directory) {
    addError(`${relativePath}: name '${name}' does not match '${directory}'`)
  }
  if (source.split('\n').length > 500) {
    addError(`${relativePath}: exceeds 500 lines`)
  }
}

for (const path of markdown) {
  const relativePath = relative(root, path)
  const source = readFileSync(path, 'utf8')
  if (path.endsWith('/SKILL.md') && !source.includes('## Verification')) {
    addError(`${relativePath}: missing Verification section`)
  }

  const links = [...source.matchAll(/\[[^\]]+\]\([^)]+\)/g)].map(([match]) => {
    const start = match.lastIndexOf('](') + 2
    return match.slice(start, -1)
  })
  for (const link of links) {
    if (/^(?:https?:|mailto:|#)/.test(link)) {
      continue
    }
    const target = link.split('#')[0]
    if (!target) {
      continue
    }
    const resolved = resolve(path, '..', target)
    if (!existsSync(resolved)) {
      addError(`${relativePath}: broken link ${link}`)
    }
  }
}

if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`)
  process.exit(1)
}

process.stdout.write(`checked ${markdown.length} Markdown files and ${skillFiles.length} skills\n`)
