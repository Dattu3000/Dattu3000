import React from 'react';

interface AdBannerProps {
    dataAdSlot?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ dataAdSlot = '8869375429' }) => {
    return (
        <div style={{ margin: '1.5rem auto', textAlign: 'center', minHeight: '320px', display: 'flex', justifyContent: 'center' }}>
            {React.createElement('amp-ad', {
                width: "100vw",
                height: "320",
                type: "adsense",
                'data-ad-client': "ca-pub-6439608816817843",
                'data-ad-slot': dataAdSlot,
                'data-auto-format': "rspv",
                'data-full-width': ""
            },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                React.createElement('div', { overflow: '' } as any)
            )}
        </div>
    );
};
