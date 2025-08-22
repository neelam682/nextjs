import React from 'react'

const supabase = () => {
    return (
        import('@supabase/supabase-js').then(({ createClient }) => {
            return createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            );
        })
    )
}

export default supabase