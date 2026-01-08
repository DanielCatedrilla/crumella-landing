import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables. Please check .env.local and restart your server.")
}

if (!supabaseUrl.startsWith("http")) {
    throw new Error(`Invalid Supabase URL: "${supabaseUrl}". It must start with https://. Check your .env.local file.`)
}

export const supabase = createClient(supabaseUrl, supabaseKey)
