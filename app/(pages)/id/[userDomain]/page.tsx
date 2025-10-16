
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
        applicationName: "Seeker",
        title: `${userDomain} - SeekerID Profile`,
        description: `Complete SeekerID profile with activation details and analytics.`,
        openGraph: {
            type: "website",
            title: `${userDomain} - SeekerID Profile`,
            description: `🔥 SeekerID Profile for ${userDomain} - View rank, analytics, token holdings and activation details on Seeker Tracker`,
            url: `https://seekertracker.com/${userDomain}`,
            siteName: "Seeker Tracker",
            images: [
                {
                    url: `https://seekertracker.com/image/${encodeURIComponent(userDomain)}`,
                    width: 1200,
                    height: 630,
                    alt: `${userDomain} SeekerID Profile`,
                    type: "image/png",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${userDomain} - SeekerID Profile`,
            description: `Complete SeekerID profile with activation details and analytics.`,
            images: [
                `https://seekertracker.com/image/${encodeURIComponent(userDomain)}`
            ],
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


