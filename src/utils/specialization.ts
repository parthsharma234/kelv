export function detectFocusAndSeniority(responses: string[]): { focus: string; seniority: 'junior'|'mid'|'senior'; } {
  const text = responses.join(' ').toLowerCase();
  const focusMap: Record<string, string[]> = {
    cloud_infra: ['kubernetes','terraform','gke','aws','azure','multi-region','slo','sla','observability','prometheus'],
    frontend_web: ['react','vue','angular','accessibility','a11y','css','webperf','hydration','client-side'],
    ml_data: ['model','training','inference','nlp','cv','tensorflow','pytorch','feature store'],
    data_engineering: ['etl','spark','airflow','kafka','databricks','cdc'],
    security: ['auth','oauth','jwt','encryption','tls','vulnerability','threat model'],
    mobile_embedded: ['ios','android','react native','offline','battery','latency'],
    finance_quant: ['valuation','lbo','npv','derivatives','risk','ebitda'],
    product_growth: ['retention','activation','a/b test','funnel','cohort','acquisition'],
    consulting_case: ['market size','go-to-market','case','hypothesis','synthesis']
  };
  let focus = 'general_systems';
  for (const [key, words] of Object.entries(focusMap)) {
    if (words.some(w => text.includes(w))) {
      focus = key;
    }
  }
  const seniorityMap: Record<'junior'|'senior', string[]> = {
    junior: ['junior','entry','intern','learning','studying'],
    senior: ['lead','led','owned','architected','scale','strateg','delegated','mentored']
  };
  let seniority: 'junior'|'mid'|'senior' = 'mid';
  if (seniorityMap.junior.some(w => text.includes(w))) seniority = 'junior';
  if (seniorityMap.senior.some(w => text.includes(w))) seniority = 'senior';
  return { focus, seniority };
}
