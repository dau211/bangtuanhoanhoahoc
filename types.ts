
export interface ElementData {
  name: string;
  symbol: string;
  atomicNumber: number;
  atomicMass: number;
  category: string;
  group: number;
  period: number;
  electronConfiguration: string;
  summary: string;
  discovered_by: string | null;
  phase: string;
  density: number | null;
  melt: number | null;
  boil: number | null;
  xpos: number;
  ypos: number;
  oxidationStates: string | null;
  atomicRadius: number | null;
  electronegativityPauling: number | null;
  // New media fields
  imageUrl?: string | null;
  videoUrl?: string | null; // YouTube ID
  // New real-world context fields
  applications?: string | null;
  naturalOccurrence?: string | null;
}
