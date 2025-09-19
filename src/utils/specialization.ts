import { InterviewSetup } from '../types/interview';

interface FocusProfile {
  focus: string;
  keywords: string[];
  industries?: string[];
  roles?: string[];
}

interface DetectionOptions {
  setup?: InterviewSetup;
}

const normalize = (value?: string) => (value || '').toLowerCase();

const focusProfiles: FocusProfile[] = [
  {
    focus: 'technology_cloud_infra',
    keywords: ['kubernetes', 'terraform', 'gke', 'eks', 'aks', 'multi-region', 'slo', 'sla', 'observability', 'prometheus', 'grafana', 'site reliability', 'platform engineering'],
    industries: ['technology', 'software'],
    roles: ['software engineer', 'platform', 'sre', 'devops', 'infrastructure']
  },
  {
    focus: 'technology_frontend',
    keywords: ['react', 'vue', 'angular', 'accessibility', 'a11y', 'css', 'web performance', 'hydration', 'client-side', 'design system', 'ux', 'ui'],
    industries: ['technology', 'software', 'retail'],
    roles: ['frontend', 'ui', 'product designer']
  },
  {
    focus: 'technology_ml_data',
    keywords: ['model', 'training', 'inference', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'feature store', 'mlops', 'data science', 'vector db'],
    industries: ['technology', 'healthcare', 'finance', 'retail'],
    roles: ['data scientist', 'ml', 'machine learning', 'ai']
  },
  {
    focus: 'technology_data_engineering',
    keywords: ['etl', 'elt', 'spark', 'airflow', 'kafka', 'databricks', 'cdc', 'data warehouse', 'lakehouse', 'pipeline'],
    industries: ['technology', 'retail', 'finance'],
    roles: ['data engineer', 'analytics', 'bi']
  },
  {
    focus: 'technology_security',
    keywords: ['iam', 'oauth', 'jwt', 'encryption', 'tls', 'vulnerability', 'threat model', 'zero trust', 'penetration test', 'security review'],
    industries: ['technology', 'finance', 'government'],
    roles: ['security', 'appsec', 'trust', 'compliance']
  },
  {
    focus: 'technology_mobile',
    keywords: ['ios', 'android', 'react native', 'swift', 'kotlin', 'mobile release', 'app store', 'offline mode', 'latency'],
    industries: ['technology', 'retail'],
    roles: ['mobile', 'ios', 'android']
  },
  {
    focus: 'healthcare_engineering',
    keywords: ['ehr', 'emr', 'fhir', 'hl7', 'hipaa', 'clinical workflow', 'prior auth', 'value-based care', 'telehealth', 'patient safety', 'cms'],
    industries: ['healthcare', 'health tech', 'pharma', 'biotech'],
    roles: ['software engineer', 'product manager', 'implementation', 'clinical informatics']
  },
  {
    focus: 'healthcare_operations',
    keywords: ['care coordination', 'staffing shortage', 'revenue cycle', 'population health', 'payer mix', 'patient throughput'],
    industries: ['healthcare'],
    roles: ['operations', 'administrator', 'nurse manager']
  },
  {
    focus: 'finance_fintech',
    keywords: ['fintech', 'open banking', 'real-time payments', 'iso 20022', 'embedded finance', 'payment rails', 'regtech', 'kyc', 'aml'],
    industries: ['finance', 'financial services', 'banking', 'fintech'],
    roles: ['product manager', 'software engineer', 'payments', 'risk']
  },
  {
    focus: 'finance_risk',
    keywords: ['var', 'stress testing', 'basel', 'credit risk', 'market risk', 'capital requirements', 'liquidity coverage', 'model validation', 'regulation'],
    industries: ['finance', 'banking', 'insurance'],
    roles: ['risk', 'quant', 'compliance', 'treasury']
  },
  {
    focus: 'retail_omnichannel',
    keywords: ['omnichannel', 'bopis', 'boris', 'sku', 'inventory', 'supply chain', 'last mile', 'loyalty program', 'personalization engine', 'planogram'],
    industries: ['retail', 'consumer', 'ecommerce'],
    roles: ['product manager', 'merchandising', 'operations', 'data scientist']
  },
  {
    focus: 'marketing_growth',
    keywords: ['cac', 'ltv', 'attribution', 'mix modeling', 'cookieless', 'privacy-first', 'creative testing', 'abm', 'campaign', 'funnel'],
    industries: ['marketing', 'advertising', 'technology'],
    roles: ['marketing', 'growth', 'demand gen']
  },
  {
    focus: 'sales_enterprise',
    keywords: ['pipeline', 'quota', 'meddic', 'bant', 'stakeholder', 'procurement', 'sales cycle', 'renewal', 'usage-based'],
    industries: ['sales', 'enterprise software', 'saas'],
    roles: ['account executive', 'sales', 'customer success']
  },
  {
    focus: 'education_edtech',
    keywords: ['curriculum', 'learning outcomes', 'lms', 'ferpa', 'competency-based', 'edtech', 'student engagement'],
    industries: ['education', 'edtech'],
    roles: ['teacher', 'educator', 'instructional designer', 'administrator']
  },
  {
    focus: 'consulting_case',
    keywords: ['case', 'hypothesis', 'mece', 'workstream', 'client engagement', 'synthesis', 'deck', 'stakeholder', 'transformation'],
    industries: ['consulting', 'professional services'],
    roles: ['consultant', 'engagement manager', 'associate']
  },
  {
    focus: 'manufacturing_operations',
    keywords: ['oee', 'takt time', 'six sigma', 'lean', 'throughput', 'gmp', 'factory', 'safety', 'supply chain', 'quality'],
    industries: ['manufacturing', 'industrial', 'supply chain'],
    roles: ['operations', 'plant manager', 'process engineer']
  },
  {
    focus: 'nonprofit_social_impact',
    keywords: ['fundraising', 'grant', 'donor', 'impact measurement', 'theory of change', 'program delivery', 'stakeholder engagement'],
    industries: ['non-profit', 'nonprofit', 'social impact'],
    roles: ['program manager', 'development', 'operations']
  },
  {
    focus: 'public_sector_government',
    keywords: ['procurement', 'rfp', 'compliance', 'policy', 'constituent', 'public sector', 'civic tech', 'regulation', 'federal', 'state agency'],
    industries: ['government', 'public sector'],
    roles: ['program manager', 'policy analyst', 'public affairs']
  }
];

const defaultFocusByIndustry: Record<string, string> = {
  healthcare: 'healthcare_engineering',
  'health tech': 'healthcare_engineering',
  finance: 'finance_fintech',
  banking: 'finance_fintech',
  fintech: 'finance_fintech',
  'financial services': 'finance_fintech',
  technology: 'technology_cloud_infra',
  software: 'technology_cloud_infra',
  retail: 'retail_omnichannel',
  ecommerce: 'retail_omnichannel',
  consumer: 'retail_omnichannel',
  marketing: 'marketing_growth',
  advertising: 'marketing_growth',
  sales: 'sales_enterprise',
  'enterprise software': 'sales_enterprise',
  education: 'education_edtech',
  edtech: 'education_edtech',
  consulting: 'consulting_case',
  'professional services': 'consulting_case',
  manufacturing: 'manufacturing_operations',
  'supply chain': 'manufacturing_operations',
  'non-profit': 'nonprofit_social_impact',
  nonprofit: 'nonprofit_social_impact',
  'social impact': 'nonprofit_social_impact',
  government: 'public_sector_government',
  'public sector': 'public_sector_government'
};

const senioritySignals: Record<'junior'|'senior', string[]> = {
  junior: ['junior', 'entry', 'intern', 'learning', 'studying', 'bootcamp', 'early career'],
  senior: ['lead', 'led', 'owned', 'architected', 'principal', 'director', 'managed team', 'strategic', 'mentored', 'head of', 'vp']
};

export function detectFocusAndSeniority(
  responses: string[],
  options: DetectionOptions = {}
): { focus: string; seniority: 'junior'|'mid'|'senior'; } {
  const text = responses.join(' ').toLowerCase();
  const setup = options.setup;
  const setupIndustry = normalize(setup?.industry);
  const setupRole = normalize(setup?.jobType);

  let bestFocus = 'general_systems';
  let bestScore = 0;

  for (const profile of focusProfiles) {
    let score = 0;
    if (profile.keywords.some(keyword => text.includes(keyword))) {
      score += profile.keywords.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);
    }
    if (profile.industries?.some(ind => setupIndustry.includes(ind))) {
      score += 2;
    }
    if (profile.roles?.some(role => setupRole.includes(role))) {
      score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestFocus = profile.focus;
    }
  }

  if (bestScore === 0 && setupIndustry) {
    for (const [industry, focus] of Object.entries(defaultFocusByIndustry)) {
      if (setupIndustry.includes(industry)) {
        bestFocus = focus;
        break;
      }
    }
  }

  let seniority: 'junior'|'mid'|'senior' = 'mid';
  if (senioritySignals.junior.some(w => text.includes(w))) {
    seniority = 'junior';
  }
  if (senioritySignals.senior.some(w => text.includes(w))) {
    seniority = 'senior';
  }

  if (seniority === 'mid' && setupRole) {
    if (/(principal|director|lead|head|sr|senior)/.test(setupRole)) {
      seniority = 'senior';
    } else if (/(intern|junior|entry|graduate|associate)/.test(setupRole)) {
      seniority = 'junior';
    }
  }

  return { focus: bestFocus, seniority };
}
