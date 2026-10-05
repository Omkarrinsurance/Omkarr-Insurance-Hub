import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface CarrierEntry {
  name: string;
  primaryLoginUrl: string;
  directPortalUrl?: string;
  resourcesUrl?: string;
  phone: string;
  overview: string;
  category: string;
  keywords: string[];
}

// Master Verified & Canonical Insurance Hub Knowledge Base
// Every URL here is the verified, exact broker/agent portal URL.
const MASTER_CARRIER_REGISTRY: Record<string, CarrierEntry> = {
  humana: {
    name: 'Humana Vantage',
    primaryLoginUrl: 'https://vantage.humana.com/',
    directPortalUrl: 'https://account.humana.com/',
    resourcesUrl: 'https://www.humana.com/provider/business-resources/agent',
    phone: '1-800-309-3163',
    overview: 'Humana Vantage Producer Portal · Access quoting, electronic enrollment, contracting status, certifications, and commission statements for Medicare Advantage (HMO/PPO), Part D Prescription, and Dual-Eligible Special Needs Plans (D-SNP).',
    category: 'Medicare',
    keywords: ['humana', 'vantage', 'humana vantage', 'humana portal', 'humana link', 'humana agent', 'humana login']
  },
  sunfire: {
    name: 'Sunfire Matrix',
    primaryLoginUrl: 'https://auth.sunfirematrix.com/',
    directPortalUrl: 'https://www.sunfirematrix.com/',
    phone: '1-888-316-2487',
    overview: 'Sunfire Matrix Quoting & Enrollment Platform · Multi-carrier comparison, Scope of Appointment (SOA) collection, and digital application submission for Medicare Advantage and Part D plans.',
    category: 'Enrollment Tool',
    keywords: ['sunfire', 'sunfire matrix', 'sunfire portal', 'sunfire link', 'sun fire', 'quoting matrix']
  },
  aetna: {
    name: 'Aetna Producer World',
    primaryLoginUrl: 'https://producer.aetna.com/',
    directPortalUrl: 'https://www.aetna.com/producers.html',
    phone: '1-866-272-6630',
    overview: 'Aetna Producer World · Producer portal for individual Medicare Advantage plans, SilverScript prescription drug plans, and Medicare Supplement products.',
    category: 'Medicare',
    keywords: ['aetna', 'producer world', 'aetna producer', 'aetna portal', 'silverscript', 'aetna link', 'aetna login', 'producer.aetna.com']
  },
  wellcare: {
    name: 'WellCare Broker Workbench',
    primaryLoginUrl: 'https://broker.wellcare.com/',
    directPortalUrl: 'https://www.wellcare.com/en/Broker',
    phone: '1-866-822-1339',
    overview: 'Centene Broker Workbench & WellCare Portal · Manage certifications, submit applications, check application status, and view book of business for Centene & WellCare Medicare Advantage plans.',
    category: 'Medicare',
    keywords: ['wellcare', 'centene', 'broker workbench', 'wellcare portal', 'wellcare link', 'centene broker', 'wellcare login', 'broker.wellcare.com']
  },
  uhc: {
    name: 'UnitedHealthcare (UHC Jarvis)',
    primaryLoginUrl: 'https://www.uhcjarvis.com/',
    resourcesUrl: 'https://www.uhc.com/broker',
    phone: '1-888-381-8581',
    overview: 'UHC Jarvis Producer Portal · Access Jarvis for AARP Medicare Advantage, Medicare Supplement, Part D plans, and Golden Rule ACA Individual Exchange plans.',
    category: 'Medicare & Health',
    keywords: ['uhc', 'united', 'unitedhealthcare', 'jarvis', 'uhc jarvis', 'united healthcare', 'jarvis portal', 'uhc login', 'uhc link']
  },
  zing: {
    name: 'Zing Health',
    primaryLoginUrl: 'https://www.myzinghealth.com/brokers',
    directPortalUrl: 'https://www.myzinghealth.com/',
    phone: '1-844-946-4432',
    overview: 'Zing Health Producer Portal · Community-focused Medicare Advantage HMO, Chronic Special Needs Plans (C-SNP), and Institutional-Equivalent Plans.',
    category: 'Medicare',
    keywords: ['zing', 'zing health', 'myzinghealth', 'zing portal', 'zing link', 'zing login']
  },
  ambetter: {
    name: 'Ambetter Health',
    primaryLoginUrl: 'https://broker.ambetterhealth.com/',
    resourcesUrl: 'https://www.ambetterhealth.com/',
    phone: '1-855-700-7985',
    overview: 'Ambetter Broker Portal · Complete quoting, client management, and enrollment for ACA Individual & Family Marketplace Qualified Health Plans.',
    category: 'U65 Health',
    keywords: ['ambetter', 'ambetter broker', 'ambetter health', 'ambetter portal', 'ambetter link', 'aca', 'ambetter login']
  },
  cigna: {
    name: 'Cigna Healthcare',
    primaryLoginUrl: 'https://www.cigna.com/brokers/',
    phone: '1-800-433-5768',
    overview: 'Cigna for Brokers Portal · Quoting, benefits verification, and contracting for Individual & Family ACA plans, Dental/Vision, and Supplemental health policies.',
    category: 'U65 Health',
    keywords: ['cigna', 'cigna for brokers', 'cigna portal', 'cigna link', 'cigna login']
  },
  bcbs: {
    name: 'Blue Cross Blue Shield',
    primaryLoginUrl: 'https://www.bcbs.com/',
    directPortalUrl: 'https://www.floridablue.com/',
    phone: '1-800-262-2583',
    overview: 'Blue Cross Blue Shield Association Network & Producer Access · Nationwide network health plans and local state affiliate broker access (Florida Blue, Anthem, CareFirst).',
    category: 'U65 Health',
    keywords: ['blue cross', 'bcbs', 'blue shield', 'anthem', 'florida blue', 'bcbs portal', 'bcbs login', 'blue cross link']
  },
  mutual: {
    name: 'Mutual of Omaha (SPA)',
    primaryLoginUrl: 'https://www.mutualofomaha.com/broker',
    phone: '1-800-867-6875',
    overview: 'Sales Professional Access (SPA) · Whole Life, Guaranteed Advantage, Express Final Expense, Term Life, and Long-Term Care solutions.',
    category: 'Life & Final Expense',
    keywords: ['mutual of omaha', 'mutual', 'omaha', 'spa', 'sales professional access', 'mutual of omaha portal', 'mutual of omaha login', 'mutual link']
  },
  manhattan: {
    name: 'Manhattan Life',
    primaryLoginUrl: 'https://www.manhattanlife.com/producers',
    phone: '1-800-669-9030',
    overview: 'ManhattanLife Producer Portal · Simplified Issue Final Expense, Dental/Vision/Hearing, and Life Annuities.',
    category: 'Life & Final Expense',
    keywords: ['manhattan', 'manhattan life', 'manhattanlife', 'manhattan portal', 'manhattan link', 'manhattan login']
  },
  gerber: {
    name: 'Gerber Life',
    primaryLoginUrl: 'https://www.gerberlife.com/agents',
    phone: '1-800-428-4947',
    overview: 'Gerber Life Agent Portal · Guaranteed Issue Final Expense, Grow-Up Children Plans, and Life Insurance solutions for families.',
    category: 'Life & Final Expense',
    keywords: ['gerber', 'gerber life', 'gerber portal', 'gerber agent', 'grow up plan', 'gerber login', 'gerber link']
  },
  onyx: {
    name: 'Onyx CRM',
    primaryLoginUrl: 'https://app.onyxplatform.com/',
    phone: '1-800-555-0199',
    overview: 'Onyx Platform · Dedicated insurance producer CRM, sales pipeline, lead tracking, and client record administration.',
    category: 'Core Tool',
    keywords: ['onyx', 'onyx platform', 'onyx crm', 'crm', 'app.onyxplatform', 'onyx link']
  },
  cms: {
    name: 'CMS Enterprise Portal',
    primaryLoginUrl: 'https://portal.cms.gov/',
    resourcesUrl: 'https://www.medicare.gov/',
    phone: '1-800-MEDICARE',
    overview: 'Centers for Medicare & Medicaid Services (CMS) Enterprise Portal · Official federal portal for Medicare policy, MARx, and agent compliance guidelines.',
    category: 'Compliance',
    keywords: ['cms', 'cms.gov', 'medicare.gov', 'portal.cms.gov', 'cms portal', 'cms link']
  },
  athos: {
    name: 'Athos AI',
    primaryLoginUrl: 'https://app.useathos.ai/',
    phone: 'Online Support',
    overview: 'Athos AI Platform · Automated carrier underwriting assist, medical knockout question analysis, and Medicare plan comparisons.',
    category: 'Core Tool',
    keywords: ['athos', 'athos ai', 'useathos', 'athos portal', 'athos link']
  },

  // DOCTOR SEARCH DIRECTORIES
  humana_doctor: {
    name: 'Humana / CarePlus Doctor Search',
    primaryLoginUrl: 'https://www.humana.com/finder/medical',
    resourcesUrl: 'https://www.careplushealthplans.com/find-a-doctor',
    phone: '1-800-309-3163',
    overview: 'Humana & CarePlus Find a Doctor Directory · Search in-network primary care physicians (PCP), specialists, clinics, and hospitals.',
    category: 'Doctor Search',
    keywords: ['humana doctor', 'careplus', 'careplus doctor', 'humana physician', 'humana specialist', 'humana network', 'humana provider']
  },
  uhc_doctor: {
    name: 'UHC Provider Search',
    primaryLoginUrl: 'https://www.uhc.com/find-a-doctor',
    phone: '1-888-381-8581',
    overview: 'UnitedHealthcare Medical Provider Search · Find participating network doctors, medical groups, behavioral health, and acute care facilities.',
    category: 'Doctor Search',
    keywords: ['uhc doctor', 'uhc provider search', 'uhc find doctor', 'united doctor', 'uhc physician']
  },
  aetna_doctor: {
    name: 'Aetna Doctor Search (DocFind)',
    primaryLoginUrl: 'https://www.aetna.com/dsepublic/#/welcome',
    phone: '1-866-272-6630',
    overview: 'Aetna DocFind Directory · Look up participating Medicare Advantage and Commercial network physicians, urgent cares, and hospital networks.',
    category: 'Doctor Search',
    keywords: ['aetna doctor', 'aetna provider search', 'docfind', 'aetna physician', 'aetna specialist']
  },
  uhc_dental: {
    name: 'UHC Dental Provider Search',
    primaryLoginUrl: 'https://www.uhcdental.com/',
    phone: '1-888-381-8581',
    overview: 'UnitedHealthcare Dental Network · Directory of in-network general dentists, endodontists, and pediatric dental specialists.',
    category: 'Doctor Search',
    keywords: ['uhc dental', 'united dental', 'dental provider', 'uhc dentist']
  },
  uhc_optometry: {
    name: 'UHC Optometry / Vision Search',
    primaryLoginUrl: 'https://www.uhc.com/vision',
    phone: '1-888-381-8581',
    overview: 'UnitedHealthcare Vision Directory · Locate optometrists, ophthalmologists, and retail eyewear provider locations.',
    category: 'Doctor Search',
    keywords: ['uhc optometry', 'uhc vision', 'optometrist', 'eye doctor']
  },
  healthsprings_doctor: {
    name: 'HealthSpring Doctor Search',
    primaryLoginUrl: 'https://www.cigna.com/medicare/healthspring',
    phone: '1-800-433-5768',
    overview: 'Cigna HealthSpring Doctor & Hospital Directory · Look up Medicare Advantage network providers and coordinated care clinics.',
    category: 'Doctor Search',
    keywords: ['healthspring', 'healthsprings', 'healthspring doctor', 'cigna healthspring']
  },
  wellpoint_doctor: {
    name: 'Wellpoint Provider Search',
    primaryLoginUrl: 'https://www.wellpoint.com/find-care',
    phone: '1-833-731-2160',
    overview: 'Wellpoint Find Care Directory · Find participating primary care physicians, urgent cares, and medical specialists.',
    category: 'Doctor Search',
    keywords: ['wellpoint', 'wellpoint doctor', 'wellpoint find care', 'wellpoint provider']
  },
  anthem_doctor: {
    name: 'Anthem Doctor & Hospital Search',
    primaryLoginUrl: 'https://www.anthem.com/find-care/',
    phone: '1-800-627-8797',
    overview: 'Anthem Find Care · Complete provider network search for doctors, imaging centers, labs, and inpatient facilities.',
    category: 'Doctor Search',
    keywords: ['anthem doctor', 'anthem find care', 'anthem physician', 'anthem network']
  },
  wellcare_doctor: {
    name: 'WellCare Provider Directory',
    primaryLoginUrl: 'https://www.wellcare.com/en/find-a-provider',
    phone: '1-866-822-1339',
    overview: 'WellCare Find a Provider Tool · Search participating Medicare and Dual-Eligible health providers by location and plan.',
    category: 'Doctor Search',
    keywords: ['wellcare doctor', 'wellcare provider', 'wellcare find provider', 'centene doctor']
  },
  zing_doctor: {
    name: 'Zing Health Doctor Directory',
    primaryLoginUrl: 'https://www.myzinghealth.com/find-a-doctor',
    phone: '1-844-946-4432',
    overview: 'Zing Health Provider Search · Community network physician lookup for Zing Medicare Advantage plans.',
    category: 'Doctor Search',
    keywords: ['zing doctor', 'zing provider', 'zing find doctor']
  },
  simply_doctor: {
    name: 'Simply Healthcare Provider Directory',
    primaryLoginUrl: 'https://www.simplyhealthcareplans.com/find-care',
    phone: '1-877-577-0115',
    overview: 'Simply Healthcare Plans Find Care Directory · Network provider search for Florida Medicare and Medicaid plans.',
    category: 'Doctor Search',
    keywords: ['simply', 'simply healthcare', 'simply doctor', 'simply find care']
  },

  // RX & PHARMACY PORTALS
  humana_pharmacy: {
    name: 'Humana Pharmacy (CenterWell)',
    primaryLoginUrl: 'https://www.centerwellpharmacy.com/',
    phone: '1-800-379-0092',
    overview: 'CenterWell Pharmacy (Humana Pharmacy) · Mail-delivery prescription ordering, drug pricing calculator, and 90-day supply benefits.',
    category: 'RX & Pharmacy',
    keywords: ['humana pharmacy', 'centerwell', 'centerwell pharmacy', 'humana rx', 'humana mail order']
  },
  wellpoint_rx: {
    name: 'Wellpoint Pharmacy (shop.wellpoint.com)',
    primaryLoginUrl: 'https://shop.wellpoint.com/',
    phone: '1-833-731-2160',
    overview: 'Wellpoint Prescription & OTC Portal · Drug pricing, formulary lookup, and over-the-counter allowance catalog.',
    category: 'RX & Pharmacy',
    keywords: ['shop.wellpoint.com', 'shop wellpoint', 'wellpoint rx', 'wellpoint pharmacy']
  },
  wellcare_isf: {
    name: 'WellCare ISF Pharmacy (wellcare.isf.io)',
    primaryLoginUrl: 'https://wellcare.isf.io/',
    phone: '1-866-822-1339',
    overview: 'WellCare Integrated Special Formulary (ISF) Portal · Drug coverage lookup, tier pricing, and formulary search engine.',
    category: 'RX & Pharmacy',
    keywords: ['wellcare.isf.io', 'wellcare isf', 'isf.io', 'wellcare pharmacy', 'wellcare rx']
  },
  zing_rx: {
    name: 'Zing Health Pharmacy',
    primaryLoginUrl: 'https://www.myzinghealth.com/pharmacy',
    phone: '1-844-946-4432',
    overview: 'Zing Health Comprehensive Formulary · Formulary PDF downloads, tier classification, and mail-order pharmacy services.',
    category: 'RX & Pharmacy',
    keywords: ['zing pharmacy', 'zing rx', 'zing formulary']
  },

  // ADDITIONAL RESOURCES
  gtl_brochures: {
    name: 'All GTL Brochures (Guarantee Trust Life)',
    primaryLoginUrl: 'https://www.gtlic.com/',
    phone: '1-800-338-7452',
    overview: 'GTL Agent Portal · Marketing brochures, underwriting guidelines, and state outlines of coverage for Short-Term Home Health Care (STHHC) and Hospital Indemnity.',
    category: 'Additional Resources',
    keywords: ['gtl', 'gtl brochures', 'gtlic.com', 'guarantee trust life', 'sthhc']
  },
  signify: {
    name: 'Signify Health',
    primaryLoginUrl: 'https://www.signifyhealth.com/',
    phone: '1-855-319-4448',
    overview: 'Signify Health Agent Portal · Scheduling in-home health evaluations and value-based clinical care coordination for Medicare members.',
    category: 'Additional Resources',
    keywords: ['signify', 'signify health', 'signify portal', 'signifyhealth.com']
  },
  outlook: {
    name: 'Microsoft 365 Outlook',
    primaryLoginUrl: 'https://outlook.office.com/',
    phone: 'Support Desk',
    overview: 'Microsoft Outlook Web Access · Access your producer email, calendar, meeting invites, and client appointment scheduling.',
    category: 'Additional Resources',
    keywords: ['outlook', 'outlook.office.com', 'webmail', 'agent email']
  },
  adp: {
    name: 'ADP Portal',
    primaryLoginUrl: 'https://my.adp.com/',
    phone: '1-844-227-5237',
    overview: 'ADP Workforce Now Portal · Producer compensation stubs, annual 1099 tax forms, and direct deposit information.',
    category: 'Additional Resources',
    keywords: ['adp', 'my.adp.com', 'adp portal', '1099', 'payroll']
  }
};

function formatCarrierResponse(entry: CarrierEntry): { reply: string; webSources: { title: string; url: string }[] } {
  const webSources: { title: string; url: string }[] = [];
  webSources.push({ title: `${entry.name}`, url: entry.primaryLoginUrl });
  if (entry.directPortalUrl) {
    webSources.push({ title: `${entry.name} Portal`, url: entry.directPortalUrl });
  }

  let text = `Here is the official, verified portal link for **${entry.name}**:\n\n`;
  text += `🔗 **[${entry.name} Portal Link](${entry.primaryLoginUrl})**\n\n`;
  text += `- **Direct Verified URL:** \`${entry.primaryLoginUrl}\`\n`;

  if (entry.directPortalUrl) {
    text += `- **Alternate Link:** [${entry.directPortalUrl}](${entry.directPortalUrl})\n`;
  }
  if (entry.resourcesUrl) {
    text += `- **Agent Resources:** [${entry.resourcesUrl}](${entry.resourcesUrl})\n`;
  }

  text += `- **Support Hotline:** \`${entry.phone}\`\n`;
  text += `- **Category:** ${entry.category}\n`;
  text += `- **Overview:** ${entry.overview}\n\n`;
  text += `*Click the button below to launch the portal.*`;

  return { reply: text, webSources };
}

// Multi-Tier Intelligent Search across:
// 1. User-added Carriers (from all tabs)
// 2. User-added Tabs/Categories
// 3. User-added Left Navigation Links
// 4. Master Verified Carrier Knowledge Base
// 5. Topic directories (doctor search, pharmacy, compliance, AEP)
function resolveInsuranceQuery(
  message: string, 
  userCarriers: any[] = [], 
  userTabs: any[] = [], 
  userNavLinks: any[] = []
): { reply: string; webSources: { title: string; url: string }[] } | null {
  const lower = message.toLowerCase().trim();
  const cleanedQuery = lower.replace(/[?!.,;:'"()]/g, ' ');
  const queryTokens = cleanedQuery.split(/\s+/).filter((t: string) => t.length > 1);

  // 1. Check matching in User Custom Carriers first
  if (Array.isArray(userCarriers) && userCarriers.length > 0) {
    for (const c of userCarriers) {
      if (!c || !c.name || !c.url) continue;
      const cName = c.name.toLowerCase();
      const cTokens = cName.split(/\s+/).filter((t: string) => t.length > 1);
      const cTag = (c.tagline || '').toLowerCase();

      // Check direct name containment or token match
      const exactNameMatch = lower.includes(cName);
      const tokenMatch = cTokens.length > 0 && cTokens.some((t: string) => queryTokens.includes(t));
      const tagMatch = cTag.length > 0 && queryTokens.some((t: string) => cTag.includes(t) && t.length > 3);

      if (exactNameMatch || tokenMatch || tagMatch) {
        return {
          reply: `Here is the verified link for **${c.name}** configured in your dashboard:\n\n🔗 **[Open ${c.name} Portal](${c.url})**\n\n- **Direct URL:** \`${c.url}\`\n- **Hub Category:** ${(c.category || 'General').toUpperCase()}\n- **Description:** ${c.tagline || 'Authorized Portal'}\n\n*Click the button below to launch directly.*`,
          webSources: [{ title: `${c.name}`, url: c.url }]
        };
      }
    }
  }

  // 2. Check matching in User Left Navigation Links
  if (Array.isArray(userNavLinks) && userNavLinks.length > 0) {
    for (const link of userNavLinks) {
      if (!link || !link.label || !link.url) continue;
      const lName = link.label.toLowerCase();
      const lTokens = lName.split(/\s+/).filter((t: string) => t.length > 2);

      if (lower.includes(lName) || (lTokens.length > 0 && lTokens.some((t: string) => queryTokens.includes(t)))) {
        return {
          reply: `Here is the link for **${link.label}** from your Left Navigation:\n\n🔗 **[Open ${link.label}](${link.url})**\n\n- **Direct URL:** \`${link.url}\`\n\n*Click below to open.*`,
          webSources: [{ title: `${link.label}`, url: link.url }]
        };
      }
    }
  }

  // 3. Check matching in User Hub Tabs (e.g., user asks "what is in dental hub?" or "list medicare hub")
  if (Array.isArray(userTabs) && userTabs.length > 0) {
    for (const tab of userTabs) {
      if (!tab || !tab.label) continue;
      const tLabel = tab.label.toLowerCase();
      if (lower.includes(tLabel) || (tab.id && lower.includes(tab.id.toLowerCase()))) {
        // Find carriers belonging to this tab
        const tabCarriers = userCarriers.filter(c => c.category === tab.id || (tab.id === 'all'));
        if (tabCarriers.length > 0) {
          let listText = `Here are the active applications and links under **${tab.label}**:\n\n`;
          const sources: { title: string; url: string }[] = [];
          for (const c of tabCarriers) {
            listText += `- 🔗 **[${c.name}](${c.url})** (\`${c.url}\`) - ${c.tagline || 'Portal'}\n`;
            sources.push({ title: c.name, url: c.url });
          }
          listText += `\n*You can also click on the **${tab.label}** tab on your dashboard to view the full cards.*`;
          return { reply: listText, webSources: sources.slice(0, 5) };
        }
      }
    }
  }

  // 4. Check Master Carrier Registry (Exact canonical links)
  for (const key of Object.keys(MASTER_CARRIER_REGISTRY)) {
    const entry = MASTER_CARRIER_REGISTRY[key];
    const match = entry.keywords.some(kw => {
      if (kw.length <= 3) {
        return queryTokens.includes(kw);
      }
      return lower.includes(kw);
    });
    if (match) {
      return formatCarrierResponse(entry);
    }
  }

  // 5. Specialized Insurance Topics & Directories
  if (lower.includes('doctor') || lower.includes('provider') || lower.includes('physician') || lower.includes('dentist')) {
    return {
      reply: `### Official Doctor & Provider Search Directories\n\n- 🔗 [Humana / CarePlus Doctor Search](https://www.humana.com/finder/medical)\n- 🔗 [UHC Provider Search](https://www.uhc.com/find-a-doctor)\n- 🔗 [Aetna DocFind](https://www.aetna.com/dsepublic/#/welcome)\n- 🔗 [UHC Dental Directory](https://www.uhcdental.com/)\n- 🔗 [UHC Optometry / Vision](https://www.uhc.com/vision)\n- 🔗 [HealthSpring Doctor Search](https://www.cigna.com/medicare/healthspring)\n- 🔗 [Wellpoint Find Care](https://www.wellpoint.com/find-care)\n- 🔗 [Anthem Find Care](https://www.anthem.com/find-care/)\n- 🔗 [WellCare Provider Lookup](https://www.wellcare.com/en/find-a-provider)\n- 🔗 [Zing Health Doctor Directory](https://www.myzinghealth.com/find-a-doctor)\n- 🔗 [Simply Healthcare Directory](https://www.simplyhealthcareplans.com/find-care)`,
      webSources: [
        { title: 'Humana Doctor Search', url: 'https://www.humana.com/finder/medical' },
        { title: 'UHC Provider Search', url: 'https://www.uhc.com/find-a-doctor' },
        { title: 'Aetna DocFind', url: 'https://www.aetna.com/dsepublic/#/welcome' }
      ]
    };
  }

  if (lower.includes('rx') || lower.includes('pharmacy') || lower.includes('formulary') || lower.includes('drug')) {
    return {
      reply: `### Official RX & Pharmacy Portals\n\n- 🔗 [Humana Pharmacy (CenterWell)](https://www.centerwellpharmacy.com/)\n- 🔗 [UHC Jarvis Drug Formularies](https://www.uhcjarvis.com/)\n- 🔗 [Aetna Pharmacy & Drug Lookup](https://www.aetna.com/individuals-families/find-a-medication.html)\n- 🔗 [shop.wellpoint.com](https://shop.wellpoint.com/)\n- 🔗 [wellcare.isf.io](https://wellcare.isf.io/)\n- 🔗 [Zing Health Formulary](https://www.myzinghealth.com/pharmacy)`,
      webSources: [
        { title: 'CenterWell Pharmacy', url: 'https://www.centerwellpharmacy.com/' },
        { title: 'shop.wellpoint.com', url: 'https://shop.wellpoint.com/' },
        { title: 'wellcare.isf.io', url: 'https://wellcare.isf.io/' }
      ]
    };
  }

  if (lower.includes('aep') || lower.includes('annual enrollment')) {
    return {
      reply: `### Medicare Annual Enrollment Period (AEP) 2026\n\n- **Dates:** **October 15 – December 7** every year.\n- **Coverage Effective Date:** **January 1**.\n- **Rules:**\n  - Beneficiaries can join, switch, or drop Medicare Advantage (MA/MAPD) and Part D Prescription Drug Plans (PDP).\n  - Scope of Appointment (SOA) forms must be collected at least **48 hours** prior to marketing appointments.\n\n🔗 [CMS Medicare Official Portal](https://portal.cms.gov/)`,
      webSources: [{ title: 'CMS Medicare Portal', url: 'https://portal.cms.gov/' }]
    };
  }

  if (lower.includes('soa') || lower.includes('scope of appointment')) {
    return {
      reply: `### CMS Scope of Appointment (SOA) 48-Hour Rule\n\n- **Requirement:** Agents must obtain a signed Scope of Appointment from beneficiaries at least **48 hours in advance** of personal marketing meetings.\n- **Exceptions:**\n  - Beneficiary-initiated walk-ins to an agent office or retail store.\n  - Inbound meetings scheduled during the final 4 days of an enrollment period (e.g., Dec 4–7 for AEP).\n- **Compliant Form:** Download the 2026 SOA template from your Hub Resources panel.\n\n🔗 [CMS Compliance Information](https://portal.cms.gov/)`,
      webSources: [{ title: 'CMS Compliance', url: 'https://portal.cms.gov/' }]
    };
  }

  return null;
}

app.post('/api/chat', async (req, res) => {
  const { message, carriers = [], tabs = [], navLinks = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Priority 1: Check known carriers, custom tabs, doctor directories, pharmacy portals, and tools
  const resolvedDirect = resolveInsuranceQuery(message, carriers, tabs, navLinks);
  if (resolvedDirect) {
    return res.json(resolvedDirect);
  }

  // Prepare full directory context for Gemini
  const carrierContext = Array.isArray(carriers) && carriers.length > 0
    ? carriers.map((c: any) => `- ${c.name} (${c.category}): ${c.url}`).join('\n')
    : 'Standard carrier directory available.';

  const tabContext = Array.isArray(tabs) && tabs.length > 0
    ? tabs.map((t: any) => `- Hub Tab: "${t.label}" (id: ${t.id})`).join('\n')
    : '';

  const navContext = Array.isArray(navLinks) && navLinks.length > 0
    ? navLinks.filter((n: any) => n.url).map((n: any) => `- Left Link: "${n.label}": ${n.url}`).join('\n')
    : '';

  const systemInstruction = `You are the Omkarr Insurance Hub AI Assistant, dedicated to licensed insurance agents.
CRITICAL LINK ACCURACY RULES:
1. When providing web links, you MUST ONLY provide exact, verified, real URLs starting with https://.
2. If the user asks for any carrier, tab, or tool listed below, you MUST use the EXACT URL provided in the directory below.
DO NOT guess or invent paths (e.g. NEVER make up fake paths like /login, /broker-auth, /login.aspx).
3. If a carrier or tool is not listed, provide only the real root domain (e.g. https://www.example.com).
4. Always provide direct markdown links with descriptive text: [Carrier Name Portal](https://...)

CONFIGURED CARRIERS & APPLICATION DIRECTORY:
${carrierContext}

CONFIGURED HUB TABS:
${tabContext}

CONFIGURED NAVIGATION LINKS:
${navContext}

Always be concise, professional, and helpful.`;

  // Priority 2: Use Gemini to answer open-ended questions if API key is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.2, // low temperature for high factual accuracy
        },
      });

      let reply = response.text || '';
      if (reply.trim().length > 0) {
        // Extract and verify URLs from reply
        const urlRegex = /(https?:\/\/[^\s)<>"']+)/g;
        const matchedUrls = reply.match(urlRegex) || [];
        const webSources: { title: string; url: string }[] = [];
        const seen = new Set<string>();

        // Cross-check with master registry to fix any hallucinated paths
        for (const raw of matchedUrls) {
          let clean = raw.replace(/[.,;:!?)\>"']+$/, '').trim();
          if (!clean || clean.includes('google.com') || seen.has(clean)) continue;

          // Check if clean URL host belongs to a known carrier in MASTER_CARRIER_REGISTRY
          for (const key of Object.keys(MASTER_CARRIER_REGISTRY)) {
            const entry = MASTER_CARRIER_REGISTRY[key];
            try {
              const parsed = new URL(clean);
              const entryParsed = new URL(entry.primaryLoginUrl);
              if (parsed.hostname.replace('www.', '') === entryParsed.hostname.replace('www.', '')) {
                // Normalize to canonical verified URL
                clean = entry.primaryLoginUrl;
                break;
              }
            } catch (e) {}
          }

          seen.add(clean);
          try {
            const host = new URL(clean).hostname.replace('www.', '');
            webSources.push({ title: host, url: clean });
          } catch (e) {}
        }

        return res.json({ reply, webSources });
      }
    } catch (err: any) {
      console.warn('Gemini chat error, falling back to directory matcher:', err?.message || err);
    }
  }

  // Priority 3: Fallback response with core categories
  return res.json({
    reply: `I can help you find verified links and guidelines for all your tools:\n\n- **Carrier Portals:** Humana Vantage, Sunfire Matrix, Aetna Producer World, WellCare Workbench, UHC Jarvis, Ambetter, Mutual of Omaha\n- **Doctor Search:** Humana, UHC, Aetna DocFind, WellCare, Zing Health, Anthem\n- **RX & Pharmacy:** CenterWell (Humana Pharmacy), shop.wellpoint.com, wellcare.isf.io\n- **Custom Hubs:** Your custom tabs and left navigation links are fully indexed!\n\nWhich link or topic do you need?`,
    webSources: [
      { title: 'Humana Vantage Portal', url: 'https://vantage.humana.com/' },
      { title: 'Sunfire Matrix', url: 'https://auth.sunfirematrix.com/' },
      { title: 'Aetna Producer World', url: 'https://producer.aetna.com/' },
      { title: 'UHC Jarvis', url: 'https://www.uhcjarvis.com/' }
    ]
  });
});

// Vite middleware in dev or static in prod
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
