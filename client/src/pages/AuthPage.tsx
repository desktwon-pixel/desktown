import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { language } = useLanguage();
  // Check for admin query param
  const searchParams = new URLSearchParams(window.location.search);
  const isAdminLogin = searchParams.get('admin') === 'true';

  const { loginMutation, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in as admin
  if (user && (user.role === 'admin' || user.role === 'super_admin') && isAdminLogin) {
    setLocation("/admin/platform");
    return null;
  }

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    try {
      const data = await loginMutation.mutateAsync({ username: loginUsername, password: loginPassword });
      
      // Redirect based on role
      if (data.user?.role === 'admin' || data.user?.role === 'super_admin') {
        setLocation("/admin/platform");
      } else if (data.user?.role === 'visitor') {
        setLocation("/welcome");
      } else {
        setLocation("/dashboard");
      }
    } catch (error: any) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {isAdminLogin ? "دخول الإدارة" : "مرحباً بك في DeskTown"}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isAdminLogin ? "دخول مباشر وآمن للمشرفين" : "قم بتسجيل الدخول إلى حسابك"}
          </p>
        </div>

        <Card className="w-full border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>{isAdminLogin ? "الإدارة" : "تسجيل الدخول"}</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{language === 'ar' ? 'اسم المستخدم أو البريد' : 'Username or Email'}</Label>
                <Input 
                  id="username" 
                  type="text" 
                  placeholder={language === 'ar' ? 'أدخل اسم المستخدم أو البريد' : 'Enter your username or email'}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                />
                {isAdminLogin && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {language === 'ar' 
                      ? '* بالنسبة للمكاتب، يتم استخدام بيانات الدخول التي سجلتها الإدارة عند إضافة الشركة.' 
                      : '* For offices, please use the credentials registered by the administration during company setup.'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ar' ? 'جاري الدخول...' : 'Logging in...'}
                  </>
                ) : (
                  language === 'ar' ? 'تسجيل الدخول' : 'Sign In'
                )}
              </Button>
              {isAdminLogin && (
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setLocation("/")}
                >
                  {language === 'ar' ? 'العودة للموقع' : 'Back to Website'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
