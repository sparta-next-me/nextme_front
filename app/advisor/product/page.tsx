"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Pencil, Trash2, Clock, CalendarDays, 
  Wallet, Briefcase, Loader2, ChevronRight, LayoutGrid 
} from "lucide-react"
import { useRouter } from "next/navigation"
import ProductFormModal from "@/app/advisor/modal/productFromModal"

interface Product {
  productId: string;
  productName: string;
  description: string;
  category: string;
  durationMin: number;
  price: number;
  dayOfWeek: string;
  startTime: number;
  endTime: number;
}

export default function AdvisorProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    const token = localStorage.getItem("accessToken")
    try {
      const res = await fetch("http://34.50.7.8:30000/v1/products", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      // 전체 조회 시 API 명세에 따라 리스트 세팅
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("상품 로드 실패", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleDelete = async (productId: string) => {
    if (!confirm("정말 이 상품을 삭제하시겠습니까?")) return
    const token = localStorage.getItem("accessToken")
    await fetch(`http://34.50.7.8:30000/v1/products/${productId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    })
    fetchProducts()
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase mb-2">My Products</h1>
            <p className="text-muted-foreground font-bold text-sm">전문가님의 지식을 상품화하여 제공해보세요.</p>
          </div>
          <Button 
            onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="h-12 px-6 rounded-xl font-black shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-5 w-5" /> 새 상품 등록
          </Button>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length > 0 ? products.map((product) => (
              <Card key={product.productId} className="group relative overflow-hidden border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <Badge variant="secondary" className="font-bold px-3 py-1 rounded-md text-[10px] bg-secondary/50 uppercase">
                      {product.category}
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEditModal(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(product.productId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight mb-2 line-clamp-1">{product.productName}</h3>
                  <p className="text-sm text-muted-foreground font-medium mb-6 line-clamp-2 h-10 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-primary" /> 
                      <span>{product.durationMin}분 세션 · {product.startTime} ~ {product.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" /> 
                      <span>매주 {product.dayOfWeek}요일</span>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-border flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase mb-0.5">Price</span>
                      <span className="text-xl font-black text-primary tracking-tight">₩{product.price.toLocaleString()}</span>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                       <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </Card>
            )) : (
              <div className="col-span-full py-32 text-center border-2 border-dashed border-border rounded-3xl bg-card/30">
                 <Briefcase className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                 <p className="text-muted-foreground font-bold italic tracking-wider uppercase">등록된 상품이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Create/Edit Modal */}
      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedProduct}
        onSuccess={fetchProducts}
      />
    </div>
  )
}