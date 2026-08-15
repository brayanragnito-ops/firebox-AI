import { useState, useEffect } from "react";
import { Activity, AlertTriangle, TrendingUp, Server, Clock, Zap } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface MetricData {
  cpuUsage?: number;
  memoryUsage?: number;
  latency?: number;
  requestsPerSecond?: number;
  errorRate?: number;
  uptime?: number;
  timestamp?: string;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "critical";
  uptime: number;
  errorCount: number;
  lastCheck: string;
  latestMetric?: MetricData;
  averageMetrics?: MetricData;
  unresolvedErrors?: Array<any>;
}

export default function MonitoringPage() {
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock deployments
  const mockDeployments = [
    { id: "deploy-1", name: "Summit Commerce", provider: "Vercel", status: "live" },
    { id: "deploy-2", name: "Orbit Analytics", provider: "Railway", status: "live" },
    { id: "deploy-3", name: "Atlas API", provider: "AWS", status: "building" },
  ];

  const loadDeploymentHealth = async (deploymentId: string) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setHealth({
        status: Math.random() > 0.3 ? "healthy" : "degraded",
        uptime: Math.random() * 30 + 70,
        errorCount: Math.floor(Math.random() * 5),
        lastCheck: new Date().toISOString(),
        latestMetric: {
          cpuUsage: Math.random() * 80,
          memoryUsage: Math.random() * 70,
          latency: Math.random() * 200 + 50,
          requestsPerSecond: Math.random() * 500 + 100,
          errorRate: Math.random() * 5,
          uptime: Math.random() * 30 + 70,
        },
        averageMetrics: {
          cpuUsage: Math.random() * 60,
          memoryUsage: Math.random() * 50,
          latency: Math.random() * 150 + 50,
          requestsPerSecond: Math.random() * 400 + 100,
          errorRate: Math.random() * 3,
          uptime: Math.random() * 20 + 80,
        },
      });

      // Generate mock metrics timeline
      const mockMetrics = Array.from({ length: 20 }, (_, i) => ({
        cpuUsage: Math.random() * 80,
        memoryUsage: Math.random() * 70,
        latency: Math.random() * 200 + 50,
        requestsPerSecond: Math.random() * 500 + 100,
        errorRate: Math.random() * 5,
        uptime: Math.random() * 30 + 70,
        timestamp: new Date(Date.now() - (20 - i) * 60000).toISOString(),
      }));
      setMetrics(mockMetrics);

      // Generate mock errors
      const mockErrors = [
        {
          id: "err-1",
          errorType: "NetworkError",
          message: "Connection timeout after 30s",
          count: 12,
          resolved: false,
        },
        {
          id: "err-2",
          errorType: "DatabaseError",
          message: "Query execution timeout",
          count: 5,
          resolved: false,
        },
        {
          id: "err-3",
          errorType: "TypeError",
          message: "Cannot read property of undefined",
          count: 3,
          resolved: true,
        },
      ];
      setErrors(mockErrors);

      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    if (selectedDeployment) {
      loadDeploymentHealth(selectedDeployment);
    }
  }, [selectedDeployment]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-emerald-600 bg-emerald-50";
      case "degraded":
        return "text-amber-600 bg-amber-50";
      case "critical":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Activity size={32} />
            Monitoring & Analytics
          </h1>
          <p className="text-gray-600">Track deployment health and performance metrics</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {mockDeployments.map((deployment) => (
            <button
              key={deployment.id}
              onClick={() => setSelectedDeployment(deployment.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedDeployment === deployment.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-sm mb-1">{deployment.name}</div>
              <div className="text-xs text-gray-600">{deployment.provider}</div>
              <div
                className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${
                  deployment.status === "live"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {deployment.status}
              </div>
            </button>
          ))}
        </div>

        {selectedDeployment && health ? (
          <div className="space-y-6">
            {/* Health Summary */}
            <div className={`rounded-lg p-6 ${getStatusColor(health.status)}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Deployment Health</h2>
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {health.status}
                </span>
              </div>
              <p className="text-sm mb-4">Last checked: {new Date(health.lastCheck).toLocaleTimeString()}</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">{health.uptime.toFixed(1)}%</div>
                  <div className="text-sm opacity-75">Uptime (24h)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{health.errorCount}</div>
                  <div className="text-sm opacity-75">Unresolved Errors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {health.latestMetric?.latency?.toFixed(0) || 0}ms
                  </div>
                  <div className="text-sm opacity-75">Avg Latency</div>
                </div>
              </div>
            </div>

            {/* Real-time Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* CPU & Memory */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Zap size={18} />
                  Resource Usage
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">CPU</span>
                      <span className="text-sm font-bold">
                        {health.latestMetric?.cpuUsage?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(health.latestMetric?.cpuUsage || 0) * 1}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Memory</span>
                      <span className="text-sm font-bold">
                        {health.latestMetric?.memoryUsage?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(health.latestMetric?.memoryUsage || 0) * 1}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Traffic & Error Rate */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} />
                  Traffic Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Requests/sec</div>
                    <div className="text-2xl font-bold">
                      {health.latestMetric?.requestsPerSecond?.toFixed(0) || 0}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm font-bold">
                        {health.latestMetric?.errorRate?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${(health.latestMetric?.errorRate || 0) * 20}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Tracking */}
            {errors.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Recent Errors ({errors.length})
                </h3>
                <div className="space-y-3">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className={`p-3 rounded-lg border ${
                        error.resolved
                          ? "bg-gray-50 border-gray-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{error.errorType}</div>
                          <div className="text-xs text-gray-600 mt-1">{error.message}</div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm font-bold">{error.count}x</div>
                          <div className="text-xs text-gray-500">occurrences</div>
                        </div>
                      </div>
                      {!error.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-xs"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Timeline */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Clock size={18} />
                Metrics Timeline (Last 20 minutes)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Time</th>
                      <th className="text-right py-2 px-3">CPU</th>
                      <th className="text-right py-2 px-3">Memory</th>
                      <th className="text-right py-2 px-3">Latency</th>
                      <th className="text-right py-2 px-3">RPS</th>
                      <th className="text-right py-2 px-3">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-600">
                          {new Date(metric.timestamp!).toLocaleTimeString()}
                        </td>
                        <td className="text-right py-2 px-3">
                          {metric.cpuUsage?.toFixed(1)}%
                        </td>
                        <td className="text-right py-2 px-3">
                          {metric.memoryUsage?.toFixed(1)}%
                        </td>
                        <td className="text-right py-2 px-3">
                          {metric.latency?.toFixed(0)}ms
                        </td>
                        <td className="text-right py-2 px-3">
                          {metric.requestsPerSecond?.toFixed(0)}
                        </td>
                        <td className="text-right py-2 px-3">
                          {metric.errorRate?.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            <Server size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a deployment to view monitoring data</p>
          </div>
        )}
      </div>
    </div>
  );
}
