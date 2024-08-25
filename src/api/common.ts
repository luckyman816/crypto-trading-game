import axios from 'axios'

import { appiUrl } from '@/config'

export function getServerInfo(): Promise<any> {
  return axios.get(`${appiUrl}/server-info`);
}