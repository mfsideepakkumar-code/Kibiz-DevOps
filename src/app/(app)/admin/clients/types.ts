import type { Tables } from "@/lib/database.types";

export type ClientRow = Tables<"clients">;
export type ProjectRow = Tables<"projects">;
export type SubProjectRow = Tables<"sub_projects">;
export type ContactRow = Tables<"client_contacts">;
export type PricingRow = Tables<"client_pricing">;

export type ClientListItem = Pick<
  ClientRow,
  "id" | "name" | "engagement_model" | "is_active"
>;

export type ProjectWithSubProjects = ProjectRow & {
  sub_projects: SubProjectRow[];
};

export type ClientDetail = {
  client: ClientRow;
  projects: ProjectWithSubProjects[];
  contacts: ContactRow[];
  pricing: PricingRow | null;
};
