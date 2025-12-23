"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Loader2, CheckCircle2, Lock } from "lucide-react"
import Image from "next/image"
import kiLogo from "@/lib/images/ki.png"
import kukLogo from "@/lib/images/kuk.png"
import shinLogo from "@/lib/images/shin.png"

const INSTITUTIONS = [
  { id: "0088", name: "신한은행", logo: shinLogo },
  { id: "0004", name: "국민은행", logo: kukLogo },
  { id: "0003", name: "기업은행", logo: kiLogo },
]

export default function LinkAccountPage() {
  const router = useRouter()
  
  // 상태 관리
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null) // 권한 상태 추가
  const [step, setStep] = useState(1) // 1: 선택, 1.5: 아이디입력, 2: 전송중, 3: 완료
  const [selectedBank, setSelectedBank] = useState<typeof INSTITUTIONS[0] | null>(null)
  const [bankId, setBankId] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const role = localStorage.getItem("role") // 'USER' 또는 'ADVISOR'
    const storedName = localStorage.getItem("name")

    if (!token) {
      router.push("/login")
    } else {
      setIsLoading(false)
      setUserRole(role)
      if (storedName) setUserName(storedName)
    }
  }, [router])

  // 권한별 목적지 경로 계산 함수
  const getDestinationPath = (withSync: boolean = false) => {
    // role이 ADVISOR이면 /advisor, 그 외(USER 등)는 /dashboard
    const basePath = userRole === "ADVISOR" ? "/advisor" : "/dashboard"
    return withSync ? `${basePath}?sync=true` : basePath
  }

  const handleBankSelect = (bank: typeof INSTITUTIONS[0]) => {
    setSelectedBank(bank)
    setStep(1.5)
  }

  const handleFinalLink = async () => {
    if (!bankId) return alert("은행 아이디를 입력해 주세요.")
    
    setStep(2)
    try {
      const response = await fetch("http://34.50.7.8:30000/v1/account/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({
          organization: selectedBank?.id,
          id: bankId 
        })
      })

      if (response.ok) {
        localStorage.setItem("isLinked", "true")
        localStorage.setItem("isSynced", "true") 
        setStep(3)
      } else {
        alert("연동 중 오류가 발생했습니다.")
        setStep(1.5)
      }
    } catch (error) {
      setStep(1.5)
      alert("서버 통신 에러가 발생했습니다.")
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card h-16 flex items-center px-4 sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => step === 1.5 ? setStep(1) : router.back()} 
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">계정 연동</h1>
      </header>

      <main className="container mx-auto max-w-md px-4 py-12">
        {/* STEP 1: 은행 선택 */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">은행 선택</h2>
              <p className="text-muted-foreground">{userName}님의 자산 분석을 위해 은행을 선택해 주세요.</p>
            </div>
            <div className="grid gap-4">
              {INSTITUTIONS.map((bank) => (
                <Button
                  key={bank.id}
                  variant="outline"
                  className="h-24 justify-between px-6 bg-card hover:border-primary border-2 transition-all"
                  onClick={() => handleBankSelect(bank)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 overflow-hidden rounded-full border bg-white flex items-center justify-center p-1">
                      <Image src={bank.logo} alt={bank.name} width={40} height={40} className="object-contain" />
                    </div>
                    <span className="text-lg font-bold">{bank.name}</span>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground/30" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1.5: 아이디 입력 */}
        {step === 1.5 && selectedBank && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="text-center space-y-4">
              <div className="mx-auto relative w-20 h-20 overflow-hidden rounded-full border-4 border-primary/20 bg-white flex items-center justify-center">
                 <Image src={selectedBank.logo} alt={selectedBank.name} width={50} height={50} className="object-contain" />
              </div>
              <h2 className="text-2xl font-bold">{selectedBank.name} 연결</h2>
              <p className="text-muted-foreground">해당 은행의 로그인 아이디를 입력해주세요.</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="은행 아이디 입력" 
                  className="pl-10 h-12 text-lg"
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                />
              </div>
              <Button className="w-full h-12 text-lg font-bold" onClick={handleFinalLink}>
                연동하기
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: 로딩 */}
        {step === 2 && (
          <div className="py-20 text-center space-y-6">
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
            <h2 className="text-xl font-bold">인증 정보 전송 중</h2>
            <p className="text-muted-foreground">데이터를 안전하게 전송하고 있습니다...</p>
          </div>
        )}

        {/* STEP 3: 완료 */}
        {step === 3 && (
          <div className="py-12 text-center space-y-8 animate-in zoom-in-95">
            <div className="flex justify-center items-center -space-x-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background z-10">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              {selectedBank && (
                <div className="h-16 w-16 rounded-full border bg-white flex items-center justify-center p-2 shadow-sm">
                  <Image src={selectedBank.logo} alt={selectedBank.name} width={40} height={40} className="object-contain" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold">{selectedBank?.name} 연결 완료!</h2>
              <div className="bg-muted/50 p-4 rounded-xl space-y-2 text-left md:text-center">
                <p className="text-sm text-foreground font-medium text-center">
                ✅ 계정 연결에 성공했습니다.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed text-center">
                실시간 잔액과 상세 거래 내역을 분석하려면<br/>
                아래 버튼을 눌러 <strong>데이터 동기화</strong>를 시작해 주세요.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                size="lg" 
                className="w-full bg-primary text-primary-foreground font-bold h-14 text-lg shadow-lg shadow-primary/20"
                onClick={() => router.push(getDestinationPath(true))}
              >
                거래 내역 불러오기
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => router.push(getDestinationPath(false))}
              >
                나중에 하기
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}



