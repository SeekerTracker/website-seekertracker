"use client"
import React, { useEffect, useState } from 'react'
import styles from './toastMesage.module.css'
import { useDataContext } from 'app/(utils)/context/dataProvider'
import { v4 as uuid } from 'uuid'
import { useRouter } from 'next/navigation'


const MSG_TIMEOUT = 5000; // 5 seconds
type ToastMessage = {
    id: string,
    message: string,
    timestamp: number;
    link?: string;
}
const ToastMessage = () => {
    const { live } = useDataContext()
    const [newMessage, setNewMessage] = useState<ToastMessage[]>([])
    const router = useRouter()

    useEffect(() => {
        // Live domain toasts used charity WebSocket; REST polling on homepage covers updates.
    }, [live])

    function handleRedirect(link?: string) {
        if (!link) return
        router.push(link);
    }

    return (
        <div className={styles.main}>
            <div className={styles.toastMessages}>
                {newMessage.map(msg => (
                    <div className={styles.toastMessage} key={msg.timestamp} onClick={() => handleRedirect(msg.link)}>
                        {msg.message}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ToastMessage