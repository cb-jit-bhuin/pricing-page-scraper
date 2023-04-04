import { scrapeOrgAddr } from "./scrapeOrgAddr";
import { scrapePricingDetails } from "./scrapePricingDetails";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const { url, apiToken, fetchPricingDetails } = (await req.json()) as {
    url?: string;
    apiToken?: string;
    fetchPricingDetails?: boolean;
  };

  if (!url || !apiToken) {
    return new Response("No prompt in the request", { status: 500 });
  }
  if (fetchPricingDetails) {
    return scrapePricingDetails(url, apiToken);
  } else {
    return scrapeOrgAddr(url, apiToken);
  }
}
