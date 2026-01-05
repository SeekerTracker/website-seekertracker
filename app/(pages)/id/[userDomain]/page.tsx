import React from 'react'
import UserDomain from './userDomain';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getSeekerMetadata } from 'app/(utils)/metadata';

export async function generateMetadata(
    {
        params,
    }: {
        params: Promise<{ userDomain: string }>;
    }): Promise<Metadata> {
    const { userDomain } = await params;

    const headersList = await headers();
    const host = headersList.get('host');
    const protocol =
        headersList.get('x-forwarded-proto') || 'https'; // handles Vercel or proxies
    const webDomain = `${protocol}://${host}`;

    const meta = getSeekerMetadata(userDomain, webDomain);

    return {
        applicationName: "Seeker",
        title: meta.title,
        description: meta.description,
        openGraph: {
            type: "website",
            title: meta.title,
            description: meta.ogDescription,
            url: meta.profileUrl,
            siteName: meta.siteName,
            images: [
                {
                    url: meta.imageUrl,
                    width: meta.imageWidth,
                    height: meta.imageHeight,
                    alt: `${userDomain} SeekerID Profile`,
                    type: "image/png",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: meta.title,
            description: meta.description,
            images: [meta.imageUrl],
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
        return notFound();
    }



    return (

        <>
            <UserDomain userDomain={userDomain} />
        </>
    )
}

export default Page


