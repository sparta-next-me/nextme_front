"use client"

import Link from "next/link"
import { useRouter } from "next/navigation" // 라우팅 추가
import { useState } from "react" // 상태 관리 추가
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import logo from "@/lib/images/image.png"

export default function SignupPage() {
  const router = useRouter()
  
  // 1. 입력 데이터 상태 관리
  const [formData, setFormData] = useState({
    name: "",
    email: "", // API 명세의 userName으로 사용됨
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)

  // API 서버 주소 (알려주신 12000 포트 적용)
  const AUTH_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_BASE_URL ?? "http://34.50.7.8:30000").replace(/\/$/, "")

  // 2. 회원가입 핸들러 함수
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    // 간단한 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    if (formData.password.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${AUTH_BASE_URL}/v1/user/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: formData.email, // 요청값 매핑
          password: formData.password,
          name: formData.name,
          slackId: "" // 필수가 아니므로 빈 값 처리
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("회원가입에 성공했습니다! 로그인 페이지로 이동합니다.")
        router.push("/login")
      } else {
        alert(data.message || "회원가입 실패: 입력 정보를 확인해주세요.")
      }
    } catch (error) {
      console.error("회원가입 에러:", error)
      alert("서버와 통신하는 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center ">
          <Link href="/" >
            <Image src={logo} alt="Next Me" width={100000} height={400} className="h-45 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold">계정 만들기</h1>
          <p className="text-muted-foreground">미래를 위한 첫 걸음을 시작하세요</p>
        </div>

        <Card className="p-6 space-y-6">
          {/* 3. onSubmit 연결 */}
          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="홍길동" 
                className="bg-background"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input 
                id="text" 
                type="text" 
                placeholder="example" 
                className="bg-background" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="8자 이상" 
                className="bg-background" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                placeholder="비밀번호 재입력" 
                className="bg-background" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox id="terms" required />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <Link href="#" className="text-primary hover:underline">
                  이용약관
                </Link>
                과{" "}
                <Link href="#" className="text-primary hover:underline">
                  개인정보처리방침
                </Link>
                에 동의합니다
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "처리 중..." : "회원가입"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}