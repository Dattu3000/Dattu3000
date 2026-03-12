import React from 'react';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'amp-ad': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                width?: string | number;
                height?: string | number;
                type?: string;
                'data-ad-client'?: string;
                'data-ad-slot'?: string;
                'data-auto-format'?: string;
                'data-full-width'?: string;
            };
        }
    }
}

interface AdBannerProps {
    dataAdSlot?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ dataAdSlot = '8869375429' }) => {
    return (
        <div style={{ margin: '1.5rem auto', textAlign: 'center', minHeight: '320px', display: 'flex', justifyContent: 'center' }}>
            <amp-ad
                width="100vw"
                height="320"
                type="adsense"
                data-ad-client="ca-pub-6439608816817843"
                data-ad-slot={dataAdSlot}
                data-auto-format="rspv"
                data-full-width=""
            >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <div {...{ overflow: '' } as any}></div>
            </amp-ad>
        </div>
    );
};
