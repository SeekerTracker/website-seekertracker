
import React from 'react'
import UserDomain from './userDomain';


const Page = async ({
    params,
}: {
    params: Promise<{ userDomain: string }>;
}) => {
    const { userDomain } = await params;

    if (!userDomain) {
        return <div>No domain provided</div>;
    }

    const splitted = userDomain.split('.');
    const subdomain = splitted[0]
    const domain = "." + splitted[1];
    if (!domain || !subdomain) {
        return <div>Domain not found</div>;
    }



    return <UserDomain userDomain={userDomain} />
}

export default Page


