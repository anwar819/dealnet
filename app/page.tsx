export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="mb-4 inline-block rounded-full border border-slate-700 px-4 py-1 text-sm text-slate-300">
              منصة للأفراد والأعمال
            </p>

            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
              اعرض منتجاتك، خدماتك، وابدأ صفقات حقيقية على{" "}
              <span className="text-green-400">DealNet</span>
            </h1>

            <p className="mb-8 text-lg text-slate-300">
              DealNet تربط بين الأفراد، التجار، الشركات، ومقدمي الخدمات في مكان
              واحد منظم وواضح.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="/register"
                className="rounded-xl bg-green-500 px-6 py-3 font-medium text-white hover:bg-green-600"
              >
                ابدأ الآن
              </a>

              <a
                href="/marketplace"
                className="rounded-xl border border-slate-700 px-6 py-3 font-medium text-white hover:bg-slate-800"
              >
                تصفح السوق
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">ماذا يمكنك أن تفعل؟</h2>
          <p className="mt-2 text-slate-600">
            نشر عروض بيع، طلبات شراء، خدمات، وطلبات خدمات بشكل منظم.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">بيع</h3>
            <p className="text-slate-600">اعرض منتجاتك للأفراد أو الأعمال.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">شراء</h3>
            <p className="text-slate-600">اطلب منتجات أو كميات محددة بسهولة.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">خدمات</h3>
            <p className="text-slate-600">اعرض خدماتك المهنية والتجارية.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold">فرص</h3>
            <p className="text-slate-600">ابحث عن تعاون، توزيع، أو شراكات.</p>
          </div>
        </div>
      </section>
    </main>
  );
}