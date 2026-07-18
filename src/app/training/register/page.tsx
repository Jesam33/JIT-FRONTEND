import Image from "next/image";
import StudentRegisterForm from "@/components/training/StudentRegisterForm";

export default function TrainingRegisterPage() {
  return (
    <section className="section-pad section-divider">
      <div className="container-wide">
        <div className="overflow-hidden rounded-[24px] border border-white/20 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="grid lg:grid-cols-2">
            <div className="relative min-h-[420px]">
              <Image
                src="/images/training/training-register-side.jpg"
                alt="Students in training institute session"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="p-6 md:p-10">
              <p className="text-xs uppercase tracking-[0.2em] text-black/60">Student Registration</p>
              <h1 className="mt-3 text-3xl font-bold text-black md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                JORSAS INSTITUE OF TECHNOLOGY
              </h1>
              <p className="mt-4 text-sm leading-7 text-black/70">
                Fill this form to register as a student. After superadmin approval, you will receive a Student Portal email invite.
              </p>

              <div className="mt-6">
                <StudentRegisterForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
