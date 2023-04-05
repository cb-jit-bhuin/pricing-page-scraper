import { ChatMessage, OpenAIStream } from "../../utils/OpenAIStream";
import { convert } from "html-to-text";

const getText = async (url: string, options: object) => {
  const response = await fetch(url, {
    method: "GET",
  });
  const html = await response.text();
  const text = convert(html, options).replace(/^\s*[\r\n]/gm, "\n") as string;
  return text;
};

const fetchHomePageText = async (url: string) => {
  const options = {
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", format: "skip" },
      { selector: "header", format: "skip" },
    ],
    leadingLineBreaks: 1,
  };

  return await getText(url, options);
};

const fetchAboutPageText = async (url: string) => {
  const options = {
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", format: "skip" },
      { selector: "header", format: "skip" },
      { selector: "footer", format: "skip" },
    ],
    leadingLineBreaks: 1,
  };
  return await getText(url, options);
};

const fetchContactPageText = async (url: string) => {
  const options = {
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", format: "skip" },
      { selector: "header", format: "skip" },
      { selector: "footer", format: "skip" },
    ],
    leadingLineBreaks: 1,
  };
  await getText(url, options);
};
export async function scrapeOrgAddr(url: string, apiToken: string) {
  try {
    //url = "https://www.thescope.com/";
    let homePageText, aboutPageText, contactPageText;
    try {
      homePageText = await fetchHomePageText(url);
    } catch (error) {
      homePageText = "NA";
    }
    try {
      aboutPageText = await fetchAboutPageText(url + "/" + "about");
    } catch (error) {
      aboutPageText = "NA";
    }
    try {
      contactPageText = await fetchContactPageText(url + "/" + "contact");
    } catch (error) {
      contactPageText = "NA";
    }
    /* For fetching only the URL present in the html
    const response = await fetch(url, {
      method: "GET",
    });
    const html = await response.text();
    const regex = /href=["'](.*?)["']/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      console.log(match[1]);
    }
    console.log("home Page------", homePageText);
    console.log("about Page------", aboutPageText);
    console.log("contact Page------", contactPageText);
    */
    const text = homePageText + aboutPageText + contactPageText;
    const format = `Put the address into a JSON with keys "address_line_1","address_line_2","address_line_3","city","state","country","pin". If you don't find any address, respond with same keys having no value. For multiple address return the most relevant one`;
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: `Can you find the Organization address from the input text and format address into structured format. 
            format: ${format}
            input text: ${text}`,
      },
    ];

    const payload = {
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.5,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 2000,
      stream: true,
      n: 1,
    };

    const stream = await OpenAIStream(payload, apiToken);
    return new Response(stream);
  } catch (e: any) {
    console.log({ e });
    return new Response(e, { status: 500 });
  }
}
/* Problem to solve for organization address
 - All website does not contain adddress
 - Address can be present in footer, contact and about page. So if we fetch all token will be more. 
 Can we find an way to fetch only the required html?
 - The URL for contact page and about page can be differet for different website,
  ex. an company based on Italy have the contact page at "<home page>/contatti"
  and same can happen for non english website. And for english website we can also have,
  "<home-page>/contact" ,<home-page>/contact-us,  <home-page>?page=contact or any other possibility
 - Some address does not have the country name in their address. We can ask GPT to fill it by analysing by itself.
 */
