/**
 * ═══════════════════════════════════════════════════════
 * DYNX Labs — Insights Data
 * ═══════════════════════════════════════════════════════
 *
 * HOW TO ADD A NEW ARTICLE:
 * 1. Copy one of the objects below
 * 2. Paste it at the TOP of the `articles` array (newest first)
 * 3. Fill in all fields (both "en" and "es")
 * 4. Set a unique `slug` (URL-friendly, no spaces, no accents)
 * 5. Save and push to GitHub
 *
 * CATEGORIES (predefined — contact team to add new ones):
 *   "automatizacion"        → color: #7a3010
 *   "inteligencia-artificial" → color: #233444
 *   "casos-reales"          → color: #0d3320
 *   "workflows"             → color: #2a1040
 *
 * READ TIME: estimate ~200 words per minute
 * ═══════════════════════════════════════════════════════
 */

const INSIGHTS_CATEGORIES = {
  "automatizacion": {
    color: "#7a3010",
    en: "Automation",
    es: "Automatización"
  },
  "inteligencia-artificial": {
    color: "#233444",
    en: "Artificial Intelligence",
    es: "Inteligencia Artificial"
  },
  "casos-reales": {
    color: "#0d3320",
    en: "Real Cases",
    es: "Casos Reales"
  },
  "workflows": {
    color: "#2a1040",
    en: "Workflows",
    es: "Workflows"
  }
};

const INSIGHTS_ARTICLES = [
  {
    slug: "diferencia-automatizacion-inteligencia-artificial",
    category: "inteligencia-artificial",
    date: "2026-03-08",
    readTime: { en: "5 min read", es: "5 min de lectura" },
    views: 0,
    en: {
      title: "Automation vs Artificial Intelligence: What's the Difference?",
      summary: "Two terms everyone uses, but few know how to tell apart. Understanding the distinction can transform how you plan your operations."
    },
    es: {
      title: "Diferencia entre automatización e inteligencia artificial",
      summary: "Dos términos que todos usan pero pocos saben distinguir. Entender la diferencia puede transformar cómo planeas tus operaciones."
    }
  },
  {
    slug: "que-es-un-workflow-y-por-que-importa",
    category: "workflows",
    date: "2026-03-08",
    readTime: { en: "4 min read", es: "4 min de lectura" },
    views: 0,
    en: {
      title: "What Is a Workflow and Why Does It Matter for Your Business?",
      summary: "Before automating anything, you need to understand what a workflow is. Here's a practical explanation with real examples."
    },
    es: {
      title: "Qué es un workflow y por qué importa en tu negocio",
      summary: "Antes de automatizar cualquier cosa, necesitas entender qué es un workflow. Aquí una explicación práctica con ejemplos reales."
    }
  },
  {
    slug: "como-reducir-tiempo-respuesta-cliente-con-ia",
    category: "automatizacion",
    date: "2026-03-08",
    readTime: { en: "6 min read", es: "6 min de lectura" },
    views: 0,
    en: {
      title: "How to Reduce Customer Response Time With AI",
      summary: "Every minute a customer waits is a minute your competition can act. We show you how to set up an AI system that responds 24/7."
    },
    es: {
      title: "Cómo reducir el tiempo de respuesta al cliente con IA",
      summary: "Cada minuto que un cliente espera es un minuto que tu competencia puede actuar. Te mostramos cómo montar un sistema de IA que responde 24/7."
    }
  },
  {
    slug: "de-excel-a-dashboard-en-tiempo-real",
    category: "casos-reales",
    date: "2026-03-08",
    readTime: { en: "7 min read", es: "7 min de lectura" },
    views: 0,
    en: {
      title: "From Manual Excel to Real-Time Dashboard: A Real Case",
      summary: "A company was spending 6 hours a week consolidating data in Excel. We automated the entire process in 3 days. Here's how."
    },
    es: {
      title: "De Excel manual a dashboard en tiempo real: un caso real",
      summary: "Una empresa gastaba 6 horas semanales consolidando datos en Excel. Automatizamos todo el proceso en 3 días. Así lo hicimos."
    }
  },
  {
    slug: "que-es-un-llm-y-como-puede-trabajar-en-tu-operacion",
    category: "inteligencia-artificial",
    date: "2026-03-08",
    readTime: { en: "5 min read", es: "5 min de lectura" },
    views: 0,
    en: {
      title: "What Is an LLM and How Can It Work Inside Your Operation?",
      summary: "Large Language Models are the engine behind AI tools you already use. Understanding how they work helps you decide where to apply them in your business."
    },
    es: {
      title: "Qué es un LLM y cómo puede trabajar dentro de tu operación",
      summary: "Los Large Language Models son el motor detrás de las herramientas de IA que ya usas. Entender cómo funcionan te ayuda a decidir dónde aplicarlos en tu negocio."
    }
  },
  {
    slug: "ai-agents-reemplazando-tareas-administrativas",
    category: "inteligencia-artificial",
    date: "2026-03-08",
    readTime: { en: "6 min read", es: "6 min de lectura" },
    views: 0,
    en: {
      title: "How AI Agents Are Replacing Administrative Tasks",
      summary: "AI agents don't just answer questions — they execute tasks, make decisions, and operate autonomously. We explain what they are and where to start."
    },
    es: {
      title: "Cómo los AI Agents están reemplazando tareas administrativas",
      summary: "Los AI agents no solo responden preguntas, ejecutan tareas, toman decisiones y operan de forma autónoma. Te explicamos qué son y por dónde empezar."
    }
  },
  {
    slug: "5-tareas-repetitivas-que-tu-equipo-no-deberia-hacer",
    category: "automatizacion",
    date: "2026-03-08",
    readTime: { en: "4 min read", es: "4 min de lectura" },
    views: 0,
    en: {
      title: "5 Repetitive Tasks Your Team Shouldn't Be Doing Manually",
      summary: "If your team is still doing these 5 tasks by hand, you're losing time and money every day. The good news: all of them can be automated today."
    },
    es: {
      title: "5 tareas repetitivas que tu equipo no debería estar haciendo manualmente",
      summary: "Si tu equipo sigue haciendo estas 5 tareas a mano, estás perdiendo tiempo y dinero cada día. La buena noticia: todas se pueden automatizar hoy mismo."
    }
  }
];
