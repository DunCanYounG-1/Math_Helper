import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

export * from './graphStore'
export * from './knowledgeStore'
export * from './settingsStore'
