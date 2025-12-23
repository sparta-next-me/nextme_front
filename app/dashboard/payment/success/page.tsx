"use client"

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");
      const token = localStorage.getItem("accessToken");

      if (!paymentKey || !orderId || !amount) {
        setStatus("error");
        return;
      }

      try {
        // 백엔드 @PostMapping("/confirm") 호출
        const response = await fetch("http://34.50.7.8:30000/v1/payments/confirm", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount)
          })
        });

        if (response.ok) {
          setStatus("success");
          setTimeout(() => router.push("/dashboard"), 3000);
        } else {
          // 백엔드 500 에러 발생 시 여기로 들어옵니다.
          setStatus("error");
        }
      } catch (error) {
        console.error("승인 요청 에러:", error);
        setStatus("error");
      }
    };

    confirmPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <h2 className="text-xl font-bold">결제 승인 중...</h2>
          </div>
        )}
        {status === "success" && (
          <div className="animate-in zoom-in">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black">결제 완료!</h2>
            <p className="text-blue-600 text-sm mt-4 font-bold">잠시 후 대시보드로 이동합니다.</p>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">결제 처리 실패</h2>
            <p className="text-slate-500 text-sm">결제는 완료되었으나 서버 기록 중 오류가 발생했습니다.</p>
            <button onClick={() => router.push("/dashboard")} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">대시보드로 돌아가기</button>
          </div>
        )}
      </div>
    </div>
  );
}