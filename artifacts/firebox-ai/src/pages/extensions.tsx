import { useState, useEffect } from "react";
import { Package, Settings, Trash2, ToggleRight, Power, Plus, ExternalLink } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface InstalledExtension {
  id: string;
  extensionId: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  enabled: boolean;
  configuration?: Record<string, any>;
  author: string;
  installedAt: string;
}

export default function ExtensionsPage() {
  const [selectedProject, setSelectedProject] = useState<string>("project-1");
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  // Mock projects
  const mockProjects = [
    { id: "project-1", name: "Firebox AI" },
    { id: "project-2", name: "API Server" },
    { id: "project-3", name: "Mobile App" },
  ];

  // Mock installed extensions
  const mockInstalledExtensions: InstalledExtension[] = [
    {
      id: "inst-1",
      extensionId: "ext-1",
      name: "code-formatter",
      displayName: "Code Formatter",
      description: "Automatically format and lint your code",
      version: "2.1.0",
      enabled: true,
      author: "john.dev",
      installedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      configuration: {
        style: "prettier",
        indent: 2,
        semi: true,
      },
    },
    {
      id: "inst-2",
      extensionId: "ext-4",
      name: "security-scanner",
      displayName: "Security Scanner",
      description: "Scan for security vulnerabilities",
      version: "2.3.0",
      enabled: true,
      author: "bob.dev",
      installedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "inst-3",
      extensionId: "ext-3",
      name: "performance-analyzer",
      displayName: "Performance Analyzer",
      description: "Analyze and optimize performance",
      version: "3.0.1",
      enabled: false,
      author: "alice.dev",
      installedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  useEffect(() => {
    loadProjectExtensions();
  }, [selectedProject]);

  const loadProjectExtensions = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setInstalledExtensions(mockInstalledExtensions);
      setLoading(false);
    }, 300);
  };

  const handleToggleExtension = (extensionId: string) => {
    setInstalledExtensions(
      installedExtensions.map((ext) =>
        ext.id === extensionId ? { ...ext, enabled: !ext.enabled } : ext
      )
    );
  };

  const handleUninstall = (extensionId: string) => {
    setInstalledExtensions(installedExtensions.filter((ext) => ext.id !== extensionId));
  };

  const handleOpenConfig = (extension: InstalledExtension) => {
    setShowConfigModal(extension.id);
    setConfigValues(extension.configuration || {});
  };

  const handleSaveConfig = () => {
    // Update configuration
    setShowConfigModal(null);
  };

  const enabledCount = installedExtensions.filter((ext) => ext.enabled).length;
  const disabledCount = installedExtensions.filter((ext) => !ext.enabled).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Package size={32} />
            Project Extensions
          </h1>
          <p className="text-gray-600">Manage and configure installed extensions</p>
        </div>

        {/* Project Selector */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {mockProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${
                  selectedProject === project.id
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {project.name}
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-xs text-gray-600 mb-1">Total Installed</div>
              <div className="text-2xl font-bold">{installedExtensions.length}</div>
            </Card>
            <Card className="p-4 border-emerald-200 bg-emerald-50">
              <div className="text-xs text-emerald-600 mb-1">✓ Enabled</div>
              <div className="text-2xl font-bold text-emerald-700">{enabledCount}</div>
            </Card>
            <Card className="p-4 border-amber-200 bg-amber-50">
              <div className="text-xs text-amber-600 mb-1">⊘ Disabled</div>
              <div className="text-2xl font-bold text-amber-700">{disabledCount}</div>
            </Card>
            <Card className="p-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus size={16} className="mr-2" />
                Browse More
              </Button>
            </Card>
          </div>
        </div>

        {/* Extensions List */}
        <div className="space-y-4">
          {installedExtensions.length === 0 ? (
            <Card className="p-12 text-center">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-gray-500 mb-4">No extensions installed yet</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={16} className="mr-2" />
                Browse Marketplace
              </Button>
            </Card>
          ) : (
            installedExtensions.map((ext) => (
              <Card
                key={ext.id}
                className={`p-6 border-l-4 transition-all ${
                  ext.enabled ? "border-l-emerald-600 bg-white" : "border-l-gray-300 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{ext.displayName}</h3>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          ext.enabled
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {ext.enabled ? "✓ Active" : "⊘ Inactive"}
                      </span>
                      <span className="inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 font-medium">
                        v{ext.version}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{ext.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>by <strong>{ext.author}</strong></span>
                      <span>Installed {new Date(ext.installedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Toggle Status */}
                    <button
                      onClick={() => handleToggleExtension(ext.id)}
                      className={`p-2 rounded-lg border transition-all ${
                        ext.enabled
                          ? "border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={ext.enabled ? "Disable" : "Enable"}
                    >
                      <ToggleRight size={20} />
                    </button>

                    {/* Settings */}
                    {ext.configuration && Object.keys(ext.configuration).length > 0 && (
                      <button
                        onClick={() => handleOpenConfig(ext)}
                        className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
                        title="Configure"
                      >
                        <Settings size={20} />
                      </button>
                    )}

                    {/* Uninstall */}
                    <button
                      onClick={() => handleUninstall(ext.id)}
                      className="p-2 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-600"
                      title="Uninstall"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Configuration Display */}
                {ext.configuration && Object.keys(ext.configuration).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-semibold mb-2">Current Configuration:</div>
                    <div className="space-y-2">
                      {Object.entries(ext.configuration).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {JSON.stringify(value)}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4">Extension Configuration</h3>
              
              <div className="space-y-4 mb-6">
                {Object.entries(configValues).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) =>
                        setConfigValues({ ...configValues, [key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfigModal(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Save Configuration
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
