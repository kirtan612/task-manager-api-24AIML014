import { useState } from 'react';

export default function Contact({ addToast }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('Technical Support');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
            if (addToast) {
                addToast('Your inquiry has been queued and sent to administrative dispatch.');
            }
        }, 800);
    };

    return (
        <div>
            <div className="slate-banner-card">
                <div>
                    <h2 className="headline-md">Enterprise Support &amp; Contact Desk</h2>
                    <p className="body-md">
                        Direct communication channel to the engineering governance and administrator team.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="lazy-chunk-indicator">📦 Dynamic Chunk: Contact.chunk.js</span>
                    <span className="smtp-status-chip">
                        <span className="status-dot-active"></span>
                        <span>SMTP Dispatch Active</span>
                    </span>
                </div>
            </div>

            <div className="contact-layout-duo">
                {/* Contact Form Card */}
                <div className="slate-card">
                    <div className="slate-card-header">
                        <div>
                            <div className="slate-card-title">Submit Administrative Ticket</div>
                            <div className="slate-card-subtitle">
                                All inquiries are routed to kirtanjogani612@gmail.com with high priority.
                            </div>
                        </div>
                    </div>

                    {submitted ? (
                        <div className="alert-success" style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                            <h3 className="headline-md" style={{ fontSize: '18px', marginBottom: '6px' }}>Message Transmitted</h3>
                            <p className="body-md" style={{ marginBottom: '14px' }}>
                                Thank you, {name || 'User'}. Our operations team has received your ticket and will follow up within 2 hours.
                            </p>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                    setSubmitted(false);
                                    setName('');
                                    setEmail('');
                                    setMessage('');
                                }}
                            >
                                Submit Another Ticket
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Your Name</label>
                                    <input
                                        placeholder="Kirtan Jogani"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Category</label>
                                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                                    <option value="Technical Support">Technical Support &amp; Bug Report</option>
                                    <option value="Role Escalation">Role Escalation / Admin Access Request</option>
                                    <option value="Audit Report Inquiry">Audit &amp; Telemetry Report Assistance</option>
                                    <option value="Feature Feedback">Feature Request / Architectural Feedback</option>
                                </select>
                            </div>

                            <div>
                                <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Message Description</label>
                                <textarea
                                    rows={4}
                                    placeholder="Provide detailed description of your request or issue..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                />
                            </div>

                            <button className="btn btn-primary" type="submit" disabled={submitting}>
                                {submitting ? 'Transmitting Ticket...' : 'Dispatch Inquiry'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Operations Info Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="slate-card">
                        <div className="slate-card-title" style={{ marginBottom: '10px' }}>
                            Executive Contacts
                        </div>
                        <div className="contact-info-list">
                            <div className="contact-info-item">
                                <span className="contact-icon">👑</span>
                                <div>
                                    <div className="contact-item-title">System Administrator</div>
                                    <div className="contact-item-val">kirtanjogani612@gmail.com</div>
                                </div>
                            </div>
                            <div className="contact-info-item">
                                <span className="contact-icon">✉</span>
                                <div>
                                    <div className="contact-item-title">SMTP Gateway Node</div>
                                    <div className="contact-item-val">avenixfintech13@gmail.com</div>
                                </div>
                            </div>
                            <div className="contact-info-item">
                                <span className="contact-icon">📍</span>
                                <div>
                                    <div className="contact-item-title">Workspace Tier</div>
                                    <div className="contact-item-val">Enterprise Cluster (Local Node :5000)</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="slate-card">
                        <div className="slate-card-title" style={{ marginBottom: '8px' }}>
                            Response Service Level Agreement (SLA)
                        </div>
                        <p className="body-sm" style={{ marginBottom: '8px' }}>
                            <strong>P1 Critical Incidents:</strong> &lt; 30 Minutes
                        </p>
                        <p className="body-sm" style={{ marginBottom: '8px' }}>
                            <strong>P2 Account Permissions:</strong> &lt; 2 Hours
                        </p>
                        <p className="body-sm">
                            <strong>Standard Queries:</strong> Same Business Day
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
