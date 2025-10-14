import React from 'react'
import styles from './userDomain.module.css'

const Page = async ({ params }: { params: Promise<{ userDomain: string }>; }) => {
    const { userDomain } = await params; // <-- await params
    if (!userDomain) {
        return <div>Domain not found</div>;
    }

    const splitted = userDomain.split('.');
    const subdomain = splitted[0]
    const domain = "." + splitted[1];
    if (!domain) {
        return <div>Domain not found</div>;
    }
    if (!subdomain) {
        return <div>Domain not found</div>;
    }

    return (
        <div className={styles.main}>{subdomain}{domain}</div>
    )
}

export default Page 