<template>
  <article class="docs">
    <h1>PicAds — đăng ký, đăng nhập &amp; key <code>picads_</code></h1>

    <h2>Console quản lý</h2>
    <p>Nhánh route <code>/picads</code>, auth riêng (<code>picads-token</code>).</p>
    <table>
      <thead>
        <tr><th>Đường dẫn</th><th>Chức năng</th></tr>
      </thead>
      <tbody>
        <tr><td><code>/picads/login</code></td><td>Đăng ký / đăng nhập</td></tr>
        <tr><td><code>/picads/extensions</code></td><td>Upload &amp; quản lý bản extension</td></tr>
        <tr><td><code>/picads/keys</code></td><td>API keys, lọc theo <code>apiKey</code></td></tr>
        <tr><td><code>/picads/docs</code></td><td>Tài liệu này (HTML trong FE)</td></tr>
      </tbody>
    </table>

    <h2>Base URL</h2>
    <pre><code>{{ apiBase }}/v3/picads</code></pre>

    <h2>Đăng ký</h2>
    <p><code>POST /register</code> — body JSON: <code>email</code>, <code>password</code> (≥8), <code>name</code> (tùy chọn).</p>
    <p>Trả JWT + <code>key</code> đầy đủ <code>picads_…</code> <strong>một lần</strong>.</p>

    <h2>Đăng nhập</h2>
    <p><code>POST /login</code> — <code>email</code>, <code>password</code>. Trả JWT + danh sách key (chỉ nhãn <code>apiKey</code>).</p>

    <h2>Danh sách key</h2>
    <p><code>GET /keys</code> — Bearer JWT hoặc <code>picads_</code>.</p>
  <p>Query: <code>apiKey</code> hoặc <code>key</code> (lọc contains).</p>
    <pre><code>GET {{ apiBase }}/v3/picads/keys?apiKey=picads_a1b2</code></pre>

    <h2>Extension — công khai (không auth)</h2>

    <h3>Kiểm tra phiên bản</h3>
    <p><code>GET /extensions/check?version=</code> hoặc <code>?v=</code></p>
    <pre><code>GET {{ apiBase }}/v3/picads/extensions/check?version=1.0.0</code></pre>
    <p>Trả <code>updateAvailable</code>, <code>latestVersion</code>, <code>release.downloadUrl</code> khi có bản mới.</p>

    <h3>Bản mới nhất</h3>
    <pre><code>GET {{ apiBase }}/v3/picads/extensions/latest</code></pre>

    <h3>Tải file</h3>
    <table>
      <thead>
        <tr><th>Query</th><th>Ý nghĩa</th></tr>
      </thead>
      <tbody>
        <tr><td><code>latest=1</code></td><td>Bản semver cao nhất</td></tr>
        <tr><td><code>version=1.2.0</code></td><td>Đúng phiên bản</td></tr>
      </tbody>
    </table>
    <p>Hoặc <code>GET /extensions/download/:id</code>. Header <code>X-Picads-Version</code>.</p>
    <pre><code>curl -L -o picads.zip "{{ apiBase }}/v3/picads/extensions/download?latest=1"</code></pre>

    <h2>Extension — quản trị (JWT)</h2>
    <ul>
      <li><code>GET /extensions</code> — danh sách bản đã đăng</li>
      <li><code>POST /extensions</code> — multipart: <code>version</code>, <code>notes</code>, <code>file</code> (.zip/.crx/.xpi)</li>
      <li><code>DELETE /extensions/:id</code></li>
    </ul>

    <h2>Gọi API Botty bằng key PicAds</h2>
    <pre><code>GET {{ apiBase }}/bots
Authorization: Bearer picads_&lt;secret&gt;</code></pre>

    <h2>Bảng <code>picads_keys</code></h2>
    <table>
      <thead>
        <tr><th>Cột</th><th>Ý nghĩa</th></tr>
      </thead>
      <tbody>
        <tr><td><code>api_key</code></td><td>Nhãn 20 ký tự (lọc / hiển thị)</td></tr>
        <tr><td><code>key_hash</code></td><td>SHA-256 secret</td></tr>
      </tbody>
    </table>
    <p>Tối đa 25 key active / user.</p>

    <h2>Mã lỗi (<code>messageCode</code>)</h2>
    <table>
      <thead>
        <tr><th>Mã</th><th>Ý nghĩa</th></tr>
      </thead>
      <tbody>
        <tr><td><code>PICADS_EMAIL_EXISTS</code></td><td>Email đã đăng ký</td></tr>
        <tr><td><code>PICADS_INVALID_CREDENTIALS</code></td><td>Sai email/mật khẩu</td></tr>
        <tr><td><code>PICADS_VERSION_INVALID</code></td><td>Phiên bản không hợp lệ</td></tr>
        <tr><td><code>PICADS_EXT_NOT_FOUND</code></td><td>Không có bản extension</td></tr>
        <tr><td><code>PICADS_KEY_SAVE_ONCE</code></td><td>Lưu key ngay khi đăng ký</td></tr>
      </tbody>
    </table>

    <h2>cURL mẫu</h2>
    <pre><code># Đăng ký
curl -s -X POST "{{ apiBase }}/v3/picads/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"picads@shop.vn","password":"matkhau8ky","name":"Shop PicAds"}'

# Đăng nhập
curl -s -X POST "{{ apiBase }}/v3/picads/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"picads@shop.vn","password":"matkhau8ky"}'

# Check update
curl -s "{{ apiBase }}/v3/picads/extensions/check?version=1.0.0"</code></pre>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { getApiBaseUrl } from '@/api/client'

const apiBase = computed(() => getApiBaseUrl().replace(/\/$/, ''))
</script>

<style scoped>
.docs {
  line-height: 1.6;
  color: #334155;
}

.docs h1 {
  font-size: 24px;
  margin: 0 0 16px;
  color: #1e1b4b;
}

.docs h2 {
  font-size: 20px;
  margin: 24px 0 10px;
  color: #312e81;
}

.docs h3 {
  font-size: 16px;
  margin: 16px 0 8px;
}

.docs p {
  margin: 8px 0;
}

.docs ul {
  margin: 8px 0;
  padding-left: 1.25rem;
}

.docs pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 14px;
  border-radius: 10px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
}

.docs code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 13px;
}

.docs pre code {
  background: none;
  padding: 0;
  font-size: inherit;
}

.docs table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 14px;
}

.docs th,
.docs td {
  border: 1px solid #e2e8f0;
  padding: 8px 10px;
  text-align: left;
}

.docs th {
  background: #f8fafc;
}
</style>