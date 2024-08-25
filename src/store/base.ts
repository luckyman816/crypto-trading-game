import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getServerInfo } from '@/api/common'

export const useBaseStore = defineStore('base', () => {
  const offsetTime = ref<number>(0)

  async function FETCH_SERVER_TIME() {
    try {
      const { data } = await getServerInfo()
      const timestamp = new Date(data.server_time).getTime()
      syncOffsetTime(timestamp)
    } catch (error) {
      console.log(error)
    }
  }
  
  function syncOffsetTime(timestamp: number) {
    offsetTime.value = Date.now() - timestamp
    console.log('Offset Time by HTTP request:', offsetTime.value)
  }

  return { offsetTime, FETCH_SERVER_TIME }
})
