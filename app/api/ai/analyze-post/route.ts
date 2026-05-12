import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { title, desc, price, location, mainCategory, subCategory } =
    await req.json();

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("No API key");
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
حلل الإعلان التالي:

العنوان: ${title}
الوصف: ${desc}
السعر: ${price}
الموقع: ${location}
القسم: ${mainCategory} / ${subCategory}

أرجع JSON فقط:
{
  "score": 0,
  "status": "",
  "problems": [],
  "suggestions": [],
  "warning": ""
}
`,
    });

    const raw = response.output_text || "";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    return Response.json(JSON.parse(cleaned));
  } catch {
    return Response.json({
      score: 70,
      status: "تحليل مبدئي",
      problems: ["لم يتم تشغيل الذكاء الاصطناعي الحقيقي حاليًا"],
      suggestions: [
        "اكتب وصفًا أوضح",
        "أضف حالة المنتج",
        "اذكر سبب البيع",
        "أضف صور واضحة",
      ],
      warning: "هذا تحليل مؤقت وسيصبح أدق بعد تفعيل رصيد OpenAI",
    });
  }
}