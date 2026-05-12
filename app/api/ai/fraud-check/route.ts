import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { title, desc, price } = await req.json();

    if (!title || !desc) {
      return Response.json(
        { error: "بيانات ناقصة" },
        { status: 400 }
      );
    }

    // 🔥 إذا لا يوجد API → fallback
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        status: "warning",
        message: "فحص أمان مبدئي (بدون ذكاء اصطناعي)",
        reasons: [
          "تأكد من السعر",
          "لا تطلب تحويل مسبق",
          "أضف تفاصيل واضحة",
        ],
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
أنت نظام أمان داخل موقع DealNet.

افحص الإعلان التالي:

العنوان:
${title}

الوصف:
${desc}

السعر:
${price}

حدد هل الإعلان:
- آمن (safe)
- يحتاج مراجعة (warning)
- احتيالي (danger)

اعتمد على:
- السعر غير منطقي
- طلب تحويل مسبق
- نص غامض
- قلة التفاصيل
- أسلوب احتيالي

أرجع JSON فقط:
{
  "status": "safe | warning | danger",
  "message": "",
  "reasons": []
}
`,
    });

    const raw = response.output_text || "";

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let data;

    try {
      data = JSON.parse(cleaned);
    } catch {
      // fallback إذا فشل التحويل
      data = {
        status: "warning",
        message: "لم يتم تحليل الإعلان بدقة",
        reasons: [
          "تحقق من السعر",
          "أضف تفاصيل أكثر",
          "تجنب العبارات العامة",
        ],
      };
    }

    return Response.json(data);
  } catch (error) {
    console.error("FRAUD CHECK ERROR:", error);

    return Response.json({
      status: "warning",
      message: "فشل فحص الأمان",
      reasons: [
        "تحقق يدويًا من الإعلان",
        "تأكد من صحة البيانات",
      ],
    });
  }
}