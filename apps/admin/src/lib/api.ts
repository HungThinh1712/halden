import { createApi } from '@shared/api'
import { supabase } from './supabase'

export const api = createApi(supabase)
