import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { createI18n } from './i18n'
import './styles/global.css'
import './styles/botty.css'

const app = createApp(App)
const i18n = createI18n()
app.use(createPinia())
app.use(i18n)
app.use(router)
app.mount('#app')
