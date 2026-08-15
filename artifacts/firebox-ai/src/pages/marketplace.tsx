import { useState, useEffect } from "react";
import { Search, Star, Download, Tag, Settings, Plus, Zap } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface Extension {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  author: string;
  version: string;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  icon?: string;
  tags?: string[];
  isFeatured?: boolean;
  isVerified?: boolean;
}

export default function MarketplacePage() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [featured, setFeatured] = useState<Extension[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Mock extension data
  const mockExtensions: Extension[] = [
    {
      id: "ext-1",
      name: "code-formatter",
      displayName: "Code Formatter",
      description: "Automatically format and lint your code with configurable rules",
      category: "utilities",
      author: "john.dev",
      version: "2.1.0",
      rating: 4.8,
      ratingCount: 324,
      downloadCount: 12450,
      tags: ["formatting", "linting", "style"],
      isFeatured: true,
      isVerified: true,
    },
    {
      id: "ext-2",
      name: "api-docs-generator",
      displayName: "API Docs Generator",
      description: "Generate beautiful API documentation from code comments",
      category: "documentation",
      author: "jane.dev",
      version: "1.5.3",
      rating: 4.6,
      ratingCount: 187,
      downloadCount: 8920,
      tags: ["documentation", "api", "openapi"],
      isFeatured: true,
      isVerified: true,
    },
    {
      id: "ext-3",
      name: "performance-analyzer",
      displayName: "Performance Analyzer",
      description: "Analyze and optimize your application performance",
      category: "performance",
      author: "alice.dev",
      version: "3.0.1",
      rating: 4.7,
      ratingCount: 456,
      downloadCount: 15230,
      tags: ["performance", "metrics", "profiling"],
      isFeatured: true,
      isVerified: true,
    },
    {
      id: "ext-4",
      name: "security-scanner",
      displayName: "Security Scanner",
      description: "Scan for security vulnerabilities and code issues",
      category: "security",
      author: "bob.dev",
      version: "2.3.0",
      rating: 4.9,
      ratingCount: 523,
      downloadCount: 18900,
      tags: ["security", "scanning", "vulnerabilities"],
      isVerified: true,
    },
    {
      id: "ext-5",
      name: "test-generator",
      displayName: "Test Generator",
      description: "Automatically generate unit and integration tests",
      category: "testing",
      author: "carol.dev",
      version: "1.8.2",
      rating: 4.5,
      ratingCount: 298,
      downloadCount: 9876,
      tags: ["testing", "jest", "unit-tests"],
      isFeatured: true,
    },
    {
      id: "ext-6",
      name: "design-system",
      displayName: "Design System",
      description: "Complete design system with pre-built components",
      category: "styling",
      author: "dave.dev",
      version: "2.0.0",
      rating: 4.7,
      ratingCount: 412,
      downloadCount: 14320,
      tags: ["design", "components", "ui"],
      isVerified: true,
    },
  ];

  const categories = [
    "all",
    "utilities",
    "documentation",
    "testing",
    "deployment",
    "monitoring",
    "security",
    "performance",
    "styling",
  ];

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setExtensions(mockExtensions);
      setFeatured(mockExtensions.filter((e) => e.isFeatured));
      setStats({
        totalExtensions: 247,
        publishedExtensions: 231,
        verifiedExtensions: 89,
        totalDownloads: 1247500,
        avgRating: "4.6",
      });
      setLoading(false);
    }, 500);
  };

  const filteredExtensions = extensions.filter((ext) => {
    const matchesCategory = selectedCategory === "all" || ext.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.author.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      "code-generation": "🔨",
      documentation: "📚",
      testing: "✅",
      deployment: "🚀",
      monitoring: "📊",
      security: "🔒",
      performance: "⚡",
      styling: "🎨",
      utilities: "🛠️",
    };
    return icons[category] || "📦";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Zap size={32} />
            Extension Marketplace
          </h1>
          <p className="text-gray-600">Discover and install extensions to enhance your projects</p>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            <Card className="p-4">
              <div className="text-xs text-gray-600 mb-1">Total Extensions</div>
              <div className="text-2xl font-bold">{stats.totalExtensions}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-600 mb-1">Published</div>
              <div className="text-2xl font-bold">{stats.publishedExtensions}</div>
            </Card>
            <Card className="p-4 border-emerald-200 bg-emerald-50">
              <div className="text-xs text-emerald-600 mb-1">✓ Verified</div>
              <div className="text-2xl font-bold text-emerald-700">{stats.verifiedExtensions}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-600 mb-1">Avg Rating</div>
              <div className="text-2xl font-bold">{stats.avgRating} ⭐</div>
            </Card>
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="text-xs text-blue-600 mb-1">Total Downloads</div>
              <div className="text-lg font-bold text-blue-700">
                {(stats.totalDownloads / 1000000).toFixed(1)}M
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search extensions by name, description, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                  selectedCategory === category
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        {featured.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              ⭐ Featured Extensions
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {featured.map((ext) => (
                <Card key={ext.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{ext.displayName}</h3>
                      {ext.isVerified && (
                        <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <span className="text-2xl">{getCategoryIcon(ext.category)}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{ext.description}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{ext.rating}</span>
                        <span className="text-gray-500">({ext.ratingCount})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Downloads</span>
                      <span className="font-semibold flex items-center gap-1">
                        <Download size={14} />
                        {(ext.downloadCount / 1000).toFixed(1)}K
                      </span>
                    </div>
                  </div>

                  {ext.tags && ext.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {ext.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-gray-600">v{ext.version}</span>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-sm h-8">
                      <Plus size={14} className="mr-1" />
                      Install
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Extensions Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            All Extensions {searchQuery && `(${filteredExtensions.length} results)`}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {filteredExtensions.map((ext) => (
              <Card key={ext.id} className="p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{ext.displayName}</h3>
                    <p className="text-xs text-gray-500">by {ext.author}</p>
                  </div>
                  <span className="text-xl">{getCategoryIcon(ext.category)}</span>
                </div>

                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{ext.description}</p>

                <div className="space-y-1 mb-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-semibold flex items-center gap-0.5">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      {ext.rating} ({ext.ratingCount})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Downloads</span>
                    <span className="font-semibold">{(ext.downloadCount / 1000).toFixed(0)}K</span>
                  </div>
                </div>

                {ext.tags && ext.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {ext.tags.slice(0, 2).map((tag) => (
                      <Tag
                        key={tag}
                        size={10}
                        className="inline-block text-gray-500"
                      />
                    ))}
                    {ext.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{ext.tags.length - 2}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-gray-600">v{ext.version}</span>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-xs h-7">
                    <Plus size={12} className="mr-1" />
                    Install
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredExtensions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No extensions found</p>
              <Button onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
