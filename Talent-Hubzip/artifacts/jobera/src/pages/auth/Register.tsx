import { useState } from "react"
import { Link, useLocation } from "wouter"
import { useRegister } from "@workspace/api-client-react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle } from "lucide-react"
import { type RegisterInputRole } from "@workspace/api-client-react"
import { dashboardPathForRole } from "@/lib/api"

export default function Register() {
  const [role, setRole] = useState<RegisterInputRole>("candidate")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  
  const registerMutation = useRegister()
  const { login } = useAuth()
  const [, setLocation] = useLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!fullName || !email || !password) {
      setError("Zəhmət olmasa bütün sahələri doldurun")
      return
    }

    if (password.length < 6) {
      setError("Şifrə ən azı 6 simvoldan ibarət olmalıdır")
      return
    }

    registerMutation.mutate({ data: { fullName, email, password, role } }, {
      onSuccess: (data) => {
        login(data.token, data.user)
        setLocation(dashboardPathForRole(data.user.role))
      },
      onError: (err: any) => {
        setError(err.message || "Qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa fərqli e-poçt yoxlayın.")
      }
    })
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 bg-muted/30 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold tracking-tight text-primary">Jobera.az</Link>
          <p className="text-muted-foreground mt-2">Platformaya qoşulun</p>
        </div>

        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader>
            <CardTitle>Qeydiyyat</CardTitle>
            <CardDescription>Hesab yaratmaq üçün məlumatlarınızı daxil edin.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="candidate" value={role} onValueChange={(v) => setRole(v as RegisterInputRole)} className="w-full mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="candidate">Namizəd</TabsTrigger>
                <TabsTrigger value="hr">Şirkət / HR</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="fullName">{role === 'hr' ? 'Şirkət və ya HR Adı' : 'Ad və Soyad'}</Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  placeholder={role === 'hr' ? "Şirkətin adı" : "Məmməd Məmmədov"} 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

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
                <Label htmlFor="password">Şifrə</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Minimum 6 simvol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Qeydiyyatdan keçilir..." : "Qeydiyyatdan keç"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <p className="text-sm text-muted-foreground">
              Artıq hesabınız var?{" "}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Daxil olun
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
