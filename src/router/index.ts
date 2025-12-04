import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/graph',
    name: 'Graph',
    component: () => import('@/views/GraphView.vue'),
    meta: { title: '函数绘图' }
  },
  {
    path: '/learn',
    name: 'Learn',
    component: () => import('@/views/LearnView.vue'),
    meta: { title: '知识学习' }
  },
  {
    path: '/learn/:knowledgePointId',
    name: 'LearnDetail',
    component: () => import('@/views/LearnView.vue'),
    meta: { title: '知识学习' }
  },
  {
    path: '/formula',
    name: 'Formula',
    component: () => import('@/views/FormulaView.vue'),
    meta: { title: '公式速查' }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/FavoritesView.vue'),
    meta: { title: '我的收藏' }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('@/views/NotesView.vue'),
    meta: { title: '我的笔记' }
  },
  {
    path: '/practice',
    name: 'Practice',
    component: () => import('@/views/PracticeView.vue'),
    meta: { title: '例题练习' }
  },
  {
    path: '/wrong-questions',
    name: 'WrongQuestions',
    component: () => import('@/views/WrongQuestionsView.vue'),
    meta: { title: '错题本' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'Math Helper'} - Math Helper`
  next()
})

export default router
