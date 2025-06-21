import { Protocol } from "@/lib/application";

export const mockProtocols: Protocol[] = [
  // Protocols with SPUP codes
  {
    id: "1",
    title: "Impact of Social Media on Student Academic Performance",
    spupRecCode: "SPUP_2024_0001_SR_JD",
    status: "under_review",
    submissionDate: "2024-03-15",
    userId: "user123"
  },
  {
    id: "2",
    title: "Mental Health Assessment of Healthcare Workers During COVID-19",
    spupRecCode: "SPUP_2024_0002_SR_MP",
    status: "approved",
    submissionDate: "2024-02-28",
    userId: "user123"
  },
  {
    id: "3",
    title: "Analysis of Remote Learning Effectiveness in Higher Education",
    spupRecCode: "SPUP_2024_0003_SR_AL",
    status: "rejected",
    submissionDate: "2024-03-01",
    userId: "user123"
  },

  // Protocols without SPUP codes (drafts)
  {
    id: "4",
    title: "Community Health Education Programs: A Case Study",
    spupRecCode: null,
    status: "draft",
    submissionDate: "2024-03-18",
    userId: "user123"
  },
  {
    id: "5",
    title: "Environmental Awareness in Primary School Students",
    spupRecCode: null,
    status: "draft",
    submissionDate: "2024-03-19",
    userId: "user123"
  },
  {
    id: "6",
    title: "Cultural Integration in Modern Educational Systems",
    spupRecCode: null,
    status: "submitted",
    submissionDate: "2024-03-20",
    userId: "user123"
  }
]; 