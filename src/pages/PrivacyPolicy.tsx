import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="container">
            <header className="header" style={{ position: 'relative' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ position: 'absolute', left: '1rem', background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="header-title">Privacy Policy</div>
            </header>

            <div className="card" style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: '1rem' }}><strong>Effective Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>

                <h3 style={{ color: 'var(--text-primary)' }}>1. Introduction</h3>
                <p style={{ marginBottom: '1rem' }}>
                    Welcome to Cricket Scorer. We value your privacy and are committed to protecting your personal information. This Privacy Policy is compliant with the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 of India.
                </p>

                <h3 style={{ color: 'var(--text-primary)' }}>2. Data Collection and Storage</h3>
                <p style={{ marginBottom: '1rem' }}>
                    Cricket Scorer operates entirely on your local device. We do not transfer, transmit, or store your match data, team information, or any other scoring details on external servers. All data is saved strictly within your browser's Local Storage.
                </p>

                <h3 style={{ color: 'var(--text-primary)' }}>3. Personal Data</h3>
                <p style={{ marginBottom: '1rem' }}>
                    We do not collect, process, or sell any personally identifiable information (PII). We do not use trackers to monitor your behavior.
                </p>

                <h3 style={{ color: 'var(--text-primary)' }}>4. Third-Party Services</h3>
                <p style={{ marginBottom: '1rem' }}>
                    Our application is hosted on standard web infrastructure which may record basic network logs such as IP addresses for security and performance analysis. However, the Cricket Scorer app itself integrates no third-party analytics or advertising SDKs that gather your personal data.
                </p>

                <h3 style={{ color: 'var(--text-primary)' }}>5. Your Rights</h3>
                <p style={{ marginBottom: '1rem' }}>
                    Because all data is stored locally on your device, you have full control over it. You can delete all your scoring data at any time by clearing your browser's data or uninstalling the application.
                </p>

                <h3 style={{ color: 'var(--text-primary)' }}>6. Changes to This Policy</h3>
                <p style={{ marginBottom: '1rem' }}>
                    We may update our Privacy Policy from time to time. We advise you to review this page periodically for any changes.
                </p>

                <h3 style={{ color: 'var(--text-primary)' }}>7. Contact Us</h3>
                <p>
                    If you have any questions or suggestions about our Privacy Policy, please contact the developer directly.
                </p>
            </div>
        </div>
    );
}
