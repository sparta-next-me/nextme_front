// /app/oauth/redirect/page.js

"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function OAuthRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get("accessToken")
    const refreshToken = searchParams.get("refreshToken")
    const name = searchParams.get("name")
    const error = searchParams.get("error")
    const userId = searchParams.get("userId")
    // 주의: 백엔드에서 주는 파라미터명이 'roles'인지 'role'인지 확인하세요.
    const role = searchParams.get("roles") || searchParams.get("role") 

    if (error) {
      console.error("OAuth Login Error:", error)
      alert("소셜 로그인에 실패했습니다: " + error)
      router.push("/login")
      return
    }

    if (accessToken && refreshToken && name && userId && role) {
      // 1. 토큰 및 사용자 정보 저장
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("name", name)
      localStorage.setItem("userId", userId)
      localStorage.setItem("role", role) // 키 이름을 'role'로 통일해서 저장

      console.log(`로그인 성공! 권한: ${role}`)

      // 2. 권한별 리다이렉트 로직 (수정된 부분)
      if (role === "MASTER" || role === "MANAGER") {
        router.push("/admin")
      } else if (role === "ADVISOR") {
        router.push("/advisor")
      } else if (role === "USER") {
        router.push("/dashboard")
      } else {
        // 정의되지 않은 권한일 경우 기본 페이지로
        console.warn("정의되지 않은 권한입니다:", role)
        router.push("/dashboard")
      }
      
    } else {
      console.warn("리다이렉트되었으나 필수 정보가 누락되었습니다.")
      const timer = setTimeout(() => {
          router.push("/login")
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <h1 className="text-xl font-semibold text-gray-700">로그인 처리 중입니다...</h1>
        <p className="text-sm text-gray-500">권한에 맞는 페이지로 이동 중입니다.</p>
      </div>
    </div>
  )
}