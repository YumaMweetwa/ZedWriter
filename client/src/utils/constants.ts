export const WORK_TYPES: Record<string, { label: string; price: number; features: string[] }> = {
  proposal: {
    label: "Research Proposal",
    price: 500,
    features: [
      "Complete research proposal",
      "Literature review included",
      "Methodology section",
      "3-5 day delivery"
    ]
  },
  dissertation: {
    label: "Full Dissertation",
    price: 1000,
    features: [
      "Complete dissertation",
      "Data analysis included",
      "Unlimited revisions",
      "10-14 day delivery"
    ]
  },
  assignment: {
    label: "Assignment",
    price: 300,
    features: [
      "Custom assignment writing",
      "Research and analysis",
      "Proper formatting",
      "2-3 day delivery"
    ]
  },
  data_analysis: {
    label: "Data Analysis",
    price: 400,
    features: [
      "SPSS/R analysis",
      "Charts & graphs",
      "Interpretation",
      "2-3 day delivery"
    ]
  },
  data_collection: {
    label: "Data Collection",
    price: 400,
    features: [
      "Survey design",
      "Data collection",
      "Quality assurance",
      "Data cleaning"
    ]
  }
};

export const PROGRAMS = [
  { value: "medicine", label: "Medicine & Surgery" },
  { value: "engineering", label: "Engineering" },
  { value: "business", label: "Business Studies" },
  { value: "education", label: "Education" },
  { value: "agriculture", label: "Agriculture" },
  { value: "social", label: "Social Sciences" }
];

export const MEDICINE_YEARS = [
  { value: "111", label: "Year 1 - Semester 1" },
  { value: "121", label: "Year 1 - Semester 2" },
  { value: "211", label: "Year 2 - Semester 1" },
  { value: "221", label: "Year 2 - Semester 2" },
  { value: "311", label: "Year 3 - Semester 1" },
  { value: "321", label: "Year 3 - Semester 2" },
  { value: "421", label: "Year 4 - Semester 1" },
  { value: "422", label: "Year 4 - Semester 2" },
  { value: "511", label: "Year 5 - Semester 1" },
  { value: "521", label: "Year 5 - Semester 2" }
];

export const MATERIAL_TYPES = [
  { value: "study_notes", label: "Study Notes" },
  { value: "past_papers_theory", label: "Past Papers (Theory)" },
  { value: "past_papers_practical", label: "Past Papers (Practical/OSCE)" }
];

export const PAYMENT_METHODS = [
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" }
];

export const PAYMENT_ARRANGEMENTS = [
  { value: "50_50", label: "50% upfront, 50% on completion" },
  { value: "full_upfront", label: "Full payment upfront" },
  { value: "full_completion", label: "Full payment on completion" }
];

export const CONTACT_INFO = {
  email: "support@zedwriter.zm",
  whatsapp: "+260977123456",
  phone: "+260977123456"
};

export const REFERRAL_POINTS = {
  signup: 2,
  proposal_payment: 25,
  dissertation_payment: 50,
  assignment_payment: 15,
  data_analysis_payment: 20,
  data_collection_payment: 20,
  minimum_withdrawal: 200
};
