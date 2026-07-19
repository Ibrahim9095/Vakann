import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="text-xl font-bold tracking-tight text-primary">
              Jobera.az
            </Link>
            <p className="text-sm text-muted-foreground">
              Azərbaycanın ən müasir və insan yönümlü iş platforması. Doğru namizədi və doğru işi asanlıqla tapın.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Namizədlər üçün</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/jobs" className="hover:text-primary">Vakansiyalar</Link></li>
              <li><Link href="/auth/register" className="hover:text-primary">Qeydiyyat</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary">Daxil ol</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Şirkətlər üçün</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/companies" className="hover:text-primary">Şirkətlər</Link></li>
              <li><Link href="/candidates" className="hover:text-primary">Namizədlər bazası</Link></li>
              <li><Link href="/auth/register" className="hover:text-primary">Şirkət qeydiyyatı</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary">Daxil ol</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Əlaqə</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>info@jobera.az</li>
              <li>+994 12 345 67 89</li>
              <li>Bakı, Azərbaycan</li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Jobera.az. Bütün hüquqlar qorunur.
        </div>
      </div>
    </footer>
  )
}
