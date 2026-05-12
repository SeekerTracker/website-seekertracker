module.exports=[93695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},51380,a=>{a.n(a.i(55237))},39236,a=>{a.n(a.i(86895))},94367,a=>{a.n(a.i(16893))},70864,a=>{a.n(a.i(33290))},65897,a=>{a.n(a.i(96647))},2894,a=>{a.n(a.i(66188))},13718,a=>{a.n(a.i(85523))},18198,a=>{a.n(a.i(45518))},29036,a=>{a.n(a.i(52291))},70892,a=>{a.n(a.i(14575))},15166,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/(pages)/apps/[package]/ClientRedirect.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/(pages)/apps/[package]/ClientRedirect.tsx <module evaluation>","default");a.s(["default",0,b])},70601,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/(pages)/apps/[package]/ClientRedirect.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/(pages)/apps/[package]/ClientRedirect.tsx","default");a.s(["default",0,b])},31591,a=>{"use strict";a.i(15166);var b=a.i(70601);a.n(b)},3435,a=>{"use strict";var b=a.i(7997),c=a.i(31591);let d={locale:"en-US",platformSdk:34,pixelDensity:480,model:"SEEKER"};async function e(a){try{let b=`
            query DAppByPackage($systemContext: SystemContext!, $androidPackage: String!) {
                dAppByAndroidPackage(systemContext: $systemContext, androidPackage: $androidPackage) {
                    androidPackage
                    rating {
                        rating
                    }
                    lastRelease(systemContext: $systemContext) {
                        displayName
                        subtitle
                        description
                        icon {
                            uri
                        }
                    }
                }
            }
        `,c=await fetch("https://dappstore.solanamobile.com/graphql",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:b,variables:{systemContext:d,androidPackage:a}}),next:{revalidate:3600}}),e=await c.json();return e.data?.dAppByAndroidPackage}catch{return null}}async function f({params:a}){let{package:b}=await a,c=decodeURIComponent(b),d=await e(c);if(!d)return{title:"App Not Found | Seeker dApp Store"};let f=d.lastRelease,g=`${f?.displayName||c} | Seeker dApp Store`,h=f?.subtitle||f?.description?.slice(0,160)||"Discover this app on Seeker dApp Store",i=`https://seekertracker.com/api/apps/og?app=${encodeURIComponent(c)}`;return{title:g,description:h,openGraph:{title:f?.displayName||c,description:h,images:[{url:i,width:1200,height:630,alt:f?.displayName||c}],type:"website",siteName:"SeekerTracker"},twitter:{card:"summary_large_image",title:f?.displayName||c,description:h,images:[i],creator:"@seeker_tracker"}}}async function g({params:a}){let{package:d}=await a;return(0,b.jsx)(c.default,{url:`/apps?app=${encodeURIComponent(d)}`})}a.s(["default",()=>g,"generateMetadata",()=>f])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__48fd31c7._.js.map