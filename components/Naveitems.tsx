'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const naveItems = [
    { label: 'Home', href: '/' },
    { label: 'Companions', href: '/companions' },
    { label: 'My-Journey', href: '/my-journey' },
]

const Naveitems = () => {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null // or return basic fallback nav

    return (
        <nav className='flex items-center gap-4'>
            {naveItems.map(({ label, href }) => (
                <Link
                    href={href}
                    key={label}
                    className={cn(pathname === href && 'text-primary font-semibold')}
                >
                    {label}
                </Link>
            ))}
        </nav>
    )
}

export default Naveitems
