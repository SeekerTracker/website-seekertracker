"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ClientRedirect({ url }: { url: string }) {
    const router = useRouter()

    useEffect(() => {
        router.replace(url)
    }, [router, url])

    return null
}
