"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import logo from "@/lib/images/image.png"

export default function LoginPage() {
  const router = useRouter()
  const [userName, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const LOGIN_API_URL = "http://34.50.7.8:30000/v1/user/auth/login"
  const AUTH_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_BASE_URL ?? "http://34.50.7.8:32000").replace(/\/$/, "")
  const GOOGLE_AUTH_URL = "http://sparta-nextme.xyz:32000/oauth2/authorization/google"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userName,
          password: password,
        }),
      });

      const data = await res.json();

      if (data.isSuccess && data.result) {
        console.log("로그인 성공 데이터:", data.result);

        const userRole = data.result.roles; 
        const token = data.result.accessToken;
        const name = data.result.name;
        const userId = data.result.userId;

        if (token) localStorage.setItem("accessToken", token);
        if (userRole) localStorage.setItem("role", userRole);
        if (name) localStorage.setItem("name", name);
        if (userId) localStorage.setItem("userId", userId);

        // --- 경로 분기 로직 수정 부분 ---
        if (userRole === "MANAGER" || userRole === "MASTER") {
          router.push("/admin");
        } else if (userRole === "ADVISOR") {
          // 상담사(ADVISOR) 역할일 경우 /advisor로 이동
          router.push("/advisor");
        } else {
          // 그 외 일반 유저(USER 등)는 /dashboard로 이동
          router.push("/dashboard");
        }
        // ------------------------------

      } else {
        alert(data.message || "아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      alert("서버와 통신할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const socialBtnBase = "w-full h-11 bg-white hover:bg-gray-50 border-gray-300 justify-center flex items-center gap-2"

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" >
            <Image src={logo} alt="Next Me" width={100} height={10} className="h-45 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold">다시 오신 것을 환영합니다</h1>
          <p className="text-muted-foreground">계정에 로그인하세요</p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-3">
            {/* Google */}
            <Button variant="outline" className={`${socialBtnBase} text-[#4285F4]`} onClick={() => { window.location.href = GOOGLE_AUTH_URL }}>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google로 계속하기
            </Button>

            {/* Kakao */}
            <Button variant="outline" className={`${socialBtnBase} text-[#FEE500]`} onClick={() => { window.location.href = `${AUTH_BASE_URL}/oauth2/authorization/kakao` }}>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#FEE500" d="M12 3C6.477 3 2 6.477 2 10.75c0 2.76 1.88 5.17 4.67 6.5-.2.74-.77 2.87-.88 3.32-.13.54.2.54.42.39.16-.11 2.55-1.78 3.52-2.45.75.1 1.52.16 2.27.16 5.523 0 10-3.477 10-7.75S17.523 3 12 3z" />
              </svg>
              Kakao로 계속하기
            </Button>

            {/* Naver */}
            <Button variant="outline" className={`${socialBtnBase} text-[#03C75A]`} onClick={() => { window.location.href = `${AUTH_BASE_URL}/oauth2/authorization/naver` }}>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#03C75A" d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
              </svg>
              Naver로 계속하기
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">또는</span></div>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input id="username" type="text" placeholder="아이디를 입력하세요" value={userName} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "로그인"}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">계정이 없으신가요? </span>
            <Link href="/signup" className="text-primary font-bold hover:underline">회원가입</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}