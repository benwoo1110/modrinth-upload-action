import core from '@actions/core'
import github from '@actions/github'
import FormData from 'form-data'
import fetch from 'node-fetch'
import path from 'path'
import fs from 'fs'

const api_token = core.getInput('api_token')
const project_id = core.getInput('project_id')
const version_number = core.getInput('version_number')
const files = core.getInput('files')
const name = core.getInput('name')
const changelog = core.getInput('changelog')
const dependencies = core.getInput('dependencies')
const game_versions = core.getInput('game_versions')
const version_type = core.getInput('version_type')
const loaders = core.getInput('loaders')
const featured = core.getBooleanInput('featured')
const status = core.getInput('status')
const requested_status = core.getInput('requested_status')

const form = new FormData()

const filesArray = JSON.parse(files)
const file_parts: string[] = []
for (const file of filesArray) {
    const filename = path.basename(file)
    form.append(filename, fs.createReadStream(file))
    file_parts.push(filename)
}

const data = {
    project_id,
    version_number,
    file_parts,
    name,
    changelog,
    dependencies: JSON.parse(dependencies),
    game_versions: JSON.parse(game_versions),
    version_type,
    loaders: JSON.parse(loaders),
    featured,
    status,
    requested_status,
}

// Remove '' from metadata
const dataCleaned: { [key: string]: unknown } = {}
Object.keys(data).forEach(key => {
    const value = data[key as keyof typeof data]
    if (value !== '') {
        dataCleaned[key] = value
    }
})

form.append('data', JSON.stringify(dataCleaned))

fetch('https://api.modrinth.com/v2/version', {
    method: 'POST',
    headers: {
        'User-Agent': `${github.context.repo.owner}/${github.context.repo.repo}/${github.context.sha}`,
        'Authorization': api_token,
        ...form.getHeaders(),
    },
    body: form,
}).then(async res => {
    const json = await res.json()
    core.info(JSON.stringify(json))
    if (!res.ok) {
        core.setFailed(JSON.stringify(json))
    }
})
