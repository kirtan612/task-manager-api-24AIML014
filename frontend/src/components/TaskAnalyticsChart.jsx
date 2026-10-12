import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const COLORS = ['#1d2b3e', '#137333', '#b06000', '#ba1a1a'];

export default function TaskAnalyticsChart({ tasks = [] }) {
    // Priority breakdown
    const priorityCounts = { low: 0, medium: 0, high: 0 };
    let completedCount = 0;
    let ongoingCount = 0;

    tasks.forEach((t) => {
        if (priorityCounts[t.priority] !== undefined) {
            priorityCounts[t.priority] += 1;
        }
        if (t.completed) completedCount += 1;
        else ongoingCount += 1;
    });

    const priorityData = [
        { name: 'Low Priority', count: priorityCounts.low },
        { name: 'Medium Priority', count: priorityCounts.medium },
        { name: 'High Priority', count: priorityCounts.high },
    ];

    const statusData = [
        { name: 'Completed', value: completedCount, color: '#137333' },
        { name: 'Ongoing', value: ongoingCount, color: '#b06000' },
    ];

    return (
        <div className="heavy-chart-container">
            <div className="chart-banner-info">
                <span className="heavy-chip">⚡ Heavy Third-Party Chunk (Recharts)</span>
                <span className="heavy-note">Code-split via React.lazy() &amp; dynamic import()</span>
            </div>

            <div className="charts-grid-duo">
                <div className="chart-card">
                    <h4 className="chart-title">Tasks by Priority Distribution</h4>
                    <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e9ed" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#44474c' }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#44474c' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #dfe3e7',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }}
                                />
                                <Bar dataKey="count" fill="#1d2b3e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h4 className="chart-title">Task Completion Ratio</h4>
                    <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #dfe3e7',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
