import React, { useEffect } from 'react';

interface AdBannerProps {
    dataAdSlot?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ dataAdSlot = '1234567890' }) => {
    useEffect(() => {
        try {
            // Push the ad to be populated by the Google AdSense script
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error('Failed to load ad', err);
        }
    }, []);

    return (
        <div style={{ margin: '1.5rem auto', textAlign: 'center', minHeight: '50px', display: 'flex', justifyContent: 'center' }}>
            <ins className="adsbygoogle"
                style={{ display: 'block', width: '100%', maxWidth: '320px', height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                data-ad-client="ca-pub-xxxxxxxxxxxxxxxx" // REPLACE WITH YOUR PUBLISHER ID
                data-ad-slot={dataAdSlot}                // REPLACE WITH YOUR AD SLOT ID
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
        </div>
    );
};
