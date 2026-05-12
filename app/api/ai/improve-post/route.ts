import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { title, desc } = await req.json();

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("No API key");
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
حسّن هذا الإعلان واجعله أكثر احترافية وجاذبية.

العنوان:
${title}

الوصف:
${desc}

أرجع JSON فقط:
{
  "title": "",
  "description": ""
}
`,
    });

    const raw = response.output_text || "";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    return Response.json(JSON.parse(cleaned));
  } catch {
    return Response.json({
      title: title || "إعلان مميز للبيع",
      description:
        desc ||
        "هذا إعلان مميز. يرجى إضافة تفاصيل أكثر عن الحالة، المواصفات، السعر، والموقع.",
    });
  }
}