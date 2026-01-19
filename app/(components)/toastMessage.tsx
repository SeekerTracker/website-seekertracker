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
    const { backendWS } = useDataContext()
    const [newMessage, setNewMessage] = useState<ToastMessage[]>([])
    const router = useRouter()

    useEffect(() => {
        if (!backendWS) return
        backendWS.on("newDomain", (data) => {
            const { subdomain, domain } = data
            const message: ToastMessage = {
                id: uuid(),
                message: `New Seeker Activated: ${subdomain}${domain}`,
                timestamp: Date.now(),
                link: `/id/${subdomain}${domain}`
            }
            setNewMessage(prev => [message, ...prev])
            setTimeout(() => {
                setNewMessage(prev => prev.filter(msg => msg.id !== message.id))
            }, MSG_TIMEOUT)
        })

        // setInterval(() => {
        //     const newTestMessage = {
        //         id: uuid(),
        //         message: `This is a test message ${uuid()}`,
        //         timestamp: Date.now(),
        //     }
        //     setNewMessage(prev => [newTestMessage, ...prev])
        //     setTimeout(() => {
        //         setNewMessage(prev => prev.filter(msg => msg.id !== newTestMessage.id))
        //     }, MSG_TIMEOUT)
        // }, 1000);

        return () => {
            backendWS.off("newDomain")
        }


    }, [backendWS])

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