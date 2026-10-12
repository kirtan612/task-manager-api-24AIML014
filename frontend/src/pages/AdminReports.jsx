import { useState, useEffect, useCallback, Suspense } from 'react';
import { getAdminReports, sendAdminReportEmail } from '../api';
import { lazyWithMinDelay } from '../utils/lazyWithMinDelay';
import LoadingFallback from '../components/LoadingFallback';

// Supplementary Problem: Lazy load a heavy third-party component (Recharts) with minimum-delay fallback (300ms)
const TaskAnalyticsChart = lazyWithMinDelay(
    () => import('../components/TaskAnalyticsChart'),
    300
);

export default function AdminReports({ addToast }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportResult, setReportResult] = useState(null);
    const [presetActive, setPresetActive] = useState('all');
    const [recipient, setRecipient] = useState('kirtanjogani612@gmail.com');
    const [emailLoading, setEmailLoading] = useState(false);
    const [showVisualChart, setShowVisualChart] = useState(true);

    const handleGenerate = useCallback(async (start = startDate, end = endDate) => {
        setLoading(true);
        try {
            const res = await getAdminReports(start, end);
            setReportResult(res);
        } catch (err) {
            if (addToast) addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, addToast]);

    useEffect(() => {
        handleGenerate('', '');
    }, [handleGenerate]);

    const setDatePreset = (preset) => {
        setPresetActive(preset);
        const now = new Date();
        let start = '';
        let end = now.toISOString().split('T')[0];

        if (preset === 'today') {
            start = end;
        } else if (preset === '7days') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            start = d.toISOString().split('T')[0];
        } else if (preset === '30days') {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            start = d.toISOString().split('T')[0];
        } else if (preset === 'all') {
            start = '';
            end = '';
        }

        setStartDate(start);
        setEndDate(end);
        handleGenerate(start, end);
    };

    const handleSendEmail = async () => {
        if (!recipient) {
            if (addToast) addToast('Please enter recipient email', 'error');
            return;
        }
        setEmailLoading(true);
        try {
            await sendAdminReportEmail(recipient, startDate, endDate);
            if (addToast) addToast(`Report successfully dispatched to ${recipient}`);
        } catch (err) {
            if (addToast) addToast(err.message || 'Failed to dispatch report email', 'error');
        } finally {
            setEmailLoading(false);
        }
    };

    const exportCsv = () => {
        if (!reportResult?.data || reportResult.data.length === 0) {
            if (addToast) addToast('No tasks to export in the selected range', 'error');
            return;
        }
        const headers = ['Title', 'Description', 'Priority', 'Status', 'Created At'];
        const rows = reportResult.data.map((t) => [
            `"${(t.title || '').replace(/"/g, '""')}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            t.priority,
            t.completed ? 'Completed' : 'Ongoing',
            new Date(t.createdAt).toLocaleString(),
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `slate_report_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (addToast) addToast('CSV export generated successfully');
    };

    return (
        <div>
            <div className="slate-banner-card">
                <div>
                    <h2 className="headline-md">Audit &amp; Date Range Reports</h2>
                    <p className="body-md">Query, analyze, and export task telemetry for any custom calendar window.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="lazy-chunk-indicator">📦 Dynamic Chunk: AdminReports.chunk.js</span>
                    {reportResult?.data?.length > 0 && (
                        <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
                            📥 Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Email Dispatch Box */}
            <div className="email-dispatch-box">
                <div className="email-dispatch-info">
                    <div className="email-icon-circle">✉</div>
                    <div>
                        <div className="email-title-text">Send Report via Nodemailer Gateway</div>
                        <div className="email-desc-text">
                            Dispatched to: <strong>{recipient}</strong>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="email"
                        style={{ width: '240px', padding: '6px 10px', fontSize: '13px' }}
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="recipient@example.com"
                    />
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSendEmail}
                        disabled={emailLoading}
                    >
                        {emailLoading ? 'Dispatching...' : '📧 Send Email'}
                    </button>
                </div>
            </div>

            {/* Date Filter Card */}
            <div className="slate-card">
                <div className="slate-card-header">
                    <div className="slate-card-title">Filter by Calendar Window</div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowVisualChart(!showVisualChart)}
                    >
                        {showVisualChart ? 'Hide Analytics Visuals' : 'Show Analytics Visuals'}
                    </button>
                </div>

                <form
                    className="report-action-panel"
                    onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
                >
                    <div className="report-date-field">
                        <label htmlFor="report-start">Start Date</label>
                        <input
                            id="report-start"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="report-date-field">
                        <label htmlFor="report-end">End Date</label>
                        <input
                            id="report-end"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Filtering...' : 'Apply Date Filter'}
                    </button>
                </form>

                <div className="presets-wrap">
                    <span className="label-sm">Presets:</span>
                    <button
                        type="button"
                        className={`btn-preset-pill ${presetActive === 'today' ? 'active' : ''}`}
                        onClick={() => setDatePreset('today')}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        className={`btn-preset-pill ${presetActive === '7days' ? 'active' : ''}`}
                        onClick={() => setDatePreset('7days')}
                    >
                        Last 7 Days
                    </button>
                    <button
                        type="button"
                        className={`btn-preset-pill ${presetActive === '30days' ? 'active' : ''}`}
                        onClick={() => setDatePreset('30days')}
                    >
                        Last 30 Days
                    </button>
                    <button
                        type="button"
                        className={`btn-preset-pill ${presetActive === 'all' ? 'active' : ''}`}
                        onClick={() => setDatePreset('all')}
                    >
                        All Time
                    </button>
                </div>

                {reportResult && (
                    <>
                        <div className="kpi-grid" style={{ marginTop: '16px' }}>
                            <div className="kpi-box">
                                <div>
                                    <div className="kpi-val">{reportResult.summary.totalTasks}</div>
                                    <div className="kpi-lbl">Tasks in Range</div>
                                </div>
                            </div>
                            <div className="kpi-box">
                                <div>
                                    <div className="kpi-val" style={{ color: 'var(--color-success)' }}>
                                        {reportResult.summary.completedTasks}
                                    </div>
                                    <div className="kpi-lbl">Completed</div>
                                </div>
                            </div>
                            <div className="kpi-box">
                                <div>
                                    <div className="kpi-val" style={{ color: 'var(--color-warning)' }}>
                                        {reportResult.summary.pendingTasks}
                                    </div>
                                    <div className="kpi-lbl">Ongoing</div>
                                </div>
                            </div>
                            <div className="kpi-box">
                                <div>
                                    <div className="kpi-val">{reportResult.summary.completionRate}%</div>
                                    <div className="kpi-lbl">Completion Rate</div>
                                </div>
                            </div>
                        </div>

                        {/* Supplementary Problem: Lazy loaded heavy chart library with 300ms min delay fallback */}
                        {showVisualChart && (
                            <Suspense fallback={<LoadingFallback message="Loading heavy Recharts visual telemetry..." />}>
                                <TaskAnalyticsChart tasks={reportResult.data || []} />
                            </Suspense>
                        )}

                        <div className="table-container" style={{ marginTop: '16px' }}>
                            <table className="slate-table">
                                <thead>
                                    <tr>
                                        <th>Task Title</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Creation Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportResult.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-outline)' }}>
                                                No tasks found for the selected date range.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportResult.data.map((task) => (
                                            <tr key={task._id}>
                                                <td style={{ fontWeight: 600 }}>{task.title}</td>
                                                <td>
                                                    <span className={`slate-chip chip-${task.priority}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td>
                                                    {task.completed ? (
                                                        <span className="slate-chip chip-completed">✓ Completed</span>
                                                    ) : (
                                                        <span className="slate-chip chip-ongoing">⏳ Ongoing</span>
                                                    )}
                                                </td>
                                                <td style={{ color: 'var(--color-secondary)' }}>
                                                    {new Date(task.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
