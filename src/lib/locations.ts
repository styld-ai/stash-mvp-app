// Icon imports would go here, assuming you're using Lucide icons
import { Building, GraduationCap, Dumbbell, Hotel, Film, Hospital } from "lucide-react";

export interface LocationType {
  id: string;
  type: string;
  icon: any; // This would be the Lucide icon component
  description: string;
  available: {
    refrigerated: number;
    nonRefrigerated: number;
  };
}

export const locationTypes: LocationType[] = [
  {
    id: "office",
    type: "Office",
    icon: Building,
    description: "Corporate and business offices",
    available: {
      refrigerated: 22,
      nonRefrigerated: 29
    }
  },
  {
    id: "school",
    type: "School",
    icon: GraduationCap,
    description: "K-12 and higher education facilities",
    available: {
      refrigerated: 3,
      nonRefrigerated: 1
    }
  },
  {
    id: "gym",
    type: "Gym",
    icon: Dumbbell,
    description: "Fitness centers and sports facilities",
    available: {
      refrigerated: 4,
      nonRefrigerated: 4
    }
  },
  {
    id: "hotel",
    type: "Hotel",
    icon: Hotel,
    description: "Hotels and accommodations",
    available: {
      refrigerated: 2,
      nonRefrigerated: 2
    }
  },
  {
    id: "movie_theater",
    type: "Movie Theater",
    icon: Film,
    description: "Cinemas and entertainment venues",
    available: {
      refrigerated: 4,
      nonRefrigerated: 7
    }
  },
  {
    id: "hospital",
    type: "Hospital",
    icon: Hospital,
    description: "Healthcare facilities and medical centers",
    available: {
      refrigerated: 3,
      nonRefrigerated: 2
    }
  }
];