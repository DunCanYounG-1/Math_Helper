<template>
  <div class="knowledge-graph-view">
    <KnowledgeGraph />
  </div>
</template>

<script setup lang="ts">
import KnowledgeGraph from '@/components/knowledge/KnowledgeGraph.vue'
</script>

<style lang="scss" scoped>
.knowledge-graph-view {
  height: 100%;
  padding: 0;
  background-color: var(--bg-color);
}
</style>
