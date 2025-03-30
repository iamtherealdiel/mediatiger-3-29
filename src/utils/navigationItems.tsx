import { BarChart3, Eye, Music, Play, Wallet } from "lucide-react";
const navigationItems = [
  {
    name: "Overview",
    section: "overview",
    icon: <Eye className="h-5 w-5" />,
    stepNumber: 1,
  },
  {
    name: "Analytics",
    section: "analytics",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: "Channel Management",
    section: "channels",
    icon: <Play className="h-5 w-5" />,
  },
  {
    name: "Music",
    section: "music",
    icon: <Music className="h-5 w-5" />,
  },
  {
    name: "Balance",
    section: "balance",
    icon: <Wallet className="h-5 w-5" />,
  },
];

export { navigationItems };
