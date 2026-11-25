import PicadsLayout from '@/layouts/PicadsLayout.vue'
import PicadsLoginView from '@/views/picads/PicadsLoginView.vue'
import PicadsExtensionsView from '@/views/picads/PicadsExtensionsView.vue'
import PicadsDocsView from '@/views/picads/PicadsDocsView.vue'
import PicadsKeysView from '@/views/picads/PicadsKeysView.vue'

/** Nhánh SPA riêng — không nằm trong BotLayout, auth riêng (picads-token). */
const picadsRoutes = {
  path: '/picads',
  component: PicadsLayout,
  meta: { picadsApp: true },
  children: [
    {
      path: '',
      name: 'picads-root',
      redirect: { name: 'picads-extensions' },
    },
    {
      path: 'login',
      name: 'picads-login',
      component: PicadsLoginView,
      meta: { picadsGuest: true },
    },
    {
      path: 'extensions',
      name: 'picads-extensions',
      component: PicadsExtensionsView,
      meta: { requiresPicadsAuth: true },
    },
    {
      path: 'docs',
      name: 'picads-docs',
      component: PicadsDocsView,
    },
    {
      path: 'keys',
      name: 'picads-keys',
      component: PicadsKeysView,
      meta: { requiresPicadsAuth: true },
    },
    {
      path: ':pathMatch(.*)*',
      redirect: { name: 'picads-extensions' },
    },
  ],
}

export default picadsRoutes