"use client"

import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, RefreshCcw } from "lucide-react";
import { Suspense } from "react"; // 1. Suspense 임포트

// 2. 기존 로직을 별도의 컴포넌트로 분리
function PaymentFailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const message = searchParams.get("message") || "결제 도중 오류가 발생했습니다.";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-red-50">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-900 mb-2">결제를 실패했어요</h2>
                <p className="text-slate-500 font-medium mb-8">{message}</p>

                <div className="flex gap-3">
                    <button onClick={() => router.back()} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                        <RefreshCcw className="h-4 w-4" /> 다시 시도
                    </button>
                    <button onClick={() => router.push("/dashboard")} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
                        홈으로 이동
                    </button>
                </div>
            </div>
        </div>
    );
}

// 3. 메인 페이지 컴포넌트에서 Suspense로 감싸서 내보내기
export default function PaymentFailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-500 font-medium">잠시만 기다려주세요...</p>
            </div>
        }>
            <PaymentFailContent />
        </Suspense>
    );
}