/**
 * Project Analyzer Service
 * Detects project framework, runtime, build tools, and commands
 */

export interface ProjectAnalysis {
  language: string;
  framework: string;
  runtime: string;
  packageManager: string;
  buildTool: string;
  devCommand: string;
  buildCommand: string;
  confidence: number;
  structure: string[];
  database?: string | null;
}

export interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Analyze a project by examining its files
 * In a real implementation, this would scan the actual filesystem
 * For now, it uses heuristics based on the project data provided
 */
export function analyzeProject(
  projectName: string,
  projectDescription: string | null | undefined,
  packageJsonContent?: string
): ProjectAnalysis {
  const analysis: ProjectAnalysis = {
    language: "Unknown",
    framework: "Unknown",
    runtime: "Unknown",
    packageManager: "npm",
    buildTool: "Unknown",
    devCommand: "npm run dev",
    buildCommand: "npm run build",
    confidence: 40,
    structure: ["src/", "package.json"],
    database: null,
  };

  // Parse package.json if provided
  let packageJson: PackageJson | null = null;
  if (packageJsonContent) {
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch {
      // Invalid JSON, continue with defaults
    }
  }

  // Detect by framework keywords in dependencies
  const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
  const depNames = Object.keys(deps || {});

  // Detect language and framework from dependencies
  if (depNames.includes("next")) {
    analysis.framework = "Next.js";
    analysis.language = "TypeScript";
    analysis.runtime = "Node.js 20";
    analysis.buildTool = "Turbopack";
    analysis.confidence = 95;
  } else if (depNames.includes("react")) {
    if (depNames.includes("vite")) {
      analysis.framework = "React + Vite";
      analysis.buildTool = "Vite";
      analysis.confidence = 92;
    } else if (depNames.includes("webpack")) {
      analysis.framework = "React + Webpack";
      analysis.buildTool = "Webpack";
      analysis.confidence = 88;
    } else {
      analysis.framework = "React";
      analysis.buildTool = "Unknown";
      analysis.confidence = 85;
    }
    analysis.language = "TypeScript";
    analysis.runtime = "Node.js 20";
  } else if (depNames.includes("svelte")) {
    analysis.framework = "SvelteKit";
    analysis.language = "TypeScript";
    analysis.runtime = "Node.js 20";
    analysis.buildTool = "Vite";
    analysis.confidence = 90;
  } else if (depNames.includes("vue")) {
    analysis.framework = "Vue";
    analysis.language = "TypeScript";
    analysis.runtime = "Node.js 20";
    if (depNames.includes("vite")) {
      analysis.buildTool = "Vite";
    }
    analysis.confidence = 88;
  } else if (depNames.includes("fastapi")) {
    analysis.language = "Python";
    analysis.framework = "FastAPI";
    analysis.runtime = "Python 3.12";
    analysis.packageManager = "pip";
    analysis.buildTool = "uvicorn";
    analysis.devCommand = "uvicorn main:app --reload";
    analysis.buildCommand = "python -m compileall .";
    analysis.confidence = 94;
  } else if (depNames.includes("django")) {
    analysis.language = "Python";
    analysis.framework = "Django";
    analysis.runtime = "Python 3.12";
    analysis.packageManager = "pip";
    analysis.buildTool = "Django";
    analysis.devCommand = "python manage.py runserver";
    analysis.buildCommand = "python manage.py collectstatic";
    analysis.confidence = 92;
  } else if (depNames.includes("express")) {
    analysis.framework = "Express";
    analysis.language = "TypeScript";
    analysis.runtime = "Node.js 20";
    analysis.buildTool = "esbuild";
    analysis.confidence = 90;
  } else if (depNames.includes("@nestjs/core")) {
    analysis.framework = "NestJS";
    analysis.language = "TypeScript";
    analysis.runtime = "Node.js 20";
    analysis.buildTool = "tsc";
    analysis.confidence = 93;
  }

  // Detect package manager
  if (depNames.length > 0) {
    if (packageJsonContent?.includes("pnpm")) {
      analysis.packageManager = "pnpm";
    } else if (packageJsonContent?.includes("yarn")) {
      analysis.packageManager = "yarn";
    } else if (packageJsonContent?.includes("npm")) {
      analysis.packageManager = "npm";
    }
  }

  // Extract commands from package.json scripts
  if (packageJson?.scripts) {
    if (packageJson.scripts.dev) {
      analysis.devCommand = packageJson.scripts.dev;
    }
    if (packageJson.scripts.build) {
      analysis.buildCommand = packageJson.scripts.build;
    }
    if (packageJson.scripts.start && !analysis.devCommand.includes("dev")) {
      analysis.devCommand = packageJson.scripts.start;
    }
  }

  // Default to prompt-based detection if no strong signals
  if (analysis.confidence < 50) {
    if (projectDescription?.toLowerCase().includes("react")) {
      analysis.framework = "React + Vite";
      analysis.language = "TypeScript";
      analysis.runtime = "Node.js 20";
      analysis.buildTool = "Vite";
      analysis.confidence = 60;
    } else if (projectDescription?.toLowerCase().includes("next")) {
      analysis.framework = "Next.js";
      analysis.language = "TypeScript";
      analysis.runtime = "Node.js 20";
      analysis.buildTool = "Turbopack";
      analysis.confidence = 65;
    } else if (projectDescription?.toLowerCase().includes("python")) {
      analysis.language = "Python";
      analysis.framework = "FastAPI";
      analysis.runtime = "Python 3.12";
      analysis.packageManager = "pip";
      analysis.buildTool = "uvicorn";
      analysis.confidence = 55;
    } else if (projectDescription?.toLowerCase().includes("api") || projectDescription?.toLowerCase().includes("backend")) {
      analysis.framework = "Express";
      analysis.language = "TypeScript";
      analysis.runtime = "Node.js 20";
      analysis.buildTool = "esbuild";
      analysis.confidence = 50;
    } else {
      // Default for unknown projects
      analysis.framework = "React + Vite";
      analysis.language = "TypeScript";
      analysis.runtime = "Node.js 20";
      analysis.buildTool = "Vite";
      analysis.confidence = 40;
    }
  }

  // Detect database from description or dependencies
  if (depNames.includes("typeorm") || depNames.includes("sequelize") || depNames.includes("prisma")) {
    analysis.database = "PostgreSQL";
  } else if (projectDescription?.toLowerCase().includes("database") || projectDescription?.toLowerCase().includes("postgres")) {
    analysis.database = "PostgreSQL";
  }

  // Add common project structure
  if (analysis.language === "TypeScript" || analysis.language === "JavaScript") {
    analysis.structure = ["src/", "dist/", "package.json", "tsconfig.json", "vite.config.ts"];
  } else if (analysis.language === "Python") {
    analysis.structure = ["src/", "tests/", "requirements.txt", "README.md"];
  }

  return analysis;
}

/**
 * Quick confidence-based detection based on framework name
 */
export function getFrameworkConfidence(framework: string): number {
  const confidenceMap: Record<string, number> = {
    "Next.js": 95,
    "React + Vite": 92,
    "Vue": 88,
    "SvelteKit": 90,
    "Express": 85,
    "FastAPI": 94,
    "Django": 92,
    "NestJS": 93,
  };
  return confidenceMap[framework] || 60;
}
