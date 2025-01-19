<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import Popover from 'primevue/popover'

// Types
interface Workspace {
  workspaceId: string
  name: string
  pages?: any[]
}

interface Props {
  currentWorkspaceName: string
  currentWorkspaceId: string
  allWorkspaces: Workspace[]
}

const workspaceMenu = ref()

// Props
const props = withDefaults(defineProps<Props>(), {
  allWorkspaces: () => [],
})

// Emits
const emit = defineEmits<{
  'select-workspace': [workspace: Workspace]
}>()

// Setup
const router = useRouter()

// Methods
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

const createWorkspace = (): void => {
  // Implement workspace creation logic
  workspaceMenu.value?.hide()
}

const navigateToWorkspaceSettings = (): void => {
  workspaceMenu.value?.hide()
  router.push(`/${props.currentWorkspaceId}/settings/workspace`)
}

const selectWorkspace = (workspace: Workspace): void => {
  workspaceMenu.value?.hide()
  //sideNavType.value = 'main'
  emit('select-workspace', workspace)
  localStorage.setItem('personal-bo-currentWorkspaceId', workspace.workspaceId)
  router.push(`/`)
  //router.push(`/${workspace.workspaceId}/dashboard`)
}

const toggle = (event: any) => {
  workspaceMenu.value.toggle(event)
}
</script>

<template>
  <div class="card flex justify-center">
    <Button
      type="button"
      :label="currentWorkspaceName ? currentWorkspaceName : 'Select Workspace'"
      @click="toggle"
      class="min-w-48 mb-4 p-2 child:font-semibold"
    />

    <Popover ref="workspaceMenu">
      <div class="flex flex-col gap-4">
        <div>
          <div class="flex justify-between mb-2">
            <span class="block text-xs">Workspaces</span>
            <span class="block text-xs cursor-pointer hover:font-semibold">Add</span>
          </div>
          <ul class="list-none p-0 m-0 flex flex-col">
            <li
              v-for="workspace in allWorkspaces"
              :key="workspace.name"
              class="flex items-center gap-2 px-2 py-3 hover:bg-emphasis cursor-pointer rounded-border"
              @click="selectWorkspace(workspace)"
            >
              <!-- <img :src="`https://primefaces.org/cdn/primevue/images/avatar/${member.image}`" style="width: 32px" /> -->
              <div>
                <span class="font-medium">{{ workspace.name }}</span>
                <!-- <div class="text-sm text-surface-500 dark:text-surface-400">{{ member.email }}</div> -->
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Popover>
  </div>
</template>
