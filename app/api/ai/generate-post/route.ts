import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { text } = await req.json();

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("No API key");
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
أنت مساعد لإنشاء إعلان احترافي لموقع DealNet.

النص:
${text}

الأقسام:
إلكترونيات: موبايلات، لابتوبات، شاشات، كاميرات، ألعاب إلكترونية
كهربائيات منزلية: مكيفات، ثلاجات، غسالات، أفران، سخانات
سيارات: سيارات للبيع، سيارات للإيجار، قطع غيار، إكسسوارات سيارات
عقارات: شقق، منازل، أراضي، محلات، مكاتب
أجهزة طبية: أجهزة فحص، معدات عيادات، أجهزة مختبرات، مستلزمات طبية
خدمات: تصليح، نقل، تنظيف، تصميم، برمجة
أخرى: متفرقات

أرجع JSON فقط:
{
  "title": "",
  "description": "",
  "mainCategory": "",
  "subCategory": "",
  "priceSuggestion": ""
}
`,
    });

    const raw = response.output_text || "";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    return Response.json(JSON.parse(cleaned));
  } catch {
    return Response.json({
      title: text || "إعلان جديد",
      description: `إعلان عن: ${text}. يرجى تعديل الوصف وإضافة الحالة والمواصفات والسعر والموقع.`,
      mainCategory: "أخرى",
      subCategory: "متفرقات",
      priceSuggestion: "",
    });
  }
}