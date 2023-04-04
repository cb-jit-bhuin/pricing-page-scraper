import { ChatMessage, OpenAIStream } from "../../utils/OpenAIStream";
import { convert } from "html-to-text";

export async function scrapePricingDetails(url: string, apiToken: string) {
  url = "https://3dweb.io/pricing";
  try {
    const response = await fetch(url, {
      method: "GET",
    });

    const html = await response.text();
    const options = {
      selectors: [
        { selector: "img", format: "skip" },
        { selector: "a", format: "skip" },
        { selector: "footer", format: "skip" },
        { selector: "header", format: "skip" },
      ],
      leadingLineBreaks: 1,
    };
    let text = convert(html, options).replace(/^\s*[\r\n]/gm, "\n");
    text = text ? text : "NA";
    console.log(
      "----------------------------------------------------------------------"
    );
    // console.log(text);
    return new Response("Pricing plans");
    const format = `Put this pricing plans into a JSON with keys "plan_name", "plan_amount", "currency_code", "frequency" and "features". Freqency should be either 'monthly' or 'yearly'. Currency code should be in ISO 4217 format. Features should be array of strings. If you don't find any pricing details or there is no input text return keys with empty string assigned. Return only JSON, No extra sentence`;

    const messages: ChatMessage[] = [
      {
        role: "user",
        content: `Can you find the pricing details from the input text and format unstructured pricing plan text into structured format. 
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
