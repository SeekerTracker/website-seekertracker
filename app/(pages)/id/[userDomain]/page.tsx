
import React from 'react'
import UserDomain from './userDomain';
import { Metadata } from 'next';

export async function generateMetadata(
    {
        params,
    }: {
        params: Promise<{ userDomain: string }>;
    }): Promise<Metadata> {
    const { userDomain } = await params;

    return {
        title: `${userDomain} | Seeker`,
        description: `Details and insights for domain ${userDomain}.`,
        openGraph: {
            title: `${userDomain} | Seeker`,
            description: `Explore data about ${userDomain}.`,
            type: "website",
            url: `https://your-domain.com/${userDomain}`,
            images: [
                {
                    url: `https://your-domain.com/image/${encodeURIComponent(userDomain)}.png`,
                    width: 1200,
                    height: 630,
                    alt: `${userDomain} OG Image`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${userDomain} | Seeker`,
            description: `Learn more about ${userDomain}.`,
            images: [`https://your-domain.com/image/${encodeURIComponent(userDomain)}.png`],
        },
    };
}


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



    return (

        <>
            <UserDomain userDomain={userDomain} />
        </>
    )
}

export default Page


