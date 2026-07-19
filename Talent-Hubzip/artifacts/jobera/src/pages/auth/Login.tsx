import { useState } from "react"
import { Link, useLocation } from "wouter"
import { useLogin } from "@workspace/api-client-react"
import { useAuth } from "@/context/auth-context"
import { dashboardPathForRole } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  
  const loginMutation = useLogin()
  const { login } = useAuth()
  const [, setLocation] = useLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email || !password) {
      setError("Zəhmət olmasa bütün sahələri doldurun")
      return
    }

    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        login(data.token, data.user)
        setLocation(dashboardPathForRole(data.user.role))
      },
      onError: (err: any) => {
        setError(err.message || "Daxil olarkən xəta baş verdi. E-poçt və ya şifrə yanlışdır.")
      }
    })
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold tracking-tight text-primary">Jobera.az</Link>
          <p className="text-muted-foreground mt-2">İş dünyasına xoş gəlmisiniz</p>
        </div>

        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader>
            <CardTitle>Daxil ol</CardTitle>
            <CardDescription>Hesabınıza daxil olmaq üçün məlumatlarınızı daxil edin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-poçt</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Şifrə</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Daxil olunur..." : "Daxil ol"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <p className="text-sm text-muted-foreground">
              Hesabınız yoxdur?{" "}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">
                Qeydiyyatdan keçin
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
