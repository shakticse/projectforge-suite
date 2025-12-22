export interface Project {
  id: number;
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  teamSize?: number;
  budget?: string;
  manager?: string;
  managerId?: string | number;
  // Additional fields used by create/edit forms
  address?: string;
  pincode?: string;
  state?: string;
  projectArea?: number;
  areaUnit?: string;
  sitePossessionStartDate?: string;
  sitePossessionEndDate?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  documents?: Array<{ name: string; url?: string }>;
}
