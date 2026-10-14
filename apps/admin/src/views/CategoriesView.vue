<script setup lang="ts">
import { messageOf, slugify } from '@shared/format'
import type { Category } from '@shared/types'
import { onMounted, reactive, ref } from 'vue'
import { api } from '../lib/api'

const categories = ref<Category[]>([])
const error = ref('')
const editing = ref<string | null>(null)
const form = reactive({ name: '', slug: '', description: '', sort_order: '1' })

function reset() {
  editing.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.sort_order = String((categories.value.at(-1)?.sort_order ?? 0) + 1)
}

async function load() {
  categories.value = await api.listCategories()
  if (!editing.value) form.sort_order = String((categories.value.at(-1)?.sort_order ?? 0) + 1)
}

onMounted(async () => {
  try {
    await load()
  } catch (err) {
    error.value = messageOf(err)
  }
})

function edit(category: Category) {
  editing.value = category.id
  form.name = category.name
  form.slug = category.slug
  form.description = category.description
  form.sort_order = String(category.sort_order)
}

async function save() {
  error.value = ''
  try {
    const sort = Number(form.sort_order)
    if (!Number.isFinite(sort)) throw new Error('Sort order needs to be a number.')
    await api.saveCategory({
      name: form.name,
      slug: slugify(form.slug || form.name),
      description: form.description,
      sort_order: sort,
    }, editing.value ?? undefined)
    reset()
    await load()
  } catch (err) {
    error.value = messageOf(err)
  }
}

async function remove(category: Category) {
  if (!window.confirm(`Remove ${category.name}? Pieces in it stay in the catalog.`)) return
  try {
    await api.deleteCategory(category.id)
    if (editing.value === category.id) reset()
    await load()
  } catch (err) {
    error.value = messageOf(err)
  }
}
</script>

<template>
  <div>
    <p class="eyebrow">Catalog</p>
    <h1>Departments</h1>
    <form class="form-grid" @submit.prevent="save">
      <label class="field"><span>Name</span><input v-model="form.name" required /></label>
      <label class="field"><span>Slug</span><input v-model="form.slug" :placeholder="slugify(form.name)" /></label>
      <label class="field"><span>Description</span><input v-model="form.description" /></label>
      <label class="field"><span>Sort</span><input v-model="form.sort_order" inputmode="numeric" required /></label>
      <div class="wide" style="display: flex; gap: 16px; align-items: center">
        <button class="btn" type="submit">{{ editing ? 'Update department' : 'Add department' }}</button>
        <button v-if="editing" class="btn-text" type="button" @click="reset">Cancel edit</button>
      </div>
      <p v-if="error" class="alert wide">{{ error }}</p>
    </form>
    <div class="table-wrap" style="margin-top: 28px">
      <table class="data">
        <thead><tr><th>Name</th><th>Slug</th><th>Description</th><th>Sort</th><th></th></tr></thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td>{{ category.name }}</td>
            <td>{{ category.slug }}</td>
            <td>{{ category.description }}</td>
            <td class="num">{{ category.sort_order }}</td>
            <td>
              <button class="btn-text" type="button" @click="edit(category)">Edit</button>
              <button class="btn-text" type="button" style="margin-left: 12px" @click="remove(category)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
