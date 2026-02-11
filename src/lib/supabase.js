import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jmgmvujqkkttivtsiyqw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZ212dWpxa2t0dGl2dHNpeXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTgzNTIsImV4cCI6MjA4NjI3NDM1Mn0.cf0hMl1OHe7phtFOPI8_FQs6sSfetvkVznvUP8owz5Q'

export const supabase = createClient(supabaseUrl, supabaseKey)
