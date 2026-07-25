import type { JobCategory, SeniorityLevel } from "./types";

// Titles that count as software engineering. Checked before the negative
// list so an unambiguous SWE title always wins; the negative list then
// catches lookalikes (Sales Engineer, Solutions Engineer, etc). Every
// "engineer(s)" branch ends in \b so it can't match inside "engineering"
// (e.g. "Data Engineering & Warehousing" is a dept name, not a role).
const POSITIVE_TITLE = [
  /\bsoftware\s+engineers?\b/i,
  /\bswe\b/i,
  /\bsoftware\s+developers?\b/i,
  /\bback[\s-]?end\s+(engineers?|developers?)\b/i,
  /\bfront[\s-]?end\s+(engineers?|developers?)\b/i,
  /\bfull[\s-]?stack\s+(engineers?|developers?)\b/i,
  /\bmobile\s+(engineers?|developers?)\b/i,
  /\bios\s+(engineers?|developers?)\b/i,
  /\bandroid\s+(engineers?|developers?)\b/i,
  /\b(machine\s+learning|ml)[\w\s,-]{0,24}\bengineers?\b/i,
  /\bai\s+[\w\s,-]{0,24}\bengineers?\b/i,
  /\bresearch\s+engineers?\b/i,
  /\bdistributed\s+(systems?|training)\s+engineers?\b/i,
  /\btraining\s+infra(structure)?\s+engineers?\b/i,
  /\bdata\s+engineers?\b/i,
  /\banalytics\s+engineers?\b/i,
  /\bplatform\s+engineers?\b/i,
  /\binfrastructure\s+engineers?\b/i,
  /\bsite\s+reliability\s+engineers?\b/i,
  /\bsre\b/i,
  /\bdevops\s+engineers?\b/i,
  /\bcloud\s+engineers?\b/i,
  /\bsecurity\s+engineers?\b/i,
  /\bsystems?\s+engineers?\b/i,
  /\bqa\s+engineers?\b/i,
  /\btest\s+engineers?\b/i,
  /\bsdet\b/i,
  /\brelease\s+engineers?\b/i,
  /\bbuild\s+engineers?\b/i,
  /\bgraphics?\s+engineers?\b/i,
  /\bcompiler\s+engineers?\b/i,
  /\bdatabase\s+engineers?\b/i,
  /\bui\s+engineers?\b/i,
  /\bux\s+engineers?\b/i,
  /\bweb\s+(engineers?|developers?)\b/i,
  /\bengineering\s+manager/i,
  /\b(manager|director|head),?\s+software\s+engineering\b/i,
  /\bstaff\s+engineers?\b/i,
  /\bprincipal\s+engineers?\b/i,
  /\bsenior\s+engineers?\b/i,
];

const NEGATIVE_TITLE = [
  /\bsales\b/i,
  /\baccount\s+executive/i,
  /\bbusiness\s+development/i,
  /\brecruit/i,
  /\btalent\b/i,
  /\bpeople\s+(ops|operations|team)/i,
  /\bhuman\s+resources\b/i,
  /\bhr\s+(business|partner)/i,
  /\bmarketing\b/i,
  /\blegal\b/i,
  /\bcounsel\b/i,
  /\bfinance\b/i,
  /\baccounting\b/i,
  /\bcontroller\b/i,
  /\btax\b/i,
  /\boffice\s+manager/i,
  /\bexecutive\s+assistant/i,
  /\bchief\s+of\s+staff/i,
  /\bcustomer\s+(support|success)/i,
  /\bsupport\s+engineer/i,
  /\bsolutions?\s+engineer/i,
  /\bsales\s+engineer/i,
  /\bfield\s+engineer/i,
  /\bproduct\s+manager/i,
  /\bproject\s+manager/i,
  /\bprogram\s+manager/i,
  /\bdesigner\b/i,
  /\bcontent\b/i,
  /\bcommunity\b/i,
  /\bevents?\s+(coordinator|manager)/i,
  /\bfacilities\b/i,
  /\breal\s+estate/i,
  /\bprocurement\b/i,
  /\bsupply\s+chain/i,
  /\blogistics\b/i,
  /\bwarehouse\b/i,
  /\bdriver\b/i,
  /\bdelivery\s+(driver|partner)/i,
  /\bretail\b/i,
  /\bstore\s+(associate|manager)/i,
  /\bhardware\s+engineer/i,
  /\bmechanical\s+engineer/i,
  /\belectrical\s+engineer/i,
  /\bfirmware\s+engineer/i,
  /\bembedded\s+(systems\s+)?engineer/i,
  /\bcivil\s+engineer/i,
  /\bchemical\s+engineer/i,
  /\bstructural\s+engineer/i,
  /\bmanufactur(e|ing)\s+engineer/i,
  /\bprocess\s+engineer\b/i,
  /\bquality\s+engineer\b/i,
  /\bpartnerships?\b/i,
  /\bflight\s+test\s+engineer/i,
  /\bhardware\s+test\s+engineer/i,
  /\bgtm\s+systems?\s+engineer/i,
  /\bbusiness\s+systems?\s+engineer/i,
  /\bit\s+systems?\s+engineer/i,
];

const NON_ENG_DEPARTMENTS = [
  /sales/i,
  /marketing/i,
  /^people$/i,
  /people\s+(ops|operations)/i,
  /human\s+resources/i,
  /^hr$/i,
  /recruiting/i,
  /talent/i,
  /finance/i,
  /legal/i,
  /customer\s+(support|success)/i,
  /g&a/i,
  /administration/i,
  /facilities/i,
];

// Every raw posting from every company runs through isSoftwareEngineeringRole
// - for a company with hundreds of postings, ~80 separate .test() calls each
// (the POSITIVE_TITLE/NEGATIVE_TITLE arrays above) was enough combined CPU
// time to push a Workers Free invocation (10ms CPU budget) into error 1102
// "exceeded resources" in production. Collapsing each array into one
// alternation regex is the same matching semantics (still "does any pattern
// match"), just one engine pass instead of ~40 separate calls.
const POSITIVE_TITLE_RE = new RegExp(POSITIVE_TITLE.map((r) => r.source).join("|"), "i");
const NEGATIVE_TITLE_RE = new RegExp(NEGATIVE_TITLE.map((r) => r.source).join("|"), "i");
const NON_ENG_DEPARTMENT_RE = new RegExp(NON_ENG_DEPARTMENTS.map((r) => r.source).join("|"), "i");

export function isSoftwareEngineeringRole(
  title: string,
  departments: string[] = [],
): boolean {
  if (NEGATIVE_TITLE_RE.test(title)) return false;
  if (!POSITIVE_TITLE_RE.test(title)) return false;
  if (departments.some((d) => NON_ENG_DEPARTMENT_RE.test(d))) {
    return false;
  }
  return true;
}

export function categorize(title: string): JobCategory {
  if (/\b(mobile|ios|android|react\s?native|flutter)\b/i.test(title)) {
    return "mobile";
  }
  if (
    /\b(machine\s+learning|artificial\s+intelligence|\bai\b|\bml\b|deep\s+learning|nlp|llm|applied\s+scientist)\b/i.test(
      title,
    )
  ) {
    return "ml_ai";
  }
  if (/\bdata\s+engineers?\b|\bdata\s+platform\b|analytics\s+engineers?\b/i.test(title)) {
    return "data";
  }
  if (
    /\bsite\s+reliability|\bsre\b|devops|infrastructure|platform\s+engineers?\b|cloud\s+engineers?\b|release\s+engineers?\b|build\s+engineers?\b/i.test(
      title,
    )
  ) {
    return "devops_infra";
  }
  if (/\bsecurity\b/i.test(title)) {
    return "security";
  }
  if (/\bfront[\s-]?end\b|\bui\s+engineers?\b/i.test(title)) {
    return "frontend";
  }
  if (/\bback[\s-]?end\b/i.test(title)) {
    return "backend";
  }
  if (/\bfull[\s-]?stack\b/i.test(title)) {
    return "fullstack";
  }
  return "other_engineering";
}

export function extractLevel(title: string): SeniorityLevel {
  if (/\bintern(ship)?\b/i.test(title)) return "intern";
  if (/\bnew\s?grad(uate)?\b|\buniversity\s+grad/i.test(title)) {
    return "new_grad";
  }

  // "Member of Technical Staff" is a level-agnostic title at several AI labs
  // (Perplexity, OpenAI, etc). Strip it before scanning for "staff" so a
  // plain MTS posting doesn't get misread as a Staff+ role.
  const forLevelMatch = title.replace(/member\s+of\s+technical\s+staff/gi, "");

  if (
    /\bstaff\b|\bprincipal\b|\bdistinguished\b|\bfellow\b|\bengineering\s+manager\b|\b(manager|director),?\s+software\s+engineering\b|\bdirector\b|\bhead\s+of\b/i.test(
      forLevelMatch,
    )
  ) {
    return "staff_plus";
  }
  if (/\bsenior\b|\bsr\.?\s/i.test(forLevelMatch)) return "senior";
  if (/\bjunior\b|\bentry[\s-]?level\b|\bassociate\s+(engineer|developer)\b/i.test(forLevelMatch)) {
    return "entry";
  }
  return "mid";
}
