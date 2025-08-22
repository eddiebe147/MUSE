import type { Metadata } from "next";

const TITLE = "MUSE - Story Intelligence Platform";
const DESCRIPTION =
  "MUSE is an advanced story intelligence platform that helps writers analyze, understand, and enhance their narratives using AI-powered insights and visualization tools.";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://muse-story.app/";

export const seoConfig: Metadata = {
  title: {
    default: TITLE,
    template: "%s | MUSE", 
  },
  description: DESCRIPTION,
  applicationName: "MUSE",
  category: "Writing & Storytelling",
  keywords: [
    // Branding
    "MUSE",
    "MUSE app",
    "MUSE Story Intelligence",
    "MUSE writing platform",
    "MUSE AI",
    "MUSE story analysis",

    // Core Product - Story Intelligence
    "story intelligence platform",
    "AI story analysis",
    "narrative analysis tool",
    "story structure analysis",
    "plot analysis software",
    "character development tool",
    "story writing assistant",
    "narrative intelligence",
    "story data visualization",
    "writing analytics",
    "story insights platform",
    "narrative pattern recognition",

    // Writing & Storytelling
    "AI writing tool",
    "AI story writer",
    "story development software",
    "creative writing assistant",
    "novel writing app",
    "screenplay analysis",
    "story plotting tool",
    "narrative design tool",
    "writing craft analysis",
    "story structure tool",
    "character arc analysis",
    "plot hole detection",

    // AI & Analysis Features
    "AI narrative analysis",
    "story theme analysis",
    "writing style analysis",
    "story pacing analysis",
    "dialogue analysis",
    "story consistency checker",
    "narrative flow analysis",
    "story improvement suggestions",
    "AI story feedback",
    "automated story insights",

    // Creative Writing Tools
    "creative writing software",
    "storytelling platform",
    "story development tool",
    "narrative writing app",
    "fiction writing assistant",
    "story planning software",
    "writing improvement tool",
    "story editing assistant",
    "narrative craft tool",
    "story visualization tool",

    // Target Users
    "writers tool",
    "authors assistant",
    "screenwriters tool",
    "creative writers app",
    "fiction writers platform",
    "storytellers tool",
    "narrative designers app",
    "writing coaches tool",
    "story editors assistant",

    // Search Intent Phrases
    "best story analysis tool",
    "AI story writing assistant",
    "story intelligence software",
    "narrative analysis platform",
    "writing improvement tool",
    "story development software",
    "creative writing AI",
    "story structure analyzer",
    "plot analysis tool",
    "character development app",
  ],  
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL(BASE_URL),
  verification:{
    google: 'q_spHn9uTXgy715SiSp97ElF_ZbU5SxZbIUnhn6Oe8E',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: "MUSE",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: "MUSE – Story Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    site: "@MuseStoryAI",
    creator: "@MuseStoryAI",
    images: [
        {
          url: '/api/og',
          alt: 'MUSE - Story Intelligence Platform',
        },
      ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};
