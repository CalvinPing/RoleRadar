// Seed list of companies to aggregate SWE postings from.
//
// Every entry here was verified with a live HTTP call to the ATS endpoint
// before being added (see the verification pass in project history) -
// each returned HTTP 200 with a non-empty jobs array at the time of writing.
// Companies that 404'd or returned zero postings were dropped rather than
// guessed at (e.g. DoorDash and Snowflake do not resolve on Greenhouse under
// obvious slugs; Netflix and Plaid resolve on Lever but list zero postings
// there; Vercel, Mercury, Airtable resolve on Ashby but list zero postings).
//
// To add a company: confirm its board slug by curling the relevant endpoint
// below and checking for a non-empty result, then add a row.
//   Greenhouse: https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
//   Lever:      https://api.lever.co/v0/postings/{slug}?mode=json
//   Ashby:      https://api.ashbyhq.com/posting-api/job-board/{slug}

export type AtsType = "greenhouse" | "lever" | "ashby";

// Hand-curated, not sourced from any API - there's no reliable free
// headcount data source, so this is a rough judgment call per company
// (funding stage / public vs private / general reputation), not measured
// data. Startup ~<200 people, Midsize ~200-2000, Enterprise ~2000+.
export type CompanySize = "startup" | "midsize" | "enterprise";

export interface CompanyConfig {
  name: string;
  slug: string;
  ats: AtsType;
  size: CompanySize;
  /** Short uppercase tag shown next to each listing, e.g. a stock ticker for public companies. */
  ticker: string;
}

export const COMPANIES: CompanyConfig[] = [
  // Greenhouse
  { name: "Stripe", slug: "stripe", ats: "greenhouse", size: "enterprise", ticker: "STRP" },
  { name: "Airbnb", slug: "airbnb", ats: "greenhouse", size: "enterprise", ticker: "ABNB" },
  { name: "Robinhood", slug: "robinhood", ats: "greenhouse", size: "enterprise", ticker: "HOOD" },
  { name: "Dropbox", slug: "dropbox", ats: "greenhouse", size: "enterprise", ticker: "DBX" },
  { name: "Coinbase", slug: "coinbase", ats: "greenhouse", size: "enterprise", ticker: "COIN" },
  { name: "GitLab", slug: "gitlab", ats: "greenhouse", size: "midsize", ticker: "GTLB" },
  { name: "Cloudflare", slug: "cloudflare", ats: "greenhouse", size: "enterprise", ticker: "NET" },
  { name: "Figma", slug: "figma", ats: "greenhouse", size: "enterprise", ticker: "FIG" },
  { name: "Pinterest", slug: "pinterest", ats: "greenhouse", size: "enterprise", ticker: "PINS" },
  { name: "Reddit", slug: "reddit", ats: "greenhouse", size: "enterprise", ticker: "RDDT" },
  { name: "Databricks", slug: "databricks", ats: "greenhouse", size: "enterprise", ticker: "DBRX" },
  { name: "DoorDash", slug: "doordashusa", ats: "greenhouse", size: "enterprise", ticker: "DASH" },
  { name: "Twilio", slug: "twilio", ats: "greenhouse", size: "enterprise", ticker: "TWLO" },
  { name: "MongoDB", slug: "mongodb", ats: "greenhouse", size: "enterprise", ticker: "MDB" },

  // Lever
  { name: "Palantir", slug: "palantir", ats: "lever", size: "enterprise", ticker: "PLTR" },
  { name: "Spotify", slug: "spotify", ats: "lever", size: "enterprise", ticker: "SPOT" },

  // Greenhouse - added in the second verification pass (2026-07-24)
  { name: "Anthropic", slug: "anthropic", ats: "greenhouse", size: "enterprise", ticker: "ANTH" },
  { name: "xAI", slug: "xai", ats: "greenhouse", size: "enterprise", ticker: "XAI" },
  { name: "Scale AI", slug: "scaleai", ats: "greenhouse", size: "midsize", ticker: "SCAL" },
  { name: "Elastic", slug: "elastic", ats: "greenhouse", size: "enterprise", ticker: "ESTC" },
  { name: "Payoneer", slug: "payoneer", ats: "greenhouse", size: "enterprise", ticker: "PAYO" },
  { name: "Affirm", slug: "affirm", ats: "greenhouse", size: "enterprise", ticker: "AFRM" },
  { name: "Asana", slug: "asana", ats: "greenhouse", size: "enterprise", ticker: "ASAN" },
  { name: "Chime", slug: "chime", ats: "greenhouse", size: "enterprise", ticker: "CHYM" },
  { name: "Twitch", slug: "twitch", ats: "greenhouse", size: "enterprise", ticker: "TWCH" },
  { name: "Faire", slug: "faire", ats: "greenhouse", size: "midsize", ticker: "FAIR" },
  { name: "Carta", slug: "carta", ats: "greenhouse", size: "midsize", ticker: "CRTA" },
  { name: "Zocdoc", slug: "zocdoc", ats: "greenhouse", size: "midsize", ticker: "ZOC" },
  { name: "New Relic", slug: "newrelic", ats: "greenhouse", size: "midsize", ticker: "NEWR" },
  { name: "SoFi", slug: "sofi", ats: "greenhouse", size: "enterprise", ticker: "SOFI" },
  { name: "Duolingo", slug: "duolingo", ats: "greenhouse", size: "enterprise", ticker: "DUOL" },
  { name: "Discord", slug: "discord", ats: "greenhouse", size: "midsize", ticker: "DSCD" },
  { name: "Mixpanel", slug: "mixpanel", ats: "greenhouse", size: "midsize", ticker: "MXPL" },
  { name: "Tanium", slug: "tanium", ats: "greenhouse", size: "midsize", ticker: "TANM" },
  { name: "Betterment", slug: "betterment", ats: "greenhouse", size: "midsize", ticker: "BETR" },
  { name: "Tailscale", slug: "tailscale", ats: "greenhouse", size: "startup", ticker: "TSCL" },
  { name: "Pendo", slug: "pendo", ats: "greenhouse", size: "midsize", ticker: "PNDO" },
  { name: "LaunchDarkly", slug: "launchdarkly", ats: "greenhouse", size: "midsize", ticker: "LD" },
  { name: "Cockroach Labs", slug: "cockroachlabs", ats: "greenhouse", size: "midsize", ticker: "CRDB" },
  { name: "Flexport", slug: "flexport", ats: "greenhouse", size: "midsize", ticker: "FLXP" },
  { name: "Contentful", slug: "contentful", ats: "greenhouse", size: "midsize", ticker: "CTFL" },
  { name: "Yext", slug: "yext", ats: "greenhouse", size: "midsize", ticker: "YEXT" },
  { name: "Greenhouse", slug: "greenhouse", ats: "greenhouse", size: "midsize", ticker: "GRHS" },
  { name: "Squarespace", slug: "squarespace", ats: "greenhouse", size: "midsize", ticker: "SQSP" },
  { name: "Stitch Fix", slug: "stitchfix", ats: "greenhouse", size: "midsize", ticker: "SFIX" },
  { name: "Honeycomb", slug: "honeycomb", ats: "greenhouse", size: "startup", ticker: "HNYC" },
  { name: "Nextdoor", slug: "nextdoor", ats: "greenhouse", size: "enterprise", ticker: "KIND" },
  { name: "Webflow", slug: "webflow", ats: "greenhouse", size: "midsize", ticker: "WEBF" },
  { name: "PagerDuty", slug: "pagerduty", ats: "greenhouse", size: "enterprise", ticker: "PD" },
  { name: "Udacity", slug: "udacity", ats: "greenhouse", size: "midsize", ticker: "UDCT" },
  { name: "Sendbird", slug: "sendbird", ats: "greenhouse", size: "midsize", ticker: "SNDB" },
  { name: "Doximity", slug: "doximity", ats: "greenhouse", size: "enterprise", ticker: "DOCS" },
  { name: "Lattice", slug: "lattice", ats: "greenhouse", size: "midsize", ticker: "LATT" },
  { name: "Typeform", slug: "typeform", ats: "greenhouse", size: "midsize", ticker: "TYPF" },
  { name: "AssemblyAI", slug: "assemblyai", ats: "greenhouse", size: "startup", ticker: "ASMB" },
  { name: "Udemy", slug: "udemy", ats: "greenhouse", size: "enterprise", ticker: "UDMY" },
  { name: "Sisense", slug: "sisense", ats: "greenhouse", size: "midsize", ticker: "SISN" },
  { name: "Netlify", slug: "netlify", ats: "greenhouse", size: "midsize", ticker: "NTLF" },
  { name: "Remote", slug: "remote", ats: "greenhouse", size: "midsize", ticker: "RMTE" },
  { name: "Okta", slug: "okta", ats: "greenhouse", size: "enterprise", ticker: "OKTA" },
  { name: "Intercom", slug: "intercom", ats: "greenhouse", size: "midsize", ticker: "ICOM" },
  { name: "Workato", slug: "workato", ats: "greenhouse", size: "midsize", ticker: "WRKT" },
  { name: "Qualtrics", slug: "qualtrics", ats: "greenhouse", size: "enterprise", ticker: "XM" },
  { name: "Wrike", slug: "wrike", ats: "greenhouse", size: "midsize", ticker: "WRKE" },
  { name: "Instacart", slug: "instacart", ats: "greenhouse", size: "enterprise", ticker: "CART" },
  { name: "Lyft", slug: "lyft", ats: "greenhouse", size: "enterprise", ticker: "LYFT" },
  { name: "Gusto", slug: "gusto", ats: "greenhouse", size: "midsize", ticker: "GUST" },
  { name: "Brex", slug: "brex", ats: "greenhouse", size: "midsize", ticker: "BREX" },
  { name: "Samsara", slug: "samsara", ats: "greenhouse", size: "enterprise", ticker: "IOT" },
  { name: "Block", slug: "block", ats: "greenhouse", size: "enterprise", ticker: "XYZ" },
  { name: "Klaviyo", slug: "klaviyo", ats: "greenhouse", size: "enterprise", ticker: "KVYO" },
  { name: "Toast", slug: "toast", ats: "greenhouse", size: "enterprise", ticker: "TOST" },
  { name: "Verkada", slug: "verkada", ats: "greenhouse", size: "midsize", ticker: "VRKD" },

  // Lever - added in the second verification pass (2026-07-24)
  { name: "Vevo", slug: "vevo", ats: "lever", size: "midsize", ticker: "VEVO" },
  { name: "Ro", slug: "ro", ats: "lever", size: "midsize", ticker: "RO" },
  { name: "Sesame", slug: "sesame", ats: "lever", size: "startup", ticker: "SESM" },

  // Ashby
  { name: "Notion", slug: "notion", ats: "ashby", size: "midsize", ticker: "NOTN" },
  { name: "Ramp", slug: "ramp", ats: "ashby", size: "midsize", ticker: "RAMP" },
  { name: "Linear", slug: "linear", ats: "ashby", size: "startup", ticker: "LNR" },
  { name: "OpenAI", slug: "openai", ats: "ashby", size: "enterprise", ticker: "OAI" },
  { name: "Perplexity", slug: "perplexity", ats: "ashby", size: "midsize", ticker: "PPLX" },
  { name: "Cohere", slug: "cohere", ats: "ashby", size: "midsize", ticker: "COHR" },
  { name: "Zapier", slug: "zapier", ats: "ashby", size: "midsize", ticker: "ZAP" },
  { name: "Benchling", slug: "benchling", ats: "ashby", size: "midsize", ticker: "BNCH" },
  { name: "ClickUp", slug: "clickup", ats: "ashby", size: "midsize", ticker: "CLUP" },
  { name: "Replit", slug: "replit", ats: "ashby", size: "startup", ticker: "REPL" },
  { name: "Eight Sleep", slug: "eightsleep", ats: "ashby", size: "startup", ticker: "8SLP" },
  { name: "PostHog", slug: "posthog", ats: "ashby", size: "startup", ticker: "PHOG" },

  // Ashby - added in the second verification pass (2026-07-24)
  { name: "Cursor", slug: "cursor", ats: "ashby", size: "startup", ticker: "CRSR" },
  { name: "Warp", slug: "warp", ats: "ashby", size: "startup", ticker: "WARP" },
  { name: "ElevenLabs", slug: "elevenlabs", ats: "ashby", size: "startup", ticker: "ELVN" },
  { name: "Harvey", slug: "harvey", ats: "ashby", size: "startup", ticker: "HRVY" },
  { name: "Sierra", slug: "sierra", ats: "ashby", size: "startup", ticker: "SIRA" },
  { name: "Decagon", slug: "decagon", ats: "ashby", size: "startup", ticker: "DCGN" },
  { name: "Browserbase", slug: "browserbase", ats: "ashby", size: "startup", ticker: "BRWS" },
  { name: "Baseten", slug: "baseten", ats: "ashby", size: "startup", ticker: "BASE" },
  { name: "Modal", slug: "modal", ats: "ashby", size: "startup", ticker: "MODL" },
  { name: "Temporal", slug: "temporal", ats: "ashby", size: "midsize", ticker: "TMPR" },
  { name: "Watershed", slug: "watershed", ats: "ashby", size: "midsize", ticker: "WTRS" },
  { name: "Mercor", slug: "mercor", ats: "ashby", size: "startup", ticker: "MRCR" },
  { name: "Attio", slug: "attio", ats: "ashby", size: "startup", ticker: "ATIO" },
  { name: "Gamma", slug: "gamma", ats: "ashby", size: "startup", ticker: "GAMA" },
  { name: "Monte Carlo", slug: "montecarlodata", ats: "ashby", size: "midsize", ticker: "MNTC" },
  { name: "Hightouch", slug: "hightouch", ats: "ashby", size: "startup", ticker: "HTCH" },
  { name: "Airbyte", slug: "airbyte", ats: "ashby", size: "midsize", ticker: "ABYT" },
  { name: "Prefect", slug: "prefect", ats: "ashby", size: "startup", ticker: "PRFC" },
  { name: "Pinecone", slug: "pinecone", ats: "ashby", size: "midsize", ticker: "PCNE" },
  { name: "Weaviate", slug: "weaviate", ats: "ashby", size: "startup", ticker: "WEAV" },
  { name: "LangChain", slug: "langchain", ats: "ashby", size: "startup", ticker: "LCHN" },
  { name: "Deepgram", slug: "deepgram", ats: "ashby", size: "midsize", ticker: "DGRM" },
  { name: "Fireworks AI", slug: "fireworksai", ats: "ashby", size: "startup", ticker: "FRWK" },
  { name: "Anyscale", slug: "anyscale", ats: "ashby", size: "midsize", ticker: "ANSC" },
  { name: "Synthesia", slug: "synthesia", ats: "ashby", size: "midsize", ticker: "SYNA" },
  { name: "Pika", slug: "pika", ats: "ashby", size: "startup", ticker: "PIKA" },
  { name: "Ideogram", slug: "ideogram", ats: "ashby", size: "startup", ticker: "IDGM" },
  { name: "Cognition", slug: "cognition", ats: "ashby", size: "startup", ticker: "COGN" },
  { name: "Poolside", slug: "poolside", ats: "ashby", size: "startup", ticker: "PLSD" },
  { name: "Physical Intelligence", slug: "physicalintelligence", ats: "ashby", size: "startup", ticker: "PI" },
  { name: "Exa", slug: "exa", ats: "ashby", size: "startup", ticker: "EXA" },
  { name: "Tavily", slug: "tavily", ats: "ashby", size: "startup", ticker: "TVLY" },
  { name: "E2B", slug: "e2b", ats: "ashby", size: "startup", ticker: "E2B" },
  { name: "Vapi", slug: "vapi", ats: "ashby", size: "startup", ticker: "VAPI" },
  { name: "Bland", slug: "bland", ats: "ashby", size: "startup", ticker: "BLND" },
  { name: "Cartesia", slug: "cartesia", ats: "ashby", size: "startup", ticker: "CRTS" },
  { name: "WorkOS", slug: "workos", ats: "ashby", size: "midsize", ticker: "WOS" },
  { name: "Salient", slug: "salient", ats: "ashby", size: "startup", ticker: "SALT" },
  { name: "Sunday", slug: "sunday", ats: "ashby", size: "startup", ticker: "SNDY" },
  { name: "Traversal", slug: "traversal", ats: "ashby", size: "startup", ticker: "TRVL" },
  { name: "Braintrust", slug: "braintrust", ats: "ashby", size: "startup", ticker: "BRTR" },
  { name: "EliseAI", slug: "eliseai", ats: "ashby", size: "midsize", ticker: "ELSE" },
  { name: "Mintlify", slug: "mintlify", ats: "ashby", size: "startup", ticker: "MNTL" },
  { name: "Roadrunner", slug: "roadrunner", ats: "ashby", size: "startup", ticker: "RRUN" },
  { name: "Supabase", slug: "supabase", ats: "ashby", size: "midsize", ticker: "SUPA" },
  { name: "Wispr Flow", slug: "wispr-flow", ats: "ashby", size: "startup", ticker: "WISP" },
  { name: "Flint", slug: "flint", ats: "ashby", size: "startup", ticker: "FLNT" },
  { name: "Judgment Labs", slug: "judgmentlabs", ats: "ashby", size: "startup", ticker: "JDGE" },
  { name: "Saronic", slug: "saronic", ats: "ashby", size: "midsize", ticker: "SRNC" },
  { name: "Trajectory", slug: "trajectory", ats: "ashby", size: "startup", ticker: "TRJC" },
  { name: "Krea", slug: "krea", ats: "ashby", size: "startup", ticker: "KREA" },
  { name: "Vizcom", slug: "vizcom", ats: "ashby", size: "startup", ticker: "VIZC" },
  { name: "Workweave", slug: "workweave", ats: "ashby", size: "startup", ticker: "WWVE" },
  { name: "Reducto", slug: "reducto", ats: "ashby", size: "startup", ticker: "RDCT" },
  { name: "Distyl", slug: "distyl", ats: "ashby", size: "startup", ticker: "DSTL" },
  { name: "Flow Engineering", slug: "flowengineering", ats: "ashby", size: "startup", ticker: "FLOW" },
  { name: "GigaML", slug: "gigaml", ats: "ashby", size: "startup", ticker: "GIGA" },
  { name: "Siftstack", slug: "siftstack", ats: "ashby", size: "startup", ticker: "SIFT" },
  { name: "HappyRobot", slug: "happyrobot.ai", ats: "ashby", size: "startup", ticker: "HRBT" },
  { name: "Paraform", slug: "paraform", ats: "ashby", size: "startup", ticker: "PRFM" },
  { name: "General Intelligence Company", slug: "generalintelligencecompany", ats: "ashby", size: "startup", ticker: "GENI" },
  { name: "Substack", slug: "substack", ats: "ashby", size: "midsize", ticker: "SUBS" },
  { name: "Runway", slug: "runway", ats: "ashby", size: "midsize", ticker: "RUNW" },
];
